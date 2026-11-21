import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BiArrowBack, BiShow, BiHide, BiErrorCircle } from 'react-icons/bi';

import ConfirmationModal from '../shared/ConfirmationModal';
import Button from '../ui/Button';
import TextField from '../ui/Textfield';
import Alert from '../ui/Alert';

function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  // 'checking' | 'valid' | 'invalid'
  const [linkState, setLinkState] = useState(token ? 'checking' : 'invalid');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });

  // Reject dead links before the user types anything.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`${process.env.REACT_APP_API_URL}/auth/reset-password/verify?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setLinkState(d.success ? 'valid' : 'invalid'); })
      .catch(() => { if (!cancelled) setLinkState('invalid'); });
    return () => { cancelled = true; };
  }, [token]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openModal = (title, summary, message, variant, confirmLabel, onConfirm) => {
    setConfirmState({
      isOpen: true, title, summary, message, variant, confirmLabel,
      cancelLabel: 'CANCEL',
      isAlert: true,
      onConfirm: () => {
        setConfirmState({ isOpen: false });
        if (onConfirm) onConfirm();
      },
      onCancel: () => setConfirmState({ isOpen: false }),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword.length < 8) {
      openModal('Invalid Password', 'Password Too Short', 'New password must be at least 8 characters long.', 'warning', 'OK');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      openModal('Passwords Do Not Match', 'Mismatch Detected', 'New passwords do not match! Please re-enter them.', 'danger', 'RETRY');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: formData.newPassword }),
      });
      const data = await response.json();

      if (data.success) {
        openModal('Password Reset', 'Success', 'Your password has been reset. Sign in with your new password.', 'success', 'GOT IT', () => navigate('/signin'));
      } else {
        openModal('Reset Failed', 'Action Failed', data.message || 'Failed to reset password.', 'danger', 'OK');
      }
    } catch (err) {
      openModal('Connection Error', 'Server Unreachable', 'Server connection failed. Please try again later.', 'danger', 'OK');
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
          <h1 className="font-display text-2xl font-bold text-ink">Reset password</h1>
        </div>

        {linkState === 'checking' && (
          <p className="text-center text-sm text-ink-2">Checking your reset link…</p>
        )}

        {linkState === 'invalid' && (
          <div className="space-y-5">
            <Alert>
              <BiErrorCircle className="mt-0.5 shrink-0 text-lg" aria-hidden="true" />
              <span>This reset link is invalid or has expired.</span>
            </Alert>
            <Button size="lg" className="w-full" onClick={() => navigate('/forgot-password')}>
              Request a new link
            </Button>
          </div>
        )}

        {linkState === 'valid' && (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <TextField
              id="newPassword"
              label="New Password"
              name="newPassword"
              type={showNew ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              value={formData.newPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
              minLength="8"
              trailing={
                <button type="button" onClick={() => setShowNew(!showNew)} aria-label={showNew ? 'Hide password' : 'Show password'} className="grid h-10 w-10 place-items-center text-ink-3 hover:text-ink">
                  {showNew ? <BiHide /> : <BiShow />}
                </button>
              }
            />

            <TextField
              id="confirmPassword"
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Re-enter new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
              trailing={
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? 'Hide password' : 'Show password'} className="grid h-10 w-10 place-items-center text-ink-3 hover:text-ink">
                  {showConfirm ? <BiHide /> : <BiShow />}
                </button>
              }
            />

            <Button type="submit" size="lg" className="w-full mt-2" loading={isSubmitting}>
              Reset password
            </Button>
          </form>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        summary={confirmState.summary}
        message={confirmState.message}
        variant={confirmState.variant}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        isAlert={confirmState.isAlert}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />
    </div>
  );
}

export default ResetPassword;