import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiShow, BiHide, BiErrorCircle } from 'react-icons/bi';

import Button from '../Components/Button';
import TextField from '../Components/Textfield';
import Alert from '../Components/Alert';

import '../GlobalStyle/Global.css';

import campus from '../assets/olfu.jpg';
import logo from '../assets/cpt-logo.png';
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
        <aside className="relative m-2 flex h-40 flex-col justify-end overflow-hidden rounded-panel p-5 lg:m-3 lg:h-auto lg:p-10">
          <img src={campus} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-maroon-950/95 via-maroon-900/75 to-maroon-800/70"
          />
          <div className="relative hidden lg:block">
            <p className="font-display text-4xl font-semibold leading-tight text-white">
              Our Lady of Fatima University
            </p>
            <p className="mt-2 text-lg text-white/75">College of Physical Therapy</p>
          </div>
        </aside>

        {/* Form */}
        <section className="flex flex-col px-6 pb-8 pt-6 sm:px-12 lg:py-10">
          <header className="flex items-center gap-3">
            <img src={logo} alt="" className="h-12 w-12" />
            <h1 className="font-display text-xl font-semibold text-brand-ink">Axis CPT Portal</h1>
          </header>
          <div className="mx-auto my-auto w-full max-w-sm">
            <h1 className="font-display text-4xl font-semibold text-brand-ink">Sign in</h1>
            <p className="mt-2 text-ink-2">Use your username or student ID.</p>
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
                label="Username or student ID"
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

          <p className="mt-10 text-center text-sm text-ink-2">
            Having trouble signing in?{' '}
            <span className="font-medium text-ink">Contact the CPT administrator.</span>
          </p>
        </section>
      </div>
    </main>
  );
}

export default SignIn;