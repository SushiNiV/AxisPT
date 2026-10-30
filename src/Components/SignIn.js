import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiShow, BiHide, BiErrorCircle, BiGridAlt, BiSync, BiExport } from 'react-icons/bi';

import Button from '../Components/ui/Button';
import TextField from '../Components/ui/Textfield';
import Alert from '../Components/ui/Alert';
import SignInPreview from './SignInPreview';

import '../GlobalStyle/Global.css';

import campus from '../assets/olfu.jpg';
import seal from '../assets/cpt-logo.png';

// Transparent gold wordmark, served from /public (next to logo192.png).
const AXIS_LOGO = `${process.env.PUBLIC_URL}/AxisLogo-gold.png`;

const GOLD = '#f5b942';

// Maroon gradient over the campus photo, plus a faint grid that fades out toward the bottom right.
const PANEL_STYLE = {
  backgroundImage: `linear-gradient(160deg, rgb(61 22 22 / 0.93), rgb(110 26 43 / 0.9) 55%, rgb(38 12 12 / 0.96)), url(${campus})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};
const GRID_STYLE = {
  backgroundImage:
    'linear-gradient(rgb(255 255 255 / 0.55) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.55) 1px, transparent 1px)',
  backgroundSize: '48px 48px',
  WebkitMaskImage: 'radial-gradient(ellipse at 25% 35%, #000, transparent 75%)',
  maskImage: 'radial-gradient(ellipse at 25% 35%, #000, transparent 75%)',
};

const FEATURES = [
  { icon: BiGridAlt, title: 'Smart dashboard', text: 'Track academic records at a glance, with performance overviews and progress trends.' },
  { icon: BiSync, title: 'Real-time data', text: 'See live statuses and records as soon as they are updated.' },
  { icon: BiExport, title: 'Easy export', text: 'Generate pre-filled academic documents and print them in one click.' },
];

function SignIn() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Unified login endpoint
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.error('Non-JSON response:', response.status);
        setError('Server returned an unexpected response. Please contact the administrator.');
        return;
      }

      const data = await response.json();

      if (data.success) {
        const storage = formData.rememberMe ? localStorage : sessionStorage;
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
        } catch (decodeErr) {
          console.warn('Could not decode JWT for IDs:', decodeErr);
        }

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
      console.error('Login Error:', err);
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="ax h-dvh overflow-y-auto bg-canvas text-ink">
      <div className="grid min-h-full lg:grid-cols-[1.1fr_1fr]">
        {/* Brand panel: a short banner on phones, the full showcase on desktop */}
        <aside
          style={PANEL_STYLE}
          className="relative m-2 flex h-44 flex-col justify-end overflow-hidden rounded-sheet p-5 lg:m-3 lg:h-auto lg:justify-between lg:p-10"
        >
          <div aria-hidden="true" className="absolute inset-0 opacity-[0.12]" style={GRID_STYLE} />

          <div className="relative flex items-center gap-3">
            <img src={AXIS_LOGO} alt="Axis Portal" className="h-14 w-auto lg:h-20" />
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white lg:h-14 lg:w-14">
              <img src={seal} alt="Our Lady of Fatima University seal" className="h-9 w-9 lg:h-12 lg:w-12" />
            </span>
          </div>

          <div className="relative hidden lg:block">
            <p className="font-display text-5xl font-semibold leading-[1.05] text-white xl:text-6xl">
              Track it all in <em style={{ color: GOLD }}>one portal.</em>
            </p>
            <p className="mt-4 max-w-md text-lg text-white/85">
              Say goodbye to manual tracking and lost records. Manage your data in real time.
            </p>
          </div>

          <ul className="relative hidden grid-cols-3 gap-3 xl:grid">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-panel bg-white p-4 text-maroon-900">
                <p className="flex items-center gap-2 font-display text-lg font-semibold">
                  <Icon className="shrink-0 text-2xl" aria-hidden="true" />
                  {title}
                </p>
                <p className="mt-1.5 text-sm leading-snug text-maroon-900/75">{text}</p>
              </li>
            ))}
          </ul>

          <p
            className="relative hidden text-center text-xs font-semibold tracking-[0.12em] lg:block"
            style={{ color: GOLD }}
          >
            OUR LADY OF FATIMA UNIVERSITY - COLLEGE OF PHYSICAL THERAPY
          </p>

          {/* Decorative preview, tilted and overlapping the panel edge (wide screens only) */}
          <div className="absolute -right-6 top-[22%] hidden xl:block">
            <SignInPreview />
          </div>
        </aside>

        {/* Form */}
        <section className="flex flex-col px-6 pb-8 pt-6 sm:px-12 lg:py-10">
          <p className="text-right text-sm text-ink-2">
            Having trouble signing in?{' '}
            <span className="font-medium text-brand-ink">Contact the college administrator.</span>
          </p>

          <div className="mx-auto my-auto w-full max-w-sm py-8">
            <h1 className="font-display text-4xl font-semibold text-brand-ink">Sign in</h1>
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
                    aria-pressed={showPassword}
                    className="grid h-10 w-10 place-items-center rounded-ctl text-ink-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    {showPassword ? <BiHide className="text-xl" /> : <BiShow className="text-xl" />}
                  </button>
                }
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-2">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="h-4 w-4 accent-brand"
                  />
                  Remember me
                </label>
                {/* TODO: wire up the password reset flow (this was inert before the redesign too) */}
                <button type="button" className="font-medium text-brand-ink hover:underline">
                  Forgot password?
                </button>
              </div>

              <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

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

export default SignIn;