import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api, getStoredToken, logoutEvent, clearStoredToken } from './api';
import { UserResponse } from './types';

// Layout and pages
import Layout from './components/Layout';
import ConfirmationModal from './components/ConfirmationModal';
import Login from './pages/Login';
import Register from './pages/Register';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import UploadPDF from './pages/UploadPDF';
import AddManualEntry from './pages/AddManualEntry';
import Biomarkers from './pages/Biomarkers';
import Profile from './pages/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState<string | null>(getStoredToken());
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  // Logout confirmation modal
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Sync token state on location change (detecting login/logout)
  useEffect(() => {
    const currentToken = getStoredToken();
    if (currentToken !== token) {
      setToken(currentToken);
    }
  }, [location.pathname]);

  // Fetch user profile on boot or when token changes
  useEffect(() => {
    if (token) {
      const fetchProfile = async () => {
        setLoadingUser(true);
        setUserError(null);
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch (err: any) {
          // If 401 or network error
          setUserError(err.message || 'Authentication failed.');
          if (err.status === 401) {
            setUser(null);
            setToken(null);
          }
        } finally {
          setLoadingUser(false);
        }
      };
      fetchProfile();
    } else {
      setUser(null);
    }
  }, [token]);

  // Listen to global 401 unauthorized event from api.ts
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      navigate('/login', { state: { message: 'Your session has expired. Please sign in again.' } });
    };

    logoutEvent.addEventListener('unauthorized', handleUnauthorized);
    return () => {
      logoutEvent.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, [navigate]);

  const triggerLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    clearStoredToken();
    setUser(null);
    setToken(null);
    navigate('/login', { state: { message: 'You have signed out successfully.' } });
  };

  // Route guarding helper
  const isAuth = !!token;

  return (
    <div className="min-h-screen bg-slate-50 font-sans" id="app-routing-root">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuth ? <Navigate to="/reports" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={isAuth ? <Navigate to="/reports" replace /> : <Register />}
        />

        {/* Private / Protected Routes with Layout */}
        <Route
          path="/reports"
          element={
            isAuth ? (
              <Layout user={user} onLogoutClick={triggerLogoutModal}>
                <Reports />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/reports/:reportId"
          element={
            isAuth ? (
              <Layout user={user} onLogoutClick={triggerLogoutModal}>
                <ReportDetail />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/upload-pdf"
          element={
            isAuth ? (
              <Layout user={user} onLogoutClick={triggerLogoutModal}>
                <UploadPDF />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/add-entry"
          element={
            isAuth ? (
              <Layout user={user} onLogoutClick={triggerLogoutModal}>
                <AddManualEntry />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/biomarkers"
          element={
            isAuth ? (
              <Layout user={user} onLogoutClick={triggerLogoutModal}>
                <Biomarkers />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            isAuth ? (
              <Layout user={user} onLogoutClick={triggerLogoutModal}>
                <Profile
                  user={user}
                  loadingUser={loadingUser}
                  userError={userError}
                  onLogoutClick={triggerLogoutModal}
                />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Wildcard Fallbacks */}
        <Route
          path="*"
          element={
            isAuth ? (
              <Navigate to="/reports" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>

      {/* Global Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        title="Sign Out of Your Account?"
        message="Are you sure you want to log out of your Blood Test Tracker session? You will need to re-enter your clinical credentials to access your biomarker dashboard."
        confirmText="Sign Out"
        cancelText="Remain Logged In"
        isDestructive={true}
      />
    </div>
  );
}
