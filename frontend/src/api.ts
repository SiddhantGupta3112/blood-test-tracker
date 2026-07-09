import {
  LoginResponse,
  UserResponse,
  Report,
  ReportSummary,
  StandaloneEntry,
  BiomarkerHistory,
} from './types';

// Read backend API base URL from Vite environment variables.
// Default to empty or a relative API if not defined, allowing flexibility.
export const API_BASE_URL = (((import.meta as any).env?.VITE_API_BASE_URL) || '').replace(/\/$/, '');

/**
 * Custom API Error class to handle different response states
 */
export class ApiError extends Error {
  status: number;
  details: any;

  constructor(message: string, status: number, details: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Retrieves the stored access token from localStorage
 */
export function getStoredToken(): string | null {
  return localStorage.getItem('access_token');
}

/**
 * Stores the access token in localStorage for persistent login
 */
export function setStoredToken(token: string): void {
  localStorage.setItem('access_token', token);
}

/**
 * Clears the stored access token
 */
export function clearStoredToken(): void {
  localStorage.removeItem('access_token');
}

/**
 * Custom event emitter to handle 401 unauthorized globally
 */
export const logoutEvent = new EventTarget();

export function emitLogout(): void {
  clearStoredToken();
  logoutEvent.dispatchEvent(new Event('unauthorized'));
}

/**
 * Helper to perform authenticated and unauthenticated fetch requests.
 * Handles:
 * - Injection of Authorization Bearer header
 * - Parsing 401 and logging out the user
 * - Formatting 429 rate limit messages
 * - Processing 422 and 400 validation messages
 * - Gracefully handling network/fetch failures
 */
async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const url = `${API_BASE_URL}${path}`;

  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const updatedOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, updatedOptions);

    if (response.status === 401) {
      emitLogout();
      throw new ApiError('Session expired. Please log in again.', 401);
    }

    if (response.status === 429) {
      throw new ApiError('Too many attempts. Please wait a moment.', 429);
    }

    if (!response.ok) {
      let errorDetails: any = null;
      let errorMessage = 'An unexpected error occurred.';

      try {
        const body = await response.json();
        errorDetails = body;
        
        // Handle FastAPI validation details
        if (body.detail) {
          if (Array.isArray(body.detail)) {
            errorMessage = body.detail.map((err: any) => {
              if (err.loc && Array.isArray(err.loc)) {
                const field = err.loc[err.loc.length - 1];
                return `"${field}" is invalid/missing: ${err.msg}`;
              }
              return err.msg || JSON.stringify(err);
            }).join(', ');
          } else {
            errorMessage = body.detail;
          }
        } else if (body.message) {
          errorMessage = body.message;
        }
      } catch {
        // If response is not JSON
        errorMessage = `Request failed with status ${response.status}: ${response.statusText}`;
      }

      throw new ApiError(errorMessage, response.status, errorDetails);
    }

    // 204 No Content or empty responses
    if (response.status === 204) {
      return {} as T;
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or fetch connection failure
    throw new ApiError(
      `Network connection failed. Could not connect to API server at: ${url}. Please make sure the backend is active.`,
      0
    );
  }
}

/**
 * API endpoints
 */
