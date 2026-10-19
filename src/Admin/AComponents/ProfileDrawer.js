import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiX, BiUserCircle, BiLockAlt } from 'react-icons/bi';
import './ProfileDrawer.css';

function ProfileDrawer({ isOpen, onClose, user }) {
  const navigate = useNavigate();
  const closeRef = useRef(null);

  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const displayName = user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Administrator';
  const initial = displayName !== '—' ? displayName.charAt(0).toUpperCase() : '';
  
  const role = user?.role || 'Administrator';
  const email = user?.email || '—';

  const handleGoToChangePassword = () => {
    onClose();
    navigate('/change-password');
  };

  return (
    <>
      <div
        className={`ProfileBackdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`ProfileDrawer ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Profile"
        aria-hidden={!isOpen}
      >
        <header className="ProfileDrawerHeader">
          <h2 className="ProfileDrawerTitle">Profile</h2>
          <button ref={closeRef} className="ProfileIconBtn" onClick={onClose} aria-label="Close profile">
            <BiX />
          </button>
        </header>

        <div className="ProfileDrawerBody">
          
          {/* Identity Section */}
          <div className="ProfileIdentity">
            {user?.profileUrl ? (
              <img src={user.profileUrl} alt="" className="ProfileAvatar" />
            ) : initial ? (
              <div className="ProfileAvatar ProfileAvatarInitial">{initial}</div>
            ) : (
              <BiUserCircle className="ProfileAvatar ProfileAvatarPlaceholder" />
            )}
            <div className="ProfileIdentityText">
              <span className="ProfileName">{displayName}</span>
              <span className="ProfileRole">{role}</span>
            </div>
          </div>

          {/* Details Card */}
          <div className="ProfileDetails">
            <div className="ProfileDetailRow">
              <dt>Name</dt>
              <dd>{displayName}</dd>
            </div>
            <div className="ProfileDetailRow">
              <dt>Email</dt>
              <dd>{email}</dd>
            </div>
            <div className="ProfileDetailRow">
              <dt>Role</dt>
              <dd>{role}</dd>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="ProfileDrawerFooter">
          <button 
            className="ProfileFooterBtn" 
            onClick={handleGoToChangePassword}
          >
            <BiLockAlt /> Change Password
          </button>
        </div>
      </aside>
    </>
  );
}

export default ProfileDrawer;