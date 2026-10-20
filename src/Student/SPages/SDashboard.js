import React, { useEffect, useState } from 'react';
import { BiBookAlt, BiUser, BiBarChart, BiTrendingUp, BiCheckCircle, BiBookOpen } from 'react-icons/bi';
import { Link } from 'react-router-dom';
import '../../GlobalStyle/Global.css';
import '../../GlobalStyle/Dashboard.css';

function SDashboard() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ gwa: '—', subjectsCount: 0, standing: 'Regular' });
  const [recentGrades, setRecentGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) {
      setError("No token found. Please log in again.");
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${process.env.REACT_APP_API_URL}/student/profile`, { headers }).then(r => r.json()),
      fetch(`${process.env.REACT_APP_API_URL}/student/grades`, { headers }).then(r => r.json()),
      fetch(`${process.env.REACT_APP_API_URL}/student/subjects`, { headers }).then(r => r.json())
    ])
      .then(([profileData, gradesData, subjectsData]) => {
        if (profileData.success) setProfile(profileData.data);

        let gwa = '—';
        let standing = profileData.data?.standing || 'Regular';

        if (gradesData.success && gradesData.data.length > 0) {
          const grades = gradesData.data;
          
          // Sort grades by year and semester (newest first) to get "recent" ones
          const sortedGrades = [...grades].sort((a, b) => {
            if (b.year_level !== a.year_level) return b.year_level - a.year_level;
            return b.semester_id - a.semester_id;
          });

          // Take the top 4 for the dashboard
          setRecentGrades(sortedGrades.slice(0, 4));

          const validGrades = grades.filter(g => g.final_grade != null);
          if (validGrades.length > 0) {
            const sum = validGrades.reduce((acc, curr) => acc + parseFloat(curr.final_grade), 0);
            gwa = (sum / validGrades.length).toFixed(2);
          }

          const failedCourses = grades.filter(g => g.remarks === 'F').length;
          if (failedCourses >= 5) standing = 'Probationary 2';
          else if (failedCourses >= 3) standing = 'Probationary 1';
          else if (failedCourses >= 1) standing = 'Warning';
        }

        let subjectsCount = 0;
        if (subjectsData.success && subjectsData.data.enrolled) {
          setSubjects(subjectsData.data.enrolled);
          subjectsCount = subjectsData.data.enrolled.length;
        }

        setStats({ gwa, subjectsCount, standing });
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

      {/* KPI Row */}
      <div className="DashboardKPIGrid">
        <div className="DashboardKPI">
          <div className="DashboardKPIIcon"><BiUser /></div>
          <div className="DashboardKPIContent">
            <p className="DashboardKPILabel">PROGRAM</p>
            <h3 className="DashboardKPIValue">{profile?.program_abbr || '—'}</h3>
            <p className="DashboardKPISub">Year {profile?.year_level || '—'}</p>
          </div>
        </div>

        <div className="DashboardKPI">
          <div className="DashboardKPIIcon"><BiTrendingUp /></div>
          <div className="DashboardKPIContent">
            <p className="DashboardKPILabel">CURRENT GWA</p>
            <h3 className="DashboardKPIValue">{stats.gwa}</h3>
            <p className="DashboardKPISub">Based on all recorded grades</p>
          </div>
        </div>

        <div className="DashboardKPI">
          <div className="DashboardKPIIcon"><BiBookOpen /></div>
          <div className="DashboardKPIContent">
            <p className="DashboardKPILabel">SUBJECTS</p>
            <h3 className="DashboardKPIValue">{stats.subjectsCount}</h3>
            <p className="DashboardKPISub">Currently enrolled this term</p>
          </div>
        </div>

        <div className="DashboardKPI">
          <div className="DashboardKPIIcon"><BiCheckCircle /></div>
          <div className="DashboardKPIContent">
            <p className="DashboardKPILabel">STANDING</p>
            <h3 className="DashboardKPIValue">{stats.standing}</h3>
            <p className="DashboardKPISub">Academic status</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout for Recent Grades & Current Subjects */}
      <div className="DashboardChartRow" style={{ marginTop: '1rem' }}>
        
        {/* Recent Grades */}
        <div className="DashboardCard">
          <div className="DashboardCardHeader">
            <h3>Recent Grades</h3>
            <Link to="/student/grades" style={{ fontSize: '0.8rem', color: 'var(--text-brand)', fontWeight: 600 }}>View All</Link>
          </div>
          <div className="DashboardCardBody">
            {recentGrades.length === 0 ? (
              <p className="DashboardEmpty">No grades recorded yet.</p>
            ) : (
              <ul className="DashboardRecentList">
                {recentGrades.map((g, i) => (
                  <li key={i} className="DashboardRecentItem">
                    <div className="DashboardRecentInitial" style={{ backgroundColor: g.remarks === 'F' ? 'var(--status-danger-text)' : 'var(--branding-maroon)' }}>
                      {g.course_code.substring(0, 2)}
                    </div>
                    <div className="DashboardRecentContent">
                      <p className="DashboardRecentName">{g.course_code}</p>
                      <p className="DashboardRecentMeta" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                        {g.course_name}
                      </p>
                    </div>
                    <span style={{ fontWeight: 700, color: g.remarks === 'F' ? 'var(--status-danger-text)' : 'var(--text-brand)' }}>
                      {g.final_grade}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Current Subjects */}
        <div className="DashboardCard">
          <div className="DashboardCardHeader">
            <h3>Current Subjects</h3>
            <Link to="/student/subjects" style={{ fontSize: '0.8rem', color: 'var(--text-brand)', fontWeight: 600 }}>View All</Link>
          </div>
          <div className="DashboardCardBody">
            {subjects.length === 0 ? (
              <p className="DashboardEmpty">No active subjects enrolled.</p>
            ) : (
              <ul className="DashboardRecentList">
                {subjects.slice(0, 4).map((s, i) => (
                  <li key={i} className="DashboardRecentItem">
                    <div className="DashboardRecentInitial" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-brand)' }}>
                      <BiBookAlt />
                    </div>
                    <div className="DashboardRecentContent">
                      <p className="DashboardRecentName">{s.course_code}</p>
                      <p className="DashboardRecentMeta" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                        {s.course_name}
                      </p>
                    </div>
                    <span className="detailBadge" style={{ fontSize: '0.7rem' }}>
                      {s.section_name || 'No Section'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default SDashboard;