import React, { useEffect, useState } from 'react';
import { BiLeftArrowAlt, BiRightArrowAlt, BiSave } from 'react-icons/bi';
import '../../GlobalStyle/Global.css';
import '../../GlobalStyle/GlobalForm.css';

function SProfile() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/student/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { 
        if (d.success) setForm(d.data); 
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      
      const payload = {
        ...form,
        present_houseno: form.present_houseno || form.perm_house_no,
        present_street: form.present_street || form.perm_street,
        present_barangay: form.present_barangay || form.perm_barangay,
        present_city: form.present_city || form.perm_city,
        present_province: form.present_province || form.perm_province,
      };

      const res = await fetch(`${process.env.REACT_APP_API_URL}/student/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully.' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Connection error.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="InnerContainer"><p>Loading profile...</p></div>;
  if (!form) return <div className="InnerContainer"><p>Error loading profile.</p></div>;

  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    // 1. OVERRIDE justify-content so it doesn't push the button to the bottom
    <div className="InnerContainer" style={{ justifyContent: 'flex-start', overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-light)', borderRadius: '3px', marginBottom: '30px', flexShrink: 0 }}>
        <div 
          style={{ 
            width: `${progressPercent}%`, 
            height: '100%', 
            backgroundColor: 'var(--branding-maroon)', 
            borderRadius: '3px',
            transition: 'width 0.3s ease'
          }} 
        />
      </div>

      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Step {currentStep} of {totalSteps}
      </span>
      {message && (
        <div className={`ProfileMessage ${message.type}`} style={{ marginBottom: '20px' }}>
          {message.text}
        </div>
      )}

      {/* 2. Remove flex-shrink: 0 so the form can scroll naturally */}
      <div className="FormContent" style={{ minHeight: '400px', flexShrink: 1 }}>
        
        {/* STEP 1 */}
        {currentStep === 1 && (
          <div className="stepContent">
            <h4 className="sectionHeading" style={{ marginBottom: '15px' }}>Personal Information</h4>
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

            <div className="formRow split3">
              <div className="formGroup">
                <label className="formLabel">Landline</label>
                <input name="landline" value={form.landline || ''} onChange={handleChange} />
              </div>
              <div className="formGroup">
                <label className="formLabel">Nationality</label>
                <input name="nationality" value={form.nationality || ''} onChange={handleChange} />
              </div>
              <div className="formGroup">
                <label className="formLabel">Religion</label>
                <input name="religion" value={form.religion || ''} onChange={handleChange} />
              </div>
            </div>

            <div className="formRow split3">
              <div className="formGroup">
                <label className="formLabel">Civil Status</label>
                <input name="civil_status" value={form.civil_status || ''} onChange={handleChange} />
              </div>
              <div className="formGroup">
                <label className="formLabel">Height</label>
                <input name="height" value={form.height || ''} onChange={handleChange} />
              </div>
              <div className="formGroup">
                <label className="formLabel">Weight</label>
                <input name="weight" value={form.weight || ''} onChange={handleChange} />
              </div>
            </div>

            <h4 className="sectionHeading" style={{ marginTop: '20px', marginBottom: '15px' }}>Present Address</h4>
            <div className="formRow split3">
              <div className="formGroup">
                <label className="formLabel">House No. / Street</label>
                <input name="present_houseno" value={form.present_houseno || ''} onChange={handleChange} />
              </div>
              <div className="formGroup">
                <label className="formLabel">Barangay</label>
                <input name="present_barangay" value={form.present_barangay || ''} onChange={handleChange} />
              </div>
              <div className="formGroup">
                <label className="formLabel">City / Municipality</label>
                <input name="present_city" value={form.present_city || ''} onChange={handleChange} />
              </div>
            </div>
            <div className="formRow split2">
              <div className="formGroup">
                <label className="formLabel">Province</label>
                <input name="present_province" value={form.present_province || ''} onChange={handleChange} />
              </div>
              <div className="formGroup">
                <label className="formLabel">Language / Dialects</label>
                <input name="language_dialects" value={form.language_dialects || ''} onChange={handleChange} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <div className="stepContent">
            <h4 className="sectionHeading" style={{ marginBottom: '15px' }}>Family Background</h4>
            
            <div className="formRow split2">
              <div className="formGroup">
                <label className="formLabel">Who supports your education?</label>
                <select name="support" value={form.support || ''} onChange={handleChange}>
                  <option value="">-- Select --</option>
                  <option value="Parents">Parents</option>
                  <option value="Relatives">Relatives</option>
                  <option value="Brother or Sister">Brother or Sister</option>
                  <option value="Benefactors">Benefactors</option>
                  <option value="Scholarship">Scholarship</option>
                </select>
              </div>
              <div className="formGroup">
                <label className="formLabel">Parents' Joint Monthly Income</label>
                <select name="parents_income" value={form.parents_income || ''} onChange={handleChange}>
                  <option value="">-- Select --</option>
                  <option value="Below P20K">Below P20K</option>
                  <option value="P21K to P40K">P21K to P40K</option>
                  <option value="P41K to P60K">P41K to P60K</option>
                  <option value="Above P80K">Above P80K</option>
                </select>
              </div>
            </div>

            <div className="formRow split3">
              <div className="formGroup">
                <label className="formLabel">Living Situation</label>
                <select name="living_in" value={form.living_in || ''} onChange={handleChange}>
                  <option value="">-- Select --</option>
                  <option value="Dorm/Boarding House">Dorm/Boarding House</option>
                  <option value="Parent's House">Parent's House</option>
                  <option value="Relative's House">Relative's House</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="formGroup">
                <label className="formLabel">Daily Transportation</label>
                <select name="daily_transpo_expense" value={form.daily_transpo_expense || ''} onChange={handleChange}>
                  <option value="">-- Select --</option>
                  <option value="< P50">Less than P50</option>
                  <option value="P51-P100">P51 to P100</option>
                  <option value="> P100">More than P100</option>
                </select>
              </div>
              <div className="formGroup">
                <label className="formLabel">No. of Siblings</label>
                <input type="number" min="0" name="no_siblings" value={form.no_siblings || ''} onChange={handleChange} />
              </div>
            </div>

            <div className="formRow split2">
              <div className="formGroup">
                <label className="formLabel">Ordinal Position</label>
                <select name="ordinal_position" value={form.ordinal_position || ''} onChange={handleChange}>
                  <option value="">-- Select --</option>
                  <option value="Only Child">Only Child</option>
                  <option value="Eldest Child">Eldest Child</option>
                  <option value="Middle Child">Middle Child</option>
                  <option value="Youngest Child">Youngest Child</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <div className="stepContent">
            <h4 className="sectionHeading" style={{ marginBottom: '15px' }}>Achievements & Interests</h4>
            
            <div className="formRow split2">
              <div className="formGroup">
                <label className="formLabel">Awards / Honors Received</label>
                <textarea rows="3" name="awards_honors" value={form.awards_honors || ''} onChange={handleChange} />
              </div>
              <div className="formGroup">
                <label className="formLabel">Future Career / Work</label>
                <textarea rows="3" name="future_career" value={form.future_career || ''} onChange={handleChange} />
              </div>
            </div>

            <div className="formRow split2">
              <div className="formGroup">
                <label className="formLabel">Hobbies / Sports / Interests</label>
                <textarea rows="3" name="hobbies_interests" value={form.hobbies_interests || ''} onChange={handleChange} />
              </div>
              <div className="formGroup">
                <label className="formLabel">Academic Clubs / Extracurriculars</label>
                <textarea rows="3" name="acad_extracurr" value={form.acad_extracurr || ''} onChange={handleChange} />
              </div>
            </div>

            <h4 className="sectionHeading" style={{ marginTop: '20px', marginBottom: '15px' }}>Visual & Health</h4>
            <div className="formRow">
              <div className="formGroup">
                <label className="formLabel">Visual Problems / Needs</label>
                <input name="visual_problems" value={form.visual_problems || ''} onChange={handleChange} />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Navigation Buttons - Forced to bottom of the content */}
      <div style={{ align:'flex-end' }}>
        <button 
          type="button" 
          className="cancelBtn" 
          onClick={handleBack} 
          disabled={currentStep === 1 || saving}
          style={{ 
            padding: '10px 20px',
            borderRadius: '6px',
            border: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            visibility: currentStep === 1 ? 'hidden' : 'visible' 
          }}
        >
          <BiLeftArrowAlt style={{ marginRight: '5px', fontSize: '1.2rem' }}/> BACK
        </button>

         {currentStep < totalSteps ? (
          <button 
            type="button" 
            className="ApplyFilterBtn" 
            onClick={handleNext}
            style={{ 
              width: 'auto', 
              flex: 'none', // <--- THIS PREVENTS IT FROM STRETCHING
              padding: '10px 30px', 
              display: 'flex', 
              alignItems: 'center',
              marginLeft: 'auto' // <--- FORCES IT TO THE RIGHT
            }}
          >
            NEXT <BiRightArrowAlt style={{ marginLeft: '5px', fontSize: '1.2rem' }}/>
          </button>
        ) : (
          <button 
            type="button" 
            className="ApplyFilterBtn" 
            onClick={handleSave} 
            disabled={saving}
            style={{ 
              width: 'auto', 
              flex: 'none',
              padding: '10px 30px', 
              display: 'flex', 
              alignItems: 'center',
              marginLeft: 'auto'
            }}
          >
            {saving ? 'SAVING…' : <><BiSave style={{ marginRight: '5px', fontSize: '1.2rem' }}/> SAVE CHANGES</>}
          </button>
        )}
      </div>

    </div>
  );
}

export default SProfile;