import React, { useEffect, useState } from 'react';
import '../../../Global.css';
import '../../../GlobalForm.css';

function SProfile() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/student/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setForm(d.data); });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/student/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) setMessage({ type: 'success', text: 'Profile updated.' });
      else setMessage({ type: 'error', text: data.message || 'Failed to update.' });
    } catch (e) {
      setMessage({ type: 'error', text: 'Connection error.' });
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <div className="DocListMessage">Loading…</div>;

  return (
    <div className="InnerContainer">
      <h2 className="PageHeading">My Profile</h2>

      {message && (
        <div className={`ProfileMessage ${message.type}`}>{message.text}</div>
      )}

      <div className="FormContent">
        <div className="formRow split2">
          <div className="formGroup">
            <label className="formLabel">Personal Email</label>
            <input name="personal_email" value={form.personal_email || ''} onChange={handleChange} />
          </div>
          <div className="formGroup">
            <label className="formLabel">Mobile No.</label>
            <input name="mobile_no" value={form.mobile_no || ''} onChange={handleChange} />
          </div>
        </div>

        <div className="formRow split2">
          <div className="formGroup">
            <label className="formLabel">Landline</label>
            <input name="landline" value={form.landline || ''} onChange={handleChange} />
          </div>
          <div className="formGroup">
            <label className="formLabel">Nationality</label>
            <input name="nationality" value={form.nationality || ''} onChange={handleChange} />
          </div>
        </div>

        <div className="formRow split2">
          <div className="formGroup">
            <label className="formLabel">Religion</label>
            <input name="religion" value={form.religion || ''} onChange={handleChange} />
          </div>
          <div className="formGroup">
            <label className="formLabel">Civil Status</label>
            <input name="civil_status" value={form.civil_status || ''} onChange={handleChange} />
          </div>
        </div>

        <div className="formRow split2">
          <div className="formGroup">
            <label className="formLabel">Height</label>
            <input name="height" value={form.height || ''} onChange={handleChange} />
          </div>
          <div className="formGroup">
            <label className="formLabel">Weight</label>
            <input name="weight" value={form.weight || ''} onChange={handleChange} />
          </div>
        </div>

        <div className="formRow split2">
          <div className="formGroup">
            <label className="formLabel">Language / Dialect</label>
            <input name="language_dialects" value={form.language_dialects || ''} onChange={handleChange} />
          </div>
          <div className="formGroup">
            <label className="formLabel">Visual Problems</label>
            <input name="visual_problems" value={form.visual_problems || ''} onChange={handleChange} />
          </div>
        </div>

        <div className="BtnsContainer">
          <button className="ApplyFilterBtn" onClick={handleSave} disabled={saving}>
            {saving ? 'SAVING…' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SProfile;