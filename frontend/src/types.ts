/**
 * Type definitions for Blood Test Tracker Frontend.
 */

export interface UserResponse {
  user_id: number;
  full_name: string;
  email: string;
  date_of_birth: string | null; // YYYY-MM-DD
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface BiomarkerValue {
  test_name: string;
  value: number;
  unit?: string | null;
  lower_bound?: number | null;
  upper_bound?: number | null;
  is_abnormal?: boolean; // optional, returned in history or as fallback
}

export interface ReportMetadata {
  collection_date: string; // YYYY-MM-DD
  lab_name: string | null;
  file_name: string | null;
  age?: number | null;
  tags?: string[];
}

export interface Report {
  report_id: number;
  report_metadata: ReportMetadata;
  report_data: BiomarkerValue[];
  verified?: boolean; // Used client-side or if backend supports status tracking
  status?: string;
}

export interface ReportSummary {
  report_id: number;
  file_name: string;
  collection_date: string; // YYYY-MM-DD
  age: number;
  lab_name: string | null;
  number_of_test: number;
  tags?: string[];
  status?: string;
}

export interface StandaloneBiomarker {
  test_name: string;
  value: number;
  unit?: string | null;
  lower_bound?: number | null;
  upper_bound?: number | null;
}

export interface StandaloneEntry {
  file_name: string;
  collection_date: string; // YYYY-MM-DD (cannot be in future)
  lab_name?: string | null;
  biomarkers: StandaloneBiomarker[];
}

export interface BiomarkerHistoryItem {
  value: number;
  unit: string | null;
  lower_bound: number | null;
  upper_bound: number | null;
  is_abnormal: boolean;
  collection_date: string; // YYYY-MM-DD
  age: number;
  lab_name: string | null;
}

export interface BiomarkerHistory {
  test_name: string;
  results: BiomarkerHistoryItem[];
}

export type BiomarkerStatus = 'Normal' | 'High' | 'Low' | 'Abnormal' | 'Neutral';

export interface BiomarkerStatusDetails {
  status: BiomarkerStatus;
  colorClass: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
}
