import React, { useEffect, useState } from 'react';
import { BiBookAlt, BiUser, BiBarChart, BiTrendingUp, BiCheckCircle, BiBookOpen } from 'react-icons/bi';
import { Link, useNavigate } from 'react-router-dom';
import WelcomeBanner from '../../Components/shared/WelcomeBanner'; // NEW
import Announcements from '../../Components/shared/Announcements'; // NEW

// Assuming these are from your standard Tailwind components
import Card from '../../Components/ui/Card';

function SDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ gwa: '—', subjectsCount: 0, standing: 'Regular' });
  const [recentGrades, setRecentGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // DUMMY ANNOUNCEMENTS
  const [announcements] = useState([
    { id: 1, title: "HEYHEYHEY!", body: "Ano yan", date: "2026-10-23T22:34:00" },
    { id: 2, title: "DEADLINE FOR THE RESUME", body: "Dear students, The deadline for the resume is set today.", date: "2026-10-23T14:07:00" },
  ]);

  useEffect(() => {
    // ... (Keep your exact same useEffect fetching logic here) ...
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
          
          const sortedGrades = [...grades].sort((a, b) => {
            if (b.year_level !== a.year_level) return b.year_level - a.year_level;
            return b.semester_id - a.semester_id;
          });

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
    <div className="InnerContainer ArchiveLayout">
      <div className="ax min-h-0 flex-1 space-y-4 overflow-y-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        
        {/* NEW: Welcome Banner */}
        <WelcomeBanner
          name={profile?.first_name || 'Student'}
          subtext="Next up: Complete Course Evaluation from the Registrar's Office. 44 still to upload."
          actionText="Upload now"
          onAction={() => navigate('/student/documents')} // Adjust route if needed
        />

        {/* KPI Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-brand">
              <BiUser className="text-2xl" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Program</p>
              <h3 className="font-display text-xl font-bold text-ink">{profile?.program_abbr || '—'}</h3>
              <p className="text-xs text-ink-2">Year {profile?.year_level || '—'}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-brand">
              <BiTrendingUp className="text-2xl" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Current GWA</p>
              <h3 className="font-display text-xl font-bold text-ink">{stats.gwa}</h3>
              <p className="text-xs text-ink-2">Based on all recorded grades</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-brand">
              <BiBookOpen className="text-2xl" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Subjects</p>
              <h3 className="font-display text-xl font-bold text-ink">{stats.subjectsCount}</h3>
              <p className="text-xs text-ink-2">Currently enrolled this term</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-brand">
              <BiCheckCircle className="text-2xl" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Standing</p>
              <h3 className="font-display text-xl font-bold text-ink">{stats.standing}</h3>
              <p className="text-xs text-ink-2">Academic status</p>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          
          {/* Left Column (Grades & Subjects) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Recent Grades */}
            <Card title="Recent Grades" action={<Link to="/student/grades" className="text-sm font-medium text-brand-ink hover:underline">View All</Link>}>
              {recentGrades.length === 0 ? (
                <p className="text-sm text-ink-3 py-4 text-center">No grades recorded yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {recentGrades.map((g, i) => (
                    <li key={i} className="flex items-center gap-4 py-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-brand-on ${g.remarks === 'F' ? 'bg-danger' : 'bg-brand'}`}>
                        {g.course_code.substring(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{g.course_code}</p>
                        <p className="truncate text-xs text-ink-2">{g.course_name}</p>
                      </div>
                      <span className={`shrink-0 font-bold tabular-nums ${g.remarks === 'F' ? 'text-danger' : 'text-brand-ink'}`}>
                        {g.final_grade}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Current Subjects */}
            <Card title="Current Subjects" action={<Link to="/student/subjects" className="text-sm font-medium text-brand-ink hover:underline">View All</Link>}>
              {subjects.length === 0 ? (
                <p className="text-sm text-ink-3 py-4 text-center">No active subjects enrolled.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {subjects.slice(0, 4).map((s, i) => (
                    <li key={i} className="flex items-center gap-4 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-brand">
                        <BiBookAlt className="text-base" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{s.course_code}</p>
                        <p className="truncate text-xs text-ink-2">{s.course_name}</p>
                      </div>
                      <span className="shrink-0 rounded bg-surface-2 px-2 py-1 text-xs font-medium text-ink-2">
                        {s.section_name || 'No Section'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Right Column (Announcements) */}
          <div className="lg:col-span-1">
            <Announcements 
              announcements={announcements} 
              isAdmin={false} 
            />
          </div>

        </div>

      </div>
    </div>
  );
}

export default SDashboard;