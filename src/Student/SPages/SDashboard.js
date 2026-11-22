import React, { useEffect, useState } from 'react';
import { BiBookAlt, BiUser, BiTrendingUp, BiBookOpen, BiErrorCircle } from 'react-icons/bi';
import { Link } from 'react-router-dom';
import WelcomeBanner from '../../Components/shared/WelcomeBanner';
import Announcements from '../../Components/shared/Notification/Announcements';
import Card from '../../Components/ui/Card';
import EmptyState from '../../Components/ui/Emptystate';
import Button from '../../Components/ui/Button';

const NO_TOKEN = 'Your session has expired. Please sign in again.';

const Bar = ({ className }) => (
  <div className={`animate-pulse rounded-md bg-surface-2 motion-reduce:animate-none ${className}`} />
);

/** Placeholder with the same layout as the loaded dashboard, so nothing jumps when data arrives. */
function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading dashboard" className="space-y-4">
      <Bar className="h-28 !rounded-2xl" />

      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="flex items-center gap-4 p-4">
            <Bar className="h-12 w-12 shrink-0 !rounded-xl" />
            <div className="flex-1 space-y-2">
              <Bar className="h-3 w-20" />
              <Bar className="h-5 w-28" />
              <Bar className="h-3 w-24" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-4 p-4 lg:col-span-2">
          <Bar className="h-5 w-32" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Bar className="h-9 w-9 shrink-0 !rounded-full" />
              <div className="flex-1 space-y-2">
                <Bar className="h-3 w-24" />
                <Bar className="h-3 w-40" />
              </div>
              <Bar className="h-4 w-10" />
            </div>
          ))}
        </Card>
        <Card className="space-y-4 p-4">
          <Bar className="h-5 w-32" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Bar className="h-3 w-24" />
              <Bar className="h-3 w-full" />
            </div>
          ))}
        </Card>
      </div>
      <span className="sr-only">Loading dashboard…</span>
    </div>
  );
}

function SDashboard() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ gwa: '—', subjectsCount: 0, standing: 'None' });
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [announcements] = useState([
    { id: 1, title: "HEYHEYHEY!", body: "Ano yan", date: "2026-10-23T22:34:00" },
    { id: 2, title: "DEADLINE FOR THE RESUME", body: "Dear students, The deadline for the resume is set today.", date: "2026-10-23T14:07:00" },
  ]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) {
      setError(NO_TOKEN);
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
        // Taken from the server so manual changes by staff are respected.
        const standing = profileData.data?.academic_status || 'None';

        if (gradesData.success && gradesData.data.length > 0) {
          const grades = gradesData.data;
          
          const sortedGrades = [...grades].sort((a, b) => {
            if (b.year_level !== a.year_level) return b.year_level - a.year_level;
            return b.semester_id - a.semester_id;
          });

          setGrades(sortedGrades); // newest term first

          const validGrades = grades.filter(g => g.final_grade != null);
          if (validGrades.length > 0) {
            const sum = validGrades.reduce((acc, curr) => acc + parseFloat(curr.final_grade), 0);
            gwa = (sum / validGrades.length).toFixed(2);
          }
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
  }, [reloadKey]);

  if (loading) {
    return (
      <div className="InnerContainer ArchiveLayout">
        <div className="ax min-h-0 flex-1 overflow-y-auto pb-4">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="InnerContainer ArchiveLayout">
        <div className="ax flex flex-1 flex-col">
          <EmptyState
            icon={BiErrorCircle}
            title="Couldn't load your dashboard"
            text={error}
            action={
              error === NO_TOKEN ? (
                <Link to="/signin">
                  <Button>Go to sign in</Button>
                </Link>
              ) : (
                <Button onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>
              )
            }
          />
        </div>
      </div>
    );
  }

  // One list: each enrolled subject with its latest grade (grades are sorted newest first).
  const latestGrade = new Map();
  grades.forEach((g) => { if (!latestGrade.has(g.course_code)) latestGrade.set(g.course_code, g); });
  const courses = subjects.map((sub) => ({ ...sub, grade: latestGrade.get(sub.course_code) || null }));
  const gradedCount = courses.filter((c) => c.grade?.final_grade != null).length;

  const getStandingStyle = (standing) => {
      switch (standing) {
        case 'None':
        case 'Regular': 
          return { dot: 'bg-emerald-500', text: 'text-emerald-700' };
        case 'Warning': 
          return { dot: 'bg-amber-500', text: 'text-amber-700' };
        case 'Probationary 1':
        case 'Probationary 2': 
          return { dot: 'bg-rose-500', text: 'text-rose-700' };
        default: 
          return { dot: 'bg-gray-400', text: 'text-gray-700' };
      }
    };

  return (
    <div className="InnerContainer ArchiveLayout">
      <div className="ax min-h-0 flex-1 space-y-4 overflow-y-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        
        {/* Welcome Banner with Clean White Pill */}
        <WelcomeBanner
          name={profile?.first_name || 'Student'}
          subtext="Here is your academic overview for the current term."
          actionNode={
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold">
              <span className={`h-2.5 w-2.5 rounded-full ${getStandingStyle(stats.standing).dot}`} />
              <span className={getStandingStyle(stats.standing).text}>
                Standing: {stats.standing === 'None' ? 'Regular' : stats.standing}
              </span>
            </div>
          }
        />

        {/* KPI Row */}
        <div className="grid gap-4 md:grid-cols-3">
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
              <p className="text-xs text-ink-2">{gradedCount} of {stats.subjectsCount} graded</p>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          
          <div className="lg:col-span-2 space-y-4">
            
            <Card title="My Courses" action={<Link to="/student/academics" className="text-sm font-medium text-brand-ink hover:underline">View all</Link>}>
              {courses.length === 0 ? (
                <p className="text-sm text-ink-3 py-4 text-center">No active subjects enrolled.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {courses.slice(0, 6).map((c) => {
                    const graded = c.grade?.final_grade != null;
                    const failed = graded && c.grade.remarks === 'F';
                    return (
                      <li key={c.course_code} className="flex items-center gap-3 py-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-brand">
                          <BiBookAlt className="text-base" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{c.course_code}</p>
                          <p className="truncate text-xs text-ink-2">{c.course_name}</p>
                        </div>
                        <span className="hidden shrink-0 rounded bg-surface-2 px-2 py-1 text-xs font-medium text-ink-2 sm:inline">
                          {c.section_name || 'No Section'}
                        </span>
                        {graded ? (
                          <span className={`w-12 shrink-0 text-right font-bold tabular-nums ${failed ? 'text-danger' : 'text-brand-ink'}`}>
                            {c.grade.final_grade}
                          </span>
                        ) : (
                          <span className="w-12 shrink-0 text-right text-xs text-ink-3">No grade</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

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