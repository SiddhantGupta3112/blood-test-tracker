import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Calendar, 
  LogOut, 
  ShieldAlert, 
  AlertCircle, 
  RefreshCw, 
  Activity, 
  CheckCircle, 
  Download, 
  Trash2, 
  Lock, 
  Smartphone, 
  ShieldCheck,
  AlertTriangle 
} from 'lucide-react';
import { api, clearStoredToken } from '../api';
import { UserResponse } from '../types';
import { formatDate } from '../utils';

interface ProfileProps {
  onLogoutClick: () => void;
  user: UserResponse | null;
  loadingUser: boolean;
  userError: string | null;
}

export default function Profile({ onLogoutClick, user, loadingUser, userError }: ProfileProps) {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  
  // Two-Factor Auth State (persisted locally)
  const [is2faEnabled, setIs2faEnabled] = useState(() => {
    return localStorage.getItem('user_2fa_enabled') === 'true';
  });
  const [show2faSetup, setShow2faSetup] = useState(false);
  const [backupCode, setBackupCode] = useState('');

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTypedConfirm, setDeleteTypedConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (loadingUser) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4" id="profile-loading">
        <RefreshCw className="h-10 w-10 text-teal-700 animate-spin" />
        <p className="text-base text-slate-500 font-medium">Retrieving personal credentials...</p>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3" id="profile-error">
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Patient Profile Error</p>
          <p className="mt-1">{userError || 'Could not fetch user info.'}</p>
        </div>
      </div>
    );
  }

  // Aggregated Export Handler
  const handleExportCSV = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const summaries = await api.getReports();
      if (summaries.length === 0) {
        setExportError("You don't have any uploaded reports to export.");
        setExporting(false);
        return;
      }

      let csvContent = "Collection Date,Lab Name,Biomarker Name,Value,Unit,Lower Bound,Upper Bound,Is Abnormal\n";
      
      for (const summary of summaries) {
        let reportDetails = null;
        const savedEdit = localStorage.getItem(`edited_report_${summary.report_id}`);
        if (savedEdit) {
          try {
            reportDetails = JSON.parse(savedEdit);
          } catch {}
        }
        
        if (!reportDetails) {
          try {
            reportDetails = await api.getPlotsReport(summary.report_id);
          } catch {
            // fallback using summary info
            reportDetails = {
              report_metadata: {
                collection_date: summary.collection_date,
                lab_name: summary.lab_name,
              },
              report_data: []
            };
          }
        }
        
        if (reportDetails && reportDetails.report_data && reportDetails.report_data.length > 0) {
          for (const row of reportDetails.report_data) {
            const rowData = [
              reportDetails.report_metadata.collection_date || summary.collection_date,
              `"${(reportDetails.report_metadata.lab_name || summary.lab_name || 'Not Specified').replace(/"/g, '""')}"`,
              `"${(row.test_name || '').replace(/"/g, '""')}"`,
              row.value,
              `"${(row.unit || '').replace(/"/g, '""')}"`,
              row.lower_bound ?? '',
              row.upper_bound ?? '',
              row.is_abnormal ? 'Yes' : 'No'
            ];
            csvContent += rowData.join(",") + "\n";
          }
        } else {
          // Add summary meta only if no test data exists
          const rowData = [
            summary.collection_date,
            `"${(summary.lab_name || 'Not Specified').replace(/"/g, '""')}"`,
            "N/A",
            "",
            "",
            "",
            "",
            "No"
          ];
          csvContent += rowData.join(",") + "\n";
        }
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `clinical_health_history_${user.full_name.toLowerCase().replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setExportError("Failed to assemble history: " + (err.message || err));
    } finally {
      setExporting(false);
    }
  };

  // 2FA Actions
  const handleToggle2fa = () => {
    if (is2faEnabled) {
      localStorage.removeItem('user_2fa_enabled');
      setIs2faEnabled(false);
      setShow2faSetup(false);
    } else {
      // Simulate code generation
      const code = 'SECURE-MFA-' + Math.floor(100000 + Math.random() * 900000);
      setBackupCode(code);
      setShow2faSetup(true);
    }
  };

  const confirm2faSetup = () => {
    localStorage.setItem('user_2fa_enabled', 'true');
    setIs2faEnabled(true);
    setShow2faSetup(false);
  };

  // Permanent Delete
  const handleDeleteAccount = async () => {
    if (!user || deleteTypedConfirm !== user.email) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteAccount();
      
      // Clear token and other details
      clearStoredToken();
      localStorage.clear();
      
      setShowDeleteModal(false);
      navigate('/login', { state: { message: 'Your account and clinical health records have been permanently deleted.' } });
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to permanently delete your clinical account. Please try again or contact support.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6" id="profile-screen-root">
      <div>
        <h3 className="text-2xl font-bold text-slate-900 leading-tight">Patient Profile</h3>
        <p className="text-base text-slate-500 mt-1">
          Secure identity settings and personal demographic information.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="profile-grid">
        {/* Demographic Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6" id="demographics-card">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Demographic Information</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Clinical Identification</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" id="demographic-details">
              {/* Full Name */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Full Name</span>
                <p className="text-lg font-bold text-slate-800">{user.full_name}</p>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                  <Mail className="h-5 w-5 text-slate-400 shrink-0" />
                  <span>{user.email}</span>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Date of Birth</span>
                <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                  <Calendar className="h-5 w-5 text-slate-400 shrink-0" />
                  <span>{formatDate(user.date_of_birth)}</span>
                </div>
              </div>

              {/* Account ID */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Patient Record ID</span>
                <p className="text-base font-mono text-slate-500">#{user.user_id}</p>
              </div>
            </div>
          </div>

          {/* Export & Data Management */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4" id="export-card">
            <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Download className="h-5.5 w-5.5 text-teal-700" />
              <span>Data Export & Backup</span>
            </h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Export your consolidated health history as a structured clinical data document. This contains all verified laboratory reports and manual biomarker results, which can be shared directly with doctors, caregivers, or other clinic coordinators.
            </p>

            {exportError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0" />
                <span>{exportError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 px-5 py-2 text-base font-bold hover:bg-teal-100 active:bg-teal-200 transition-colors disabled:opacity-50"
              id="export-csv-btn"
            >
              {exporting ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Aggregating Patient Records...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>Download Health History (CSV)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security and controls */}
        <div className="space-y-6" id="security-session-card-wrapper">
          {/* Main Patient Controls Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6" id="security-session-card">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
                <Activity className="h-5.5 w-5.5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Patient Controls</h4>
            </div>

            {/* Disabled 2FA Section */}
            <div className="space-y-2 opacity-60 cursor-not-allowed border-b border-slate-100 pb-4" id="two-factor-auth-section">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Smartphone className="h-4.5 w-4.5 text-slate-400" />
                  <span>Two-Factor Auth</span>
                </span>
                <span className="inline-flex px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded bg-slate-100 text-slate-400 border border-slate-200">
                  Coming Soon
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add an extra layer of clinical protection to prevent unauthorized access to your blood biomarkers.
              </p>
            </div>

            {/* Change Email & Password Guidance */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2" id="credentials-elevation-guidance">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-slate-400" />
                <span>Security Credentials</span>
              </span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Password and email updates must undergo healthcare provider coordination. Please contact support or your medical coordinator to elevate and update account details.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onLogoutClick}
                className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-900 px-5 text-base font-bold text-white transition-colors"
                id="profile-logout-btn"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out of Session</span>
              </button>
            </div>
          </div>

          {/* Dedicated Danger Zone Card */}
          <div className="bg-red-50/20 rounded-xl border border-red-150 p-6 space-y-4" id="danger-zone-card">
            <div className="flex items-center gap-2 text-red-800">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <h4 className="text-base font-bold">Danger Zone</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              These operations are irreversible. Permanently purge your profile and delete your entire laboratory blood test history from our secure servers.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex w-full min-h-[38px] items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white text-red-600 text-xs font-bold hover:bg-red-50 active:bg-red-100 transition-colors"
              id="delete-account-trigger-btn"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Account & History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Delete Account */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" id="delete-account-modal">
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 md:p-8 space-y-6">
            <button 
              type="button"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteTypedConfirm('');
                setDeleteError(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors text-xl font-bold"
            >
              &times;
            </button>
            
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 border border-red-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Irreversible Action</h4>
                <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Danger Zone</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <p className="leading-relaxed">
                This action is <strong className="text-slate-900">permanently destructive</strong>. Your account and all clinical blood biomarker results will be immediately wiped from our servers. This cannot be undone.
              </p>
              <p className="leading-relaxed">
                To confirm, please type your exact clinical email address (<strong className="text-slate-900 select-all">{user.email}</strong>) below:
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-150 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <input
              type="email"
              placeholder={user.email}
              className="block w-full min-h-[44px] rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              value={deleteTypedConfirm}
              onChange={(e) => setDeleteTypedConfirm(e.target.value)}
              disabled={deleting}
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTypedConfirm('');
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="flex-1 min-h-[44px] border border-slate-300 rounded-lg text-base text-slate-600 font-bold bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting || deleteTypedConfirm !== user.email}
                onClick={handleDeleteAccount}
                className="flex-1 min-h-[44px] bg-red-600 text-white rounded-lg text-base font-bold hover:bg-red-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    <span>Delete permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