export const api = {
  // Auth
  register: async (data: any): Promise<UserResponse> => {
    return fetchApi<UserResponse>('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  login: async (data: any): Promise<LoginResponse> => {
    return fetchApi<LoginResponse>('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  getMe: async (): Promise<UserResponse> => {
    return fetchApi<UserResponse>('/auth/me');
  },

  // PDF Reports & Uploads
  uploadPdf: async (file: File): Promise<Report> => {
    const formData = new FormData();
    formData.append('file', file);

    return fetchApi<Report>('/pdf/upload', {
      method: 'POST',
      body: formData,
      // Note: Let fetch set Content-Type header with the boundary for multipart/form-data
    });
  },

  validateReport: async (reportId: number, data: Report): Promise<void> => {
    return fetchApi<void>(`/pdf/validate/${reportId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  editReport: async (reportId: number, data: Report): Promise<void> => {
    return fetchApi<void>(`/pdf/reports/${reportId}/edit`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  getKnownTestNames: async (): Promise<string[]> => {
    try {
      return await fetchApi<string[]>('/pdf/known-test-names');
    } catch {
      return [];
    }
  },

  createStandalone: async (data: StandaloneEntry): Promise<void> => {
    return fetchApi<void>('/pdf/standalone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  getReports: async (): Promise<ReportSummary[]> => {
    const reports = await fetchApi<ReportSummary[]>('/pdf/reports');
    return reports.map((rep) => {
      const savedEditStr = localStorage.getItem(`edited_report_${rep.report_id}`);
      if (savedEditStr) {
        try {
          const savedEdit = JSON.parse(savedEditStr) as Report;
          return {
            ...rep,
            file_name: savedEdit.report_metadata.file_name || rep.file_name,
            collection_date: savedEdit.report_metadata.collection_date || rep.collection_date,
            lab_name: savedEdit.report_metadata.lab_name,
            number_of_test: savedEdit.report_data.length,
            age: typeof savedEdit.report_metadata.age === 'number' ? savedEdit.report_metadata.age : rep.age,
            tags: savedEdit.report_metadata.tags || [],
          };
        } catch {}
      }
      return rep;
    });
  },

  getTests: async (): Promise<string[]> => {
    try {
      const data = await fetchApi<{ tests: string[] | null }>('/tests');
      return data.tests || [];
    } catch {
      return [];
    }
  },

  deleteReport: async (reportId: number): Promise<void> => {
    return fetchApi<void>(`/pdf/reports/${reportId}`, {
      method: 'DELETE',
    });
  },

  deleteAccount: async (): Promise<void> => {
    return fetchApi<void>('/auth/me', {
      method: 'DELETE',
    });
  },

  // Trend Plots & Details
  getPlotsTests: async (): Promise<string[]> => {
    const serverTests = await fetchApi<string[]>('/plots/my-tests');
    const testSet = new Set<string>(serverTests);

    // Add any edited report biomarkers that are verified
    const editedReportKeys = Object.keys(localStorage).filter((k) => k.startsWith('edited_report_'));
    for (const key of editedReportKeys) {
      const reportId = key.replace('edited_report_', '');
      const isVerified = localStorage.getItem(`verified_report_${reportId}`) === 'true';
      if (!isVerified) continue;

      try {
        const report = JSON.parse(localStorage.getItem(key)!) as Report;
        for (const item of report.report_data) {
          if (item.test_name) {
            testSet.add(item.test_name);
          }
        }
      } catch {}
    }

    return Array.from(testSet).sort();
  },

  getPlotsHistory: async (testName: string): Promise<BiomarkerHistory> => {
    const data = await fetchApi<BiomarkerHistory>(`/plots/history/${encodeURIComponent(testName)}`);
    const results = data.results || [];

    // Load edited/local reports to override
    const editedReportKeys = Object.keys(localStorage).filter((k) => k.startsWith('edited_report_'));
    const updatedResults = [...results];

    for (const key of editedReportKeys) {
      const reportId = key.replace('edited_report_', '');
      const isVerified = localStorage.getItem(`verified_report_${reportId}`) === 'true';
      if (!isVerified) continue;

      try {
        const report = JSON.parse(localStorage.getItem(key)!) as Report;
        const testItem = report.report_data.find(
          (d) => d.test_name.toLowerCase() === testName.toLowerCase()
        );

        if (testItem) {
          const existingIdx = updatedResults.findIndex(
            (r) => r.collection_date === report.report_metadata.collection_date
          );

          const historyItem = {
            value: testItem.value,
            unit: testItem.unit || null,
            lower_bound: testItem.lower_bound ?? null,
            upper_bound: testItem.upper_bound ?? null,
            is_abnormal: testItem.is_abnormal || false,
            collection_date: report.report_metadata.collection_date,
            age: typeof report.report_metadata.age === 'number' ? report.report_metadata.age : 0,
            lab_name: report.report_metadata.lab_name,
          };

          if (existingIdx !== -1) {
            updatedResults[existingIdx] = historyItem;
          } else {
            updatedResults.push(historyItem);
          }
        }
      } catch {}
    }

    // Sort by collection date ascending
    updatedResults.sort((a, b) => new Date(a.collection_date).getTime() - new Date(b.collection_date).getTime());

    return {
      test_name: testName,
      results: updatedResults,
    };
  },

  getPlotsReport: async (reportId: number): Promise<Report> => {
    const savedEdit = localStorage.getItem(`edited_report_${reportId}`);
    if (savedEdit) {
      try {
        return JSON.parse(savedEdit) as Report;
      } catch {}
    }
    return fetchApi<Report>(`/plots/report/${reportId}`);
  },
};
