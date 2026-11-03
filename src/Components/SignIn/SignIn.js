import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { BiShow, BiHide, BiErrorCircle, BiGridAlt, BiSync, BiExport, BiBot, BiGroup, BiSun, BiMoon } from 'react-icons/bi';
import { FcGoogle } from 'react-icons/fc';

import Button from '../ui/Button';
import TextField from '../ui/Textfield';
import Alert from '../ui/Alert';
import SignInPreview from './SignInPreview';
import FeatureCarousel from './FeatureCarousel';
import useTheme from '../shell/useTheme'; // <-- Import the shared theme hook

import '../../GlobalStyle/Global.css';

import campus from '../../assets/olfu.jpg';
import seal from '../../assets/cpt-logo-white.png';
import axisLogo from '../../assets/AxisLogo-gold.png';

const GOOGLE_CLIENT_ID = '380468995263-evlspbemil3b77orbqui505pol0o8pun.apps.googleusercontent.com';

const GOLD = '#ffcb57';
const ROSE = '#893a49';
const DEEP = '#4c1208';

const PHOTO_TINT = { background: 'rgb(137 58 73 / 0.35)' };
const BOX_STYLE = {
  backgroundImage: `linear-gradient(165deg, ${ROSE}f0 0%, ${DEEP}f5 100%)`,
};
const GRID_STYLE = {
  backgroundImage:
    'linear-gradient(rgb(255 255 255 / 0.55) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.55) 1px, transparent 1px)',
  backgroundSize: '48px 48px',
  WebkitMaskImage: 'radial-gradient(ellipse at 30% 40%, #000, transparent 80%)',
  maskImage: 'radial-gradient(ellipse at 30% 40%, #000, transparent 80%)',
};

const FEATURES = [
  { icon: BiGridAlt, title: 'Smart dashboard', text: 'Track academic records at a glance, with performance overviews and progress trends.' },
  { icon: BiSync, title: 'Real-time data', text: 'See live statuses and records as soon as they are updated.' },
  { icon: BiExport, title: 'Easy export', text: 'Generate pre-filled academic documents and print them in one click.' },
  { icon: BiGroup, title: 'Student records', text: 'Keep profiles, sections, grades, and standing together in one organized masterlist.' },
  { icon: BiBot, title: 'Ask AI', text: 'Get quick answers about records and procedures from the built-in assistant.' },
];

function SignInForm() {
  const navigate = useNavigate();
  
  // Use the shared theme hook instead of local state
  const [isDark, toggleTheme] = useTheme();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  // --- GOOGLE LOGIN HOOK ---
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      setIsSubmitting(true);

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });

        const data = await response.json();

        if (data.success) {
          const storage = sessionStorage;
          storage.setItem('token', data.token);
          storage.setItem('username', data.username);
          storage.setItem('role', data.role);

          if (data.firstName) storage.setItem('firstName', data.firstName);

          if (data.role === 'student') {
            navigate('/student/dashboard');
          } else {
            navigate('/admin/dashboard');
          }
        } else {
          setError(data.message);
        }
      } catch (err) {
        console.error('Google Login Error:', err);
        setError('Unable to connect to the server. Please try again later.');
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: () => setError('Google Sign-In was cancelled or failed.'),
    hd: 'fatima.edu.ph', 
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setError('Server returned an unexpected response. Please contact the administrator.');
        return;
      }

      const data = await response.json();

      if (data.success) {
        const storage = sessionStorage; 
        storage.setItem('token', data.token);
        storage.setItem('username', data.username);
        storage.setItem('role', (data.role || '').toLowerCase());
        sessionStorage.setItem('email', data.email || '—');

        if (data.designation) storage.setItem('designation', data.designation);

        try {
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          if (payload.id != null) storage.setItem('user_id', String(payload.id));
          if (payload.student_id != null) storage.setItem('student_id', String(payload.student_id));
          if (payload.faculty_id != null) storage.setItem('faculty_id', String(payload.faculty_id));
        } catch (decodeErr) {}

        if (data.mustChangePassword === true) {
          navigate('/change-password');
        } else if (data.role?.toLowerCase() === 'student') {
          navigate('/student/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
        return;
      }

      setError(data.message || 'Invalid username or password.');
    } catch (err) {
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="ax h-dvh overflow-y-auto bg-canvas text-ink">
      <div className="grid min-h-full lg:grid-cols-[1.1fr_1fr]">
        <aside className="relative flex flex-col overflow-hidden rounded-b-sheet lg:rounded-none">
          <img src={campus} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover blur-sm" />
          <div aria-hidden="true" className="absolute inset-0" style={PHOTO_TINT} />

          <div style={BOX_STYLE} className="relative flex min-h-[11rem] flex-1 flex-col justify-end p-5 lg:mx-10 lg:mb-6 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)] lg:grid-rows-[auto_1fr_auto_auto] lg:gap-6 lg:rounded-sheet lg:p-10">
            <div aria-hidden="true" className="absolute inset-0 opacity-[0.12]" style={GRID_STYLE} />

            <div className="relative flex items-center gap-3">
              <img src={axisLogo} alt="Axis Portal" className="h-14 w-auto lg:h-20" />
              <span className="grid h-10 w-10 shrink-0 place-items-center lg:h-14 lg:w-14">
                <img src={seal} alt="Seal" className="h-full w-full object-cover scale-125" />
              </span>
            </div>

            <div className="relative hidden items-center lg:flex">
              <div>
                <p className="font-display text-5xl leading-[1.05] text-white xl:text-6xl">
                  <span className="font-light">Track it all in</span>
                  <br />
                  <em className="font-bold" style={{ color: GOLD }}>one portal.</em>
                </p>
                <p className="mt-5 max-w-sm text-lg text-white/85 2xl:text-xl">
                  Say goodbye to manual tracking and lost records. Manage your data in real time.
                </p>
              </div>
              <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 min-[1700px]:[@media(min-height:900px)]:block">
                <SignInPreview />
              </div>
            </div>

            <div className="relative hidden min-w-0 lg:block">
              <div className="w-[calc(100%+5rem)] -ml-10">
                <FeatureCarousel items={FEATURES} />
              </div>
            </div>

            <p className="relative hidden text-center text-xs font-semibold tracking-[0.12em] lg:block" style={{ color: GOLD }}>
              OUR LADY OF FATIMA UNIVERSITY - COLLEGE OF PHYSICAL THERAPY
            </p>
          </div>
        </aside>

        <section className="flex flex-col px-6 pb-8 pt-6 sm:px-12 lg:py-10">
          <div className="flex items-center justify-between">
            <button onClick={toggleTheme} className="rounded-full p-2 text-ink-2 transition-colors hover:bg-black/5 hover:text-ink" aria-label="Toggle dark mode">
              {isDark ? <BiSun className="text-xl" /> : <BiMoon className="text-xl" />}
            </button>
            <p className="flex flex-col items-end text-right text-sm text-ink-2">
              Having trouble signing in?
              <span className="font-medium text-brand-ink dark:text-[#ffcb57] transition-colors">
                Contact the college administrator.
              </span>
            </p>
          </div>

          <div className="mx-auto my-auto w-full max-w-sm py-8">
            <h1 className="font-display text-4xl font-semibold text-brand-ink dark:text-[#ffcb57] transition-colors">
              Sign in
            </h1>
            <p className="mt-2 text-ink-2">Welcome to Axis! Sign in to continue.</p>

            <form className="mt-8 space-y-5" onSubmit={handleLogin}>
              {error && (
                <Alert>
                  <BiErrorCircle className="mt-0.5 shrink-0 text-lg" aria-hidden="true" />
                  <span>{error}</span>
                </Alert>
              )}

              <TextField
                id="username"
                name="username"
                label="Username or student number"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                required
              />

              <TextField
                id="password"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="grid h-10 w-10 place-items-center rounded-ctl text-ink-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    {showPassword ? <BiHide className="text-xl" /> : <BiShow className="text-xl" />}
                  </button>
                }
              />

              <div className="flex items-center justify-end text-sm">
                <button type="button" className="font-medium text-brand-ink hover:underline dark:text-[#ffcb57] transition-colors">
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-[#893a49] to-[#4c1208] hover:brightness-110"
                loading={isSubmitting}
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            {/* --- CUSTOM GOOGLE LOGIN BUTTON --- */}
            <div className="mt-5 flex items-center justify-center gap-3">
              <div className="h-0.5 flex-1 rounded-full bg-line-strong dark:bg-gray-600" />
              <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">OR</span>
              <div className="h-0.5 flex-1 rounded-full bg-line-strong dark:bg-gray-600" />
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => googleLogin()}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-3 rounded-ctl bg-surface-2 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-line disabled:opacity-50 border border-line dark:border-gray-700"
              >
                <FcGoogle className="text-xl" />
                Continue with Google
              </button>
            </div>
            {/* -------------------------------------- */}

            <p className="mt-6 text-xs leading-relaxed text-ink-3">
              By signing in, you agree to handle all data in accordance with the Data Privacy Act of 2012
              and the portal's privacy policies.
            </p>
          </div>

          <p className="text-center text-xs text-ink-3">©2026 Axis Portal. All rights reserved.</p>
        </section>
      </div>
    </main>
  );
}

export default function SignIn() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <SignInForm />
    </GoogleOAuthProvider>
  );
}