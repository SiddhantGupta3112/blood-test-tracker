import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, FileSpreadsheet, ChevronRight, AlertCircle, RefreshCw, Upload } from 'lucide-react';
import { api } from '../api';
import { ReportSummary } from '../types';
import { formatDate } from '../utils';

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load verified status list from localStorage
  const [verifiedMap, setVerifiedMap] = useState<Record<number, boolean>>({});

  // Filter and sort states
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'needs_review' | 'manual'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'tests_desc' | 'tests_asc'>('date_desc');

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReports();
      setReports(data);

      // Populate local verified state map
      const map: Record<number, boolean> = {};
      data.forEach((r) => {
        const isVerified = r.status === 'verified' || (r.file_name && r.file_name.startsWith('[Manual]')) || localStorage.getItem(`verified_report_${r.report_id}`) === 'true';
        map[r.report_id] = isVerified;
      });
      setVerifiedMap(map);
    } catch (err: any) {
      setError(err.message || 'Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // De-duplicate, filter, and sort reports chronologically and by other constraints
  const filteredAndSortedReports = (() => {
    // 1. Remove duplicate report IDs (from backend/data issues if any)
    const unique = reports.filter((report, index, self) =>
      self.findIndex((r) => r.report_id === report.report_id) === index
    );

    // 2. Filter by status
    const filtered = unique.filter((report) => {
      const isManual = report.file_name && report.file_name.startsWith('[Manual]');
      const isVerified = verifiedMap[report.report_id] === true;

      if (statusFilter === 'verified') {
        return isVerified && !isManual;
      }
      if (statusFilter === 'needs_review') {
        return !isVerified && !isManual;
      }
      if (statusFilter === 'manual') {
        return isManual;
      }
      return true;
    });

    // 3. Sort
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.collection_date).getTime() - new Date(a.collection_date).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.collection_date).getTime() - new Date(b.collection_date).getTime();
      }
      if (sortBy === 'tests_desc') {
        return b.number_of_test - a.number_of_test;
      }
      if (sortBy === 'tests_asc') {
        return a.number_of_test - b.number_of_test;
      }
      return 0;
    });
  })();

  return (
    <div className="space-y-6" id="reports-list-container">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 leading-tight">My Medical Reports</h3>
          <p className="text-base text-slate-500 mt-1">
            View, verify, and track your clinical laboratory records over time.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchReports}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-base font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            title="Refresh list"
            id="refresh-reports-btn"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/upload-pdf')}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 text-base font-bold text-white hover:bg-teal-800 active:bg-teal-900 transition-colors focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            id="upload-pdf-cta-btn"
          >
            <Upload className="h-5 w-5" />
            <span>Upload PDF Report</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3" id="reports-error-banner">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to Load Reports</p>
            <p className="mt-1">{error}</p>
            <button
              onClick={fetchReports}
              className="mt-2 text-sm font-bold text-red-700 underline hover:text-red-800"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Filter and Sort controls */}
      {!loading && reports.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 bg-slate-100/60 rounded-xl border border-slate-200" id="reports-filter-bar">
          <div className="flex flex-wrap gap-2 items-center" id="filter-status-tabs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1.5">Filter:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'verified', label: 'Verified' },
              { id: 'needs_review', label: 'Needs Review' },
              { id: 'manual', label: 'Manual Entries' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors min-h-[32px] ${
                  statusFilter === tab.id
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                id={`filter-tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto" id="sort-controls">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500 w-full md:w-auto min-h-[36px]"
              id="reports-sort-select"
            >
              <option value="date_desc">Collection Date (Newest First)</option>
              <option value="date_asc">Collection Date (Oldest First)</option>
              <option value="tests_desc">Biomarker Count (High to Low)</option>
              <option value="tests_asc">Biomarker Count (Low to High)</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4" id="reports-loading-indicator">
          <RefreshCw className="h-10 w-10 text-teal-700 animate-spin" />
          <p className="text-base text-slate-500 font-medium">Fetching reports from server...</p>
        </div>
      ) : reports.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 py-16" id="reports-empty-state">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 mb-5">
            <FileText className="h-8 w-8" />
          </div>
          <h4 className="text-xl font-bold text-slate-900">No reports yet</h4>
          <p className="mt-2 text-base text-slate-600 max-w-md mx-auto">
            Upload your first lab report PDF or record a standalone home health reading to get started.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate('/upload-pdf')}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-teal-700 px-6 text-base font-bold text-white hover:bg-teal-800 active:bg-teal-900 transition-colors"
              id="empty-upload-btn"
            >
              <Upload className="h-5 w-5" />
              <span>Upload PDF Scan</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/add-entry')}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 text-base font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              id="empty-manual-btn"
            >
              <Plus className="h-5 w-5" />
              <span>Add Manual Entry</span>
            </button>
          </div>
        </div>
      ) : filteredAndSortedReports.length === 0 ? (
        /* Filtered Empty State */
        <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 py-16" id="reports-filtered-empty">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 mb-4">
            <FileText className="h-6 w-6" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">No matching reports</h4>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            There are no reports matching your current filter selection.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setSortBy('date_desc');
            }}
            className="mt-4 px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 transition-colors min-h-[32px]"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* Reports Table/Grid list */
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" id="reports-table-container">
          <div className="divide-y divide-slate-100">
            {filteredAndSortedReports.map((report) => {
              const isVerified = verifiedMap[report.report_id] === true;
              const isManual = report.file_name && report.file_name.startsWith('[Manual]');
              const displayName = isManual ? report.file_name.replace('[Manual]', '').trim() : (report.file_name || 'Lab Report');
              return (
                <div
                  key={report.report_id}
                  onClick={() => navigate(`/reports/${report.report_id}`)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50/50 transition-colors cursor-pointer group gap-4 min-h-[44px]"
                  id={`report-item-${report.report_id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-150 group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-lg font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                          {displayName}
                        </span>
                        
                        {/* Needs Review / Verified / Manual Entry Badge */}
                        {isManual ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-800 border border-blue-200"
                            id={`report-badge-manual-${report.report_id}`}
                          >
                            Manual Entry
                          </span>
                        ) : !isVerified ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200"
                            id={`report-badge-${report.report_id}`}
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                            Needs review
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-teal-50 text-teal-800 border border-teal-200"
                            id={`report-badge-verified-${report.report_id}`}
                          >
                            Verified
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 font-medium">
                        <span>Date: <strong className="text-slate-700">{formatDate(report.collection_date)}</strong></span>
                        {report.lab_name && (
                          <span className="hidden sm:inline">•</span>
                        )}
                        {report.lab_name && (
                          <span>Lab: <strong className="text-slate-700">{report.lab_name}</strong></span>
                        )}
                        <span className="hidden sm:inline">•</span>
                        <span>Age at test: <strong className="text-slate-700">{report.age}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-slate-50 sm:border-0 pt-3 sm:pt-0">
                    <span className="text-sm font-semibold text-slate-500 bg-slate-100 rounded-lg px-3 py-1.5 border border-slate-200">
                      {report.number_of_test} {report.number_of_test === 1 ? 'biomarker' : 'biomarkers'}
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
