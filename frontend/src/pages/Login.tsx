import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Activity, ShieldAlert, AlertCircle, CheckCircle } from 'lucide-react';
import { api, setStoredToken } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if redirect state has a message or email
    const state = location.state as { email?: string; message?: string } | null;
    if (state) {
      if (state.email) setEmail(state.email);
      if (state.message) setInfoMessage(state.message);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const response = await api.login({ email, password });
      setStoredToken(response.access_token);
      // Trigger a reload or redirect
      navigate('/reports');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-sans" id="login-page-root">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100 mb-4">
            <Activity className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Sign In</h2>
          <p className="mt-2 text-base text-slate-600">
            Access your secure medical dashboard.
          </p>
        </div>

        {infoMessage && (
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800 flex items-start gap-3" id="login-info-banner">
            <CheckCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
            <p className="font-semibold">{infoMessage}</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3" role="alert" id="login-error-banner">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Sign In Error</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit} id="login-form">
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                className="block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-55"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={loading}
                className="block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-55"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full min-h-[44px] items-center justify-center rounded-lg bg-teal-700 px-4 py-2 text-base font-bold text-white hover:bg-teal-800 active:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              id="submit-login-btn"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-base text-slate-600">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-teal-700 hover:text-teal-800 hover:underline">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
