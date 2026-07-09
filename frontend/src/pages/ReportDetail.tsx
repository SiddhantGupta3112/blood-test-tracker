import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Trash2, Calendar, Landmark, User, AlertCircle, RefreshCw, FileText, Edit2, Save, Plus, Trash, X } from 'lucide-react';
import { api } from '../api';
import { Report } from '../types';
import { formatDate, getBiomarkerStatus, formatReferenceRange } from '../utils';
import ConfirmationModal from '../components/ConfirmationModal';

export default function ReportDetail() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verification state (read from localStorage or local action)
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Deletion modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editMeta, setEditMeta] = useState({
    file_name: '',
    collection_date: '',
    lab_name: '',
    age: '',
    tags: '',
  });
  const [editData, setEditData] = useState<any[]>([]);
  const [testNames, setTestNames] = useState<string[]>([]);

  const numericReportId = reportId ? parseInt(reportId, 10) : NaN;

  // Fetch test names on mount for autocomplete search
  useEffect(() => {
    const fetchExistingTests = async () => {
      try {
        const tests = await api.getKnownTestNames();
        setTestNames(tests.sort());
      } catch {}
    };
    fetchExistingTests();
  }, []);

  const fetchReportDetails = async () => {
    if (isNaN(numericReportId)) {
      setError('Invalid report ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // First check localStorage for a saved edit
      const savedEdit = localStorage.getItem(`edited_report_${numericReportId}`);
      let loadedReport: Report;
      if (savedEdit) {
        loadedReport = JSON.parse(savedEdit);
      } else {
        loadedReport = await api.getPlotsReport(numericReportId);
      }
      setReport(loadedReport);
      
      // Determine if verified from server status, localStorage, or auto-verified [Manual] prefix
      const serverVerified = loadedReport?.status === 'verified';
      const localVerified = localStorage.getItem(`verified_report_${numericReportId}`) === 'true' || serverVerified;
      const isManual = loadedReport?.report_metadata?.file_name?.startsWith('[Manual]') || false;
      
      if (isManual) {
        if (!localVerified) {
          localStorage.setItem(`verified_report_${numericReportId}`, 'true');
        }
        setIsVerified(true);
      } else {
        if (serverVerified && !localStorage.getItem(`verified_report_${numericReportId}`)) {
          localStorage.setItem(`verified_report_${numericReportId}`, 'true');
        }
        setIsVerified(localVerified);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch report details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportDetails();
  }, [reportId]);

  const handleVerify = async () => {
    if (isNaN(numericReportId) || !report) return;
    setVerifying(true);
    try {
      const payload: Report = {
        ...report,
        status: 'verified',
      };
      await api.validateReport(numericReportId, payload);
      localStorage.setItem(`verified_report_${numericReportId}`, 'true');
      setIsVerified(true);
    } catch (err: any) {
      setError(err.message || 'Failed to verify report on the server. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async () => {
    if (isNaN(numericReportId)) return;
    setDeleting(true);
    try {
      await api.deleteReport(numericReportId);
      // Clean up localStorage
      localStorage.removeItem(`verified_report_${numericReportId}`);
      localStorage.removeItem(`edited_report_${numericReportId}`);
      navigate('/reports');
    } catch (err: any) {
      setError(err.message || 'Failed to delete report.');
      setDeleting(false);
    }
  };

  const startEditing = () => {
    if (!report) return;
    const currentAge = report.report_metadata.age !== undefined && report.report_metadata.age !== null 
      ? report.report_metadata.age.toString() 
      : (report as any).age !== undefined && (report as any).age !== null 
        ? (report as any).age.toString() 
        : '';
    setEditMeta({
      file_name: report.report_metadata.file_name || 'Lab Report',
      collection_date: report.report_metadata.collection_date || '',
      lab_name: report.report_metadata.lab_name || '',
      age: currentAge,
      tags: report.report_metadata.tags ? report.report_metadata.tags.join(', ') : '',
    });
    setEditData(
      report.report_data.map((item) => ({
        test_name: item.test_name || '',
        value: item.value !== undefined ? item.value.toString() : '',
        unit: item.unit || '',
        lower_bound: item.lower_bound !== undefined && item.lower_bound !== null ? item.lower_bound.toString() : '',
        upper_bound: item.upper_bound !== undefined && item.upper_bound !== null ? item.upper_bound.toString() : '',
      }))
    );
    setIsEditing(true);
  };

  const updateRow = (index: number, key: string, val: string) => {
    const updated = [...editData];
    updated[index] = { ...updated[index], [key]: val };
    setEditData(updated);
  };

  const addRow = () => {
    setEditData([
      ...editData,
      {
        test_name: '',
        value: '',
        unit: '',
        lower_bound: '',
        upper_bound: '',
      },
    ]);
  };

  const deleteRow = (index: number) => {
    const updated = editData.filter((_, idx) => idx !== index);
    setEditData(updated);
  };

  const handleSaveEdits = async () => {
    if (!report) return;
    setError(null);

    // Validate date
    if (!editMeta.collection_date) {
      setError('Collection date is required.');
      return;
    }

    const selectedDate = new Date(editMeta.collection_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
      setError('Collection date cannot be in the future.');
      return;
    }

    // Validate age
    let parsedAge: number | null = null;
    if (editMeta.age.trim()) {
      const ageNum = parseInt(editMeta.age, 10);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
        setError('Age must be a valid number between 0 and 150.');
        return;
      }
      parsedAge = ageNum;
    }

    // Validate biomarker row inputs
    for (let i = 0; i < editData.length; i++) {
      const row = editData[i];
      if (!row.test_name.trim()) {
        setError(`Row ${i + 1}: Biomarker Name is required.`);
        return;
      }
      const valNum = parseFloat(row.value);
      if (isNaN(valNum)) {
        setError(`Row ${i + 1} (${row.test_name}): Value must be a valid number.`);
        return;
      }
    }

    // Parse tags
    const tagsArray = editMeta.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const updatedReport: Report = {
      ...report,
      report_metadata: {
        file_name: editMeta.file_name.trim() || 'Lab Report',
        collection_date: editMeta.collection_date,
        lab_name: editMeta.lab_name.trim() || null,
        age: parsedAge,
        tags: tagsArray,
      },
      report_data: editData.map((row) => {
        const val = parseFloat(row.value);
        const lower = row.lower_bound.trim() ? parseFloat(row.lower_bound) : null;
        const upper = row.upper_bound.trim() ? parseFloat(row.upper_bound) : null;
        return {
          test_name: row.test_name.trim(),
          value: val,
          unit: row.unit.trim() || null,
          lower_bound: isNaN(lower as any) ? null : lower,
          upper_bound: isNaN(upper as any) ? null : upper,
        };
      }),
    };

    setLoading(true);
    try {
      await api.editReport(numericReportId, updatedReport);
      localStorage.setItem(`edited_report_${numericReportId}`, JSON.stringify(updatedReport));
      setReport(updatedReport);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save edits to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdits = () => {
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4" id="report-detail-loading">
        <RefreshCw className="h-10 w-10 text-teal-700 animate-spin" />
        <p className="text-base text-slate-500 font-medium">Parsing and formatting report details...</p>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="space-y-4" id="report-detail-error">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error Loading Report</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/reports')}
          className="flex min-h-[44px] items-center gap-2 text-base font-bold text-teal-700 hover:text-teal-800"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Back to reports list</span>
        </button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-6" id="report-detail-not-found">
        <p className="text-lg text-slate-500 font-medium">Report not found.</p>
        <button
          type="button"
          onClick={() => navigate('/reports')}
          className="mt-4 flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 text-base font-bold text-white mx-auto hover:bg-teal-800 active:bg-teal-900"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Back to Reports</span>
        </button>
      </div>
    );
  }

  const { report_metadata, report_data } = report;

  return (
    <div className="space-y-6 animate-fade-in" id="report-detail-container">
      {/* Back navigation and Actions header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <button
          type="button"
          onClick={() => navigate('/reports')}
          className="flex min-h-[44px] items-center gap-1 text-slate-500 hover:text-slate-800 font-bold text-base bg-white border border-slate-300 rounded-lg px-3 py-1 self-start transition-colors"
          id="back-to-reports-btn"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Back to Reports</span>
        </button>

        <div className="flex flex-wrap gap-3">
          {isEditing ? (
            <>
              {/* Edit Mode Save & Cancel actions */}
              <button
                type="button"
                onClick={handleSaveEdits}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 text-base font-bold text-white hover:bg-teal-800 active:bg-teal-900 transition-colors shadow-sm"
                id="save-edits-btn"
              >
                <Save className="h-5 w-5" />
                <span>Save Changes</span>
              </button>

              <button
                type="button"
                onClick={handleCancelEdits}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-base font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                id="cancel-edits-btn"
              >
                <X className="h-5 w-5" />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <>
              {/* Edit toggle button (allowed for all reports, including verified ones) */}
              <button
                type="button"
                onClick={startEditing}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-teal-300 bg-white px-4 text-base font-bold text-teal-700 hover:bg-teal-50 transition-colors shadow-sm"
                id="toggle-edit-btn"
              >
                <Edit2 className="h-5 w-5" />
                <span>Edit Parsed Data</span>
              </button>

              {/* Validation confirmation button */}
              {!isVerified ? (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 text-base font-bold text-white hover:bg-teal-800 active:bg-teal-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  id="verify-report-btn"
                >
                  <Check className="h-5 w-5" />
                  <span>{verifying ? 'Verifying...' : 'Verify Report'}</span>
                </button>
              ) : (
                <span
                  className="flex min-h-[44px] items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 text-base font-bold text-teal-800"
                  id="verified-report-badge"
                >
                  <Check className="h-5 w-5 text-teal-700" />
                  <span>Verified and Logged</span>
                </span>
              )}

              {/* Delete action */}
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={deleting}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 text-base font-semibold text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                id="delete-report-btn"
              >
                <Trash2 className="h-5 w-5" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Embedded error banner inside detail */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3" id="detail-error-alert">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Report Metadata Block */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4" id="report-meta-card">
        <div className="flex items-center gap-3 border-b border-slate-150 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
            <FileText className="h-5.5 w-5.5" />
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Document Label / File Name</label>
                <input
                  type="text"
                  className="block w-full max-w-md min-h-[40px] rounded-lg border border-slate-300 px-3 py-1.5 text-base font-bold text-slate-950 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                  value={editMeta.file_name}
                  onChange={(e) => setEditMeta({ ...editMeta, file_name: e.target.value })}
                  placeholder="e.g. Lab Report, June 2026"
                />
              </div>
            ) : (
              <>
                <h4 className="text-xl font-bold text-slate-900">
                  {report_metadata.file_name?.startsWith('[Manual]')
                    ? report_metadata.file_name.replace('[Manual]', '').trim()
                    : (report_metadata.file_name || 'Lab Report')}
                </h4>
                {report_metadata.file_name?.startsWith('[Manual]') ? (
                  <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    Manual Entry — automatically verified and saved to histories
                  </span>
                ) : !isVerified && (
                  <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <AlertCircle className="h-3.5 w-3.5" /> Needs Review — please verify parsed data below is correct or click Edit
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" id="meta-details-grid">
          <div className="flex items-center gap-3">
            <Calendar className="h-5.5 w-5.5 text-slate-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collection Date</p>
              {isEditing ? (
                <input
                  type="date"
                  className="block w-full mt-1 min-h-[40px] rounded-lg border border-slate-300 px-3 py-1 text-base text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                  value={editMeta.collection_date}
                  onChange={(e) => setEditMeta({ ...editMeta, collection_date: e.target.value })}
                />
              ) : (
                <p className="text-base font-bold text-slate-700">{formatDate(report_metadata.collection_date)}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Landmark className="h-5.5 w-5.5 text-slate-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Laboratory</p>
              {isEditing ? (
                <input
                  type="text"
                  className="block w-full mt-1 min-h-[40px] rounded-lg border border-slate-300 px-3 py-1 text-base text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                  value={editMeta.lab_name}
                  onChange={(e) => setEditMeta({ ...editMeta, lab_name: e.target.value })}
                  placeholder="e.g. Labcorp, Quest Diagnostics"
                />
              ) : (
                <p className="text-base font-bold text-slate-700">{report_metadata.lab_name || 'Not Specified'}</p>
              )}
            </div>
          </div>

          {/* Show editable age */}
          <div className="flex items-center gap-3">
            <User className="h-5.5 w-5.5 text-slate-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Age at Test</p>
              {isEditing ? (
                <input
                  type="number"
                  placeholder="e.g. 35"
                  className="block w-full mt-1 min-h-[40px] rounded-lg border border-slate-300 px-3 py-1 text-base text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                  value={editMeta.age}
                  onChange={(e) => setEditMeta({ ...editMeta, age: e.target.value })}
                />
              ) : (
                <p className="text-base font-bold text-slate-700">
                  {report_metadata.age !== undefined && report_metadata.age !== null 
                    ? report_metadata.age 
                    : (report as any).age !== undefined && (report as any).age !== null 
                      ? (report as any).age 
                      : 'Not recorded'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tags / Categories section */}
        <div className="border-t border-slate-100 pt-4 mt-4" id="report-tags-container">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tags / Categories</p>
          {isEditing ? (
            <input
              type="text"
              placeholder="e.g. annual checkup, pre-surgery, cardiology (separated by commas)"
              className="block w-full min-h-[40px] rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 focus:border-teal-600 focus:outline-none"
              value={editMeta.tags}
              onChange={(e) => setEditMeta({ ...editMeta, tags: e.target.value })}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {report_metadata.tags && report_metadata.tags.length > 0 ? (
                report_metadata.tags.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-250">
                    {tag}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic">No tags or categories assigned. Click Edit to add some!</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Biomarker Values Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-lg font-bold text-slate-900">Biomarkers Tested</h4>
          {isEditing && (
            <button
              type="button"
              onClick={addRow}
              className="flex min-h-[36px] items-center gap-1.5 rounded-lg bg-teal-50 border border-teal-200 px-3 py-1 text-sm font-bold text-teal-700 hover:bg-teal-100 transition-colors"
              id="add-biomarker-row-btn"
            >
              <Plus className="h-4 w-4" />
              <span>Add Biomarker</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm" id="biomarkers-table-wrapper">
          <table className="w-full text-left border-collapse" id="biomarkers-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Biomarker / Test Name</th>
                <th className="py-4 px-6 text-right w-36">My Value</th>
                <th className="py-4 px-6 w-32">Unit</th>
                <th className="py-4 px-6 text-center w-48">Health Indicator</th>
                <th className="py-4 px-6">Normal Reference Range</th>
                {isEditing && <th className="py-4 px-6 text-center w-16">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-base text-slate-700">
              {isEditing ? (
                editData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No biomarker values added. Click &quot;Add Biomarker&quot; to begin.
                    </td>
                  </tr>
                ) : (
                  editData.map((item, index) => (
                    <tr key={`edit-biomarker-${index}`} className="hover:bg-slate-50/20" id={`edit-row-${index}`}>
                      <td className="py-3 px-6">
                        <input
                          type="text"
                          required
                          list="test-names-list"
                          className="block w-full min-h-[36px] rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                          value={item.test_name}
                          onChange={(e) => updateRow(index, 'test_name', e.target.value)}
                          placeholder="e.g. Glucose"
                        />
                      </td>
                      <td className="py-3 px-6">
                        <input
                          type="number"
                          step="any"
                          required
                          className="block w-full min-h-[36px] text-right rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                          value={item.value}
                          onChange={(e) => updateRow(index, 'value', e.target.value)}
                          placeholder="e.g. 95.0"
                        />
                      </td>
                      <td className="py-3 px-6">
                        <input
                          type="text"
                          className="block w-full min-h-[36px] rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                          value={item.unit}
                          onChange={(e) => updateRow(index, 'unit', e.target.value)}
                          placeholder="mg/dL"
                        />
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span className="text-xs text-slate-400 font-semibold italic">Auto Calculated</span>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            className="block w-20 min-h-[36px] rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                            value={item.lower_bound}
                            onChange={(e) => updateRow(index, 'lower_bound', e.target.value)}
                            placeholder="Lower"
                          />
                          <span className="text-slate-400 font-bold">-</span>
                          <input
                            type="number"
                            step="any"
                            className="block w-20 min-h-[36px] rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                            value={item.upper_bound}
                            onChange={(e) => updateRow(index, 'upper_bound', e.target.value)}
                            placeholder="Upper"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <button
                          type="button"
                          onClick={() => deleteRow(index)}
                          className="flex items-center justify-center h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors mx-auto"
                          title="Delete Row"
                        >
                          <Trash className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                report_data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No biomarker values found in this report.
                    </td>
                  </tr>
                ) : (
                  report_data.map((item, index) => {
                    const statusDetails = getBiomarkerStatus(item);
                    return (
                      <tr
                        key={`${item.test_name}-${index}`}
                        className="hover:bg-slate-50/40 transition-colors"
                        id={`biomarker-row-${index}`}
                      >
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {item.test_name}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-slate-900 tabular-nums">
                          {item.value}
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-500">
                          {item.unit || '—'}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-extrabold border ${statusDetails.colorClass}`}
                            id={`biomarker-badge-${index}`}
                          >
                            {statusDetails.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold text-slate-500 tabular-nums">
                          {formatReferenceRange(item.lower_bound, item.upper_bound, item.unit)}
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation modal for delete */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Laboratory Report?"
        message="Are you sure you want to delete this report? This action will permanently remove all associated parsed biomarker histories and cannot be undone."
        confirmText={deleting ? 'Deleting...' : 'Delete Permanently'}
        cancelText="Keep Report"
        isDestructive={true}
      />

      {/* Autocomplete datalist for biomarker names */}
      <datalist id="test-names-list">
        {testNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </div>
  );
}
