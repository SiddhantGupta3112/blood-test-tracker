import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Check, X, ShieldAlert, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Real-time password validation indicators
  const [pwdMetrics, setPwdMetrics] = useState({
    length: false,
    uppercase: false,
    digit: false,
    specialChar: false,
  });

  useEffect(() => {
    setPwdMetrics({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      digit: /[0-9]/.test(password),
      specialChar: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const isPasswordValid = pwdMetrics.length && pwdMetrics.uppercase && pwdMetrics.digit && pwdMetrics.specialChar;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Please satisfy all password requirements before registering.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      email,
      password,
      full_name: fullName,
      phone_country_code: phoneCountryCode || null,
      phone_number: phoneNumber || null,
      date_of_birth: dob || null,
    };

    try {
      await api.register(payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { state: { email, message: 'Account created! Please log in.' } });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-sans" id="register-page-root">
      <div className="w-full max-w-lg space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100 mb-4">
            <Activity className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Create an Account</h2>
          <p className="mt-2 text-base text-slate-600">
            Sign up to securely track and analyze your blood test results.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3" role="alert" id="register-error-banner">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Registration Error</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800 flex items-start gap-3" role="alert" id="register-success-banner">
            <Check className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Success!</p>
              <p className="mt-1">Account created successfully. Redirecting you to login...</p>
            </div>
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit} id="register-form">
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                disabled={loading}
                className="block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-55"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email-address" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
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

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={loading}
                className="block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-55"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Real-time Requirement List */}
              <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3" id="password-criteria-panel">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password Requirements</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <li className="flex items-center gap-2">
                    {pwdMetrics.length ? (
                      <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-teal-100 text-teal-800" id="criteria-len-ok">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-200 text-slate-500" id="criteria-len-fail">
                        <X className="h-3 w-3" />
                      </span>
                    )}
                    <span className={pwdMetrics.length ? 'text-teal-900 font-medium' : 'text-slate-500'}>
                      At least 8 characters
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {pwdMetrics.uppercase ? (
                      <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-teal-100 text-teal-800" id="criteria-uc-ok">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-200 text-slate-500" id="criteria-uc-fail">
                        <X className="h-3 w-3" />
                      </span>
                    )}
                    <span className={pwdMetrics.uppercase ? 'text-teal-900 font-medium' : 'text-slate-500'}>
                      One uppercase letter
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {pwdMetrics.digit ? (
                      <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-teal-100 text-teal-800" id="criteria-num-ok">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-200 text-slate-500" id="criteria-num-fail">
                        <X className="h-3 w-3" />
                      </span>
                    )}
                    <span className={pwdMetrics.digit ? 'text-teal-900 font-medium' : 'text-slate-500'}>
                      One numeric digit
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {pwdMetrics.specialChar ? (
                      <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-teal-100 text-teal-800" id="criteria-sc-ok">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-200 text-slate-500" id="criteria-sc-fail">
                        <X className="h-3 w-3" />
                      </span>
                    )}
                    <span className={pwdMetrics.specialChar ? 'text-teal-900 font-medium' : 'text-slate-500'}>
                      One special symbol
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dob" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Date of Birth <span className="text-slate-400 font-normal text-xs">(Optional)</span>
              </label>
              <input
                id="dob"
                name="dob"
                type="date"
                disabled={loading}
                className="block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-55"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>

            {/* Phone Fields */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="phoneCountryCode" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Code <span className="text-slate-400 font-normal text-xs">(Opt)</span>
                </label>
                <input
                  id="phoneCountryCode"
                  name="phoneCountryCode"
                  type="text"
                  disabled={loading}
                  placeholder="+1"
                  className="block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-55"
                  value={phoneCountryCode}
                  onChange={(e) => setPhoneCountryCode(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="phoneNumber" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Phone Number <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  disabled={loading}
                  placeholder="555-0199"
                  className="block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-55"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="flex w-full min-h-[44px] items-center justify-center rounded-lg bg-teal-700 px-4 py-2 text-base font-bold text-white hover:bg-teal-800 active:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              id="submit-register-btn"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </div>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-base text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-teal-700 hover:text-teal-800 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
