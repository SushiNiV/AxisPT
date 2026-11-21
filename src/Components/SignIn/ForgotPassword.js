import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiArrowBack, BiErrorCircle, BiCheckCircle } from 'react-icons/bi';

import Button from '../ui/Button';
import TextField from '../ui/Textfield';
import Alert from '../ui/Alert';

function ForgotPassword() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await response.json();

      if (data.success) setSent(true);
      else setError(data.message || 'Could not send the reset link. Please try again.');
    } catch (err) {
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ax flex min-h-screen items-center justify-center bg-canvas p-4 relative">
      <button
        onClick={() => navigate('/signin')}
        className="absolute left-4 top-4 flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-ink transition-colors md:left-8 md:top-8"
      >
        <BiArrowBack className="text-lg" /> Back to sign in
      </button>

      <div className="w-full max-w-md rounded-panel border !border-line bg-surface p-6 shadow-lift md:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">Forgot password</h1>
          <p className="mt-2 text-sm text-ink-2">
            Enter your username, student number, or school email. We'll send a reset link to your school email.
          </p>
        </div>

        {sent ? (
          <div className="space-y-5 text-center">
            <BiCheckCircle className="mx-auto text-5xl text-brand-ink dark:text-[#ffcb57]" aria-hidden="true" />
            <p className="text-sm text-ink-2">
              If an account matches, a reset link is on its way. It expires in 30 minutes.
              Check your spam folder if you don't see it.
            </p>
            <Button size="lg" className="w-full" onClick={() => navigate('/signin')}>
              Back to sign in
            </Button>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <Alert>
                <BiErrorCircle className="mt-0.5 shrink-0 text-lg" aria-hidden="true" />
                <span>{error}</span>
              </Alert>
            )}

            <TextField
              id="identifier"
              name="identifier"
              label="Username, student number, or email"
              placeholder="Enter your username or email"
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); if (error) setError(''); }}
              autoComplete="username"
              required
            />

            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;