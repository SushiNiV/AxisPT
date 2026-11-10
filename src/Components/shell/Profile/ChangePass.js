import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiArrowBack, BiShow, BiHide } from 'react-icons/bi';
import ConfirmationModal from '../../shared/ConfirmationModal'; 
import Button from '../../ui/Button';
import TextField from '../../ui/Textfield';
import Avatar from '../../ui/Avatar';
import Badge from '../../ui/Badge';
import useAvatar from './UseAvatar'; // <-- Import the avatar hook

function ChangePass() {
  const navigate = useNavigate();
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [confirmState, setConfirmState] = useState({ isOpen: false });
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Grab user context from storage
  const role = sessionStorage.getItem('role') || localStorage.getItem('role');
  const firstName = sessionStorage.getItem('first_name') || sessionStorage.getItem('firstName') || 'User';
  const lastName = sessionStorage.getItem('last_name') || sessionStorage.getItem('lastName') || '';
  
  // Use the hook instead of manually reading sessionStorage
  const { src: avatarSrc, onError: onAvatarError } = useAvatar();

  const isStudent = role === 'student';
  const endpoint = isStudent ? '/student/change-password' : '/admin/change-password';
  const returnPath = isStudent ? '/student/dashboard' : '/admin/dashboard';
  const displayRole = isStudent ? 'Student' : 'Administrator';

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) {
      alert('Session expired. Please log in.');
      navigate('/signin');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openModal = (title, summary, message, variant, confirmLabel, onConfirm) => {
    setConfirmState({
      isOpen: true,
      title,
      summary,
      message,
      variant,
      confirmLabel,
      cancelLabel: 'CANCEL',
      isAlert: true,
      onConfirm: () => {
        setConfirmState({ isOpen: false });
        if (onConfirm) onConfirm();
      },
      onCancel: () => setConfirmState({ isOpen: false }),
    });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword.length < 8) {
      openModal('Invalid Password', 'Password Too Short', 'New password must be at least 8 characters long.', 'warning', 'OK');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      openModal('Passwords Do Not Match', 'Mismatch Detected', 'New passwords do not match! Please re-enter them.', 'danger', 'RETRY');
      return;
    }

    const token = sessionStorage.getItem('token') || localStorage.getItem('token');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (data.success) {
        openModal('Password Updated', 'Success', 'Your password has been changed successfully. You will now be redirected.', 'success', 'GOT IT', () => {
          document.body.classList.remove('dark');
          sessionStorage.clear();
          localStorage.clear();
          navigate('/signin');
        });
      } else {
        openModal('Update Failed', 'Action Failed', data.message || "Failed to change password.", 'danger', 'RETRY');
      }
    } catch (err) {
      console.error("Error:", err);
      openModal('Connection Error', 'Server Unreachable', 'Server connection failed. Please try again later.', 'danger', 'OK');
    }
  };

  return (
    <div className="ax flex min-h-screen items-center justify-center bg-canvas p-4 relative">
      
      <button 
        onClick={() => navigate(returnPath)} 
        className="absolute left-4 top-4 flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-ink transition-colors md:left-8 md:top-8"
      >
        <BiArrowBack className="text-lg" /> Back
      </button>

      <div className="w-full max-w-md rounded-panel border !border-line bg-surface p-6 shadow-lift md:p-8">
        
        {/* User Identity Section */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 !border-surface shadow-sm bg-surface-2 mb-4">
            {avatarSrc ? (
              <img 
                src={avatarSrc} 
                alt="Profile" 
                onError={onAvatarError}
                className="h-full w-full object-cover" 
              />
            ) : (
              <Avatar 
                first={firstName} 
                last={lastName} 
                className="h-full w-full !text-3xl" 
              />
            )}
          </div>
          
          <h1 className="font-display text-2xl font-bold text-ink">
            {firstName} {lastName}
          </h1>
          <div className="mt-2">
            <Badge tone="neutral" className="capitalize">{displayRole}</Badge>
          </div>
        </div>

        <div className="border-t !border-line pt-6">
          <h2 className="mb-4 text-sm font-semibold text-ink uppercase tracking-wider text-center">
            Update Password
          </h2>

          <form className="space-y-5" onSubmit={handlePasswordChange}>
            
            <TextField
              label="Current Password"
              name="currentPassword"
              type={showCurrent ? "text" : "password"}
              placeholder="Enter current password"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              trailing={
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="grid h-10 w-10 place-items-center text-ink-3 hover:text-ink">
                  {showCurrent ? <BiHide /> : <BiShow />}
                </button>
              }
            />

            <TextField
              label="New Password"
              name="newPassword"
              type={showNew ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength="8"
              trailing={
                <button type="button" onClick={() => setShowNew(!showNew)} className="grid h-10 w-10 place-items-center text-ink-3 hover:text-ink">
                  {showNew ? <BiHide /> : <BiShow />}
                </button>
              }
            />

            <TextField
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              trailing={
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="grid h-10 w-10 place-items-center text-ink-3 hover:text-ink">
                  {showConfirm ? <BiHide /> : <BiShow />}
                </button>
              }
            />

            <Button type="submit" size="lg" className="w-full mt-2">
              Confirm Change
            </Button>
          </form>
        </div>
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

export default ChangePass;