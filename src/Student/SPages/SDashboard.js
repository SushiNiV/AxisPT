import React, { useEffect, useState } from 'react';
import { BiBookAlt, BiUser, BiBarChart } from 'react-icons/bi';
import '../../../Global.css';

function SDashboard() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/student/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setProfile(d.data); });
  }, []);

  return (
    <div className="InnerContainer">
      <h2 className="PageHeading">
        Welcome, {profile?.first_name || 'Student'}
      </h2>

      <div className="DashboardStatsRow">
        <div className="StatCard">
          <BiUser className="StatIcon" />
          <div>
            <span className="StatLabel">PROGRAM</span>
            <h3 className="StatValue">{profile?.program_abbr || '—'}</h3>
          </div>
        </div>
        <div className="StatCard">
          <BiBarChart className="StatIcon" />
          <div>
            <span className="StatLabel">YEAR LEVEL</span>
            <h3 className="StatValue">{profile?.year_level || '—'}</h3>
          </div>
        </div>
        <div className="StatCard">
          <BiBookAlt className="StatIcon" />
          <div>
            <span className="StatLabel">STATUS</span>
            <h3 className="StatValue">{profile?.enrollment_status || '—'}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SDashboard;