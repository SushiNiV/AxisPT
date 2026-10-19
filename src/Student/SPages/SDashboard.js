import React, { useEffect, useState } from 'react';
import { BiBookAlt, BiUser, BiBarChart } from 'react-icons/bi';
import '../../GlobalStyle/Global.css';
import '../../GlobalStyle/Dashboard.css';

function SDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    
    if (!token) {
      setError("No token found. Please log in again.");
      setLoading(false);
      return;
    }

    fetch(`${process.env.REACT_APP_API_URL}/student/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { 
        if (d.success) setProfile(d.data); 
        else setError(d.message || "Failed to load profile.");
      })
      .catch(err => {
        console.error("Dashboard fetch error:", err);
        setError("Network error. Could not connect to server.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="InnerContainer"><p>Loading dashboard...</p></div>;
  if (error) return <div className="InnerContainer"><p style={{ color: 'red' }}>Error: {error}</p></div>;

  return (
    <div className="InnerContainer DashboardContainer">
      <h2 className="PageHeading">
        Welcome, {profile?.first_name || 'Student'}
      </h2>

      <div className="DashboardKPIGrid">
        <div className="DashboardKPI">
          <div className="DashboardKPIIcon">
            <BiUser />
          </div>
          <div className="DashboardKPIContent">
            <p className="DashboardKPILabel">PROGRAM</p>
            <h3 className="DashboardKPIValue">{profile?.program_abbr || '—'}</h3>
          </div>
        </div>

        <div className="DashboardKPI">
          <div className="DashboardKPIIcon">
            <BiBarChart />
          </div>
          <div className="DashboardKPIContent">
            <p className="DashboardKPILabel">YEAR LEVEL</p>
            <h3 className="DashboardKPIValue">{profile?.year_level || '—'}</h3>
          </div>
        </div>

        <div className="DashboardKPI">
          <div className="DashboardKPIIcon">
            <BiBookAlt />
          </div>
          <div className="DashboardKPIContent">
            <p className="DashboardKPILabel">STATUS</p>
            <h3 className="DashboardKPIValue">{profile?.enrollment_status || '—'}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SDashboard;