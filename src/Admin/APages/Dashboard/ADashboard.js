import React, { useCallback, useEffect, useState } from 'react';
import { BiErrorCircle } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import Button from '../../../Components/ui/Button';
import Avatar from '../../../Components/ui/Avatar';
import EmptyState from '../../../Components/ui/Emptystate';
import Card, { CardLink, CardEmpty } from '../../../Components/ui/Card';
import StatCard from '../../../Components/ui/Statcard';
import RankedBars from '../../../Components/charts/Rankedbars';
import WelcomeBanner from '../../../Components/shared/WelcomeBanner';
import Announcements from '../../../Components/shared/Announcements';
import StudentBreakdown from '../../../Components/charts/StudentBreakdown'; // NEW

const ROUTES = {
  students: '/admin/student-management/masterlist',
  academics: '/admin/academics/programs&sections',
};

// REALISTIC ADMIN ANNOUNCEMENTS
const DUMMY_ANNOUNCEMENTS = [
  { id: 1, title: "Midterm Grade Submission", body: "Please ensure all midterm grades are encoded in the system before Friday, 5:00 PM.", date: "2026-10-25T09:00:00" },
  { id: 2, title: "Faculty Meeting", body: "There will be a brief faculty meeting tomorrow at 2 PM in Room 304 to discuss the upcoming accreditation.", date: "2026-10-24T14:30:00" },
  { id: 3, title: "System Maintenance", body: "AxisPT will be down for scheduled maintenance this Saturday from 10 PM to 2 AM.", date: "2026-10-23T11:00:00" },
];

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [announcements] = useState(DUMMY_ANNOUNCEMENTS);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setStats(data.data);
      else setError(data.message || 'Failed to load dashboard.');
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="InnerContainer ArchiveLayout">
        <div className="ax space-y-4" aria-busy="true">
          <div className="h-40 animate-pulse rounded-panel bg-line/60" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-panel bg-line/60" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="h-72 animate-pulse rounded-panel bg-line/60 lg:col-span-2" />
            <div className="h-72 animate-pulse rounded-panel bg-line/60" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="InnerContainer ArchiveLayout">
        <div className="ax flex flex-1 flex-col">
          <EmptyState
            icon={BiErrorCircle}
            title="Couldn't load the dashboard"
            text={error || 'No data available.'}
            action={<Button onClick={fetchStats}>Try again</Button>}
          />
        </div>
      </div>
    );
  }

  const { totals, studentsByYear, studentsByProgram, standingCounts, recentEnrollments, topCourses } = stats;

  return (
    <div className="InnerContainer ArchiveLayout">
      <div className="ax min-h-0 flex-1 space-y-4 overflow-y-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        
        {/* Welcome Banner */}
        <WelcomeBanner
          name="Administrator"
          role="ADMIN PORTAL"
          subtext={`You have ${totals.active_students} active students and ${totals.total_sections} sections currently on file. Here is your daily overview.`}
          actionText="Go to Masterlist"
          onAction={() => navigate(ROUTES.students)}
        />

        {/* Headline numbers */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard featured label="Active students" value={totals.active_students} hint={`${totals.total_students} total enrolled`} to={ROUTES.students} />
          <StatCard label="Programs" value={totals.active_programs} hint="Active academic programs" to={ROUTES.academics} />
          <StatCard featured label="Courses" value={totals.active_courses} hint="Active in the catalog" to={ROUTES.academics} />
          <StatCard label="Sections" value={totals.total_sections} hint="All sections on file" to={ROUTES.academics} />
        </div>

        {/* Main Middle Grid: Breakdown & Announcements */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
             <StudentBreakdown 
                studentsByYear={studentsByYear}
                studentsByProgram={studentsByProgram}
                standingCounts={standingCounts}
                totalStudents={totals.total_students}
             />
          </div>
          <div className="lg:col-span-1">
            
             <Announcements 
               announcements={announcements} 
               isAdmin={true} 
               onCreate={() => console.log('Open Create Modal')}
               onEdit={(a) => console.log('Edit', a)}
               onDelete={(a) => console.log('Delete', a)}
             />
          </div>
        </div>

        {/* Bottom Row: Courses & Recent */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Most enrolled courses" hint="Based on recorded grades">
            {topCourses.length === 0 ? (
              <CardEmpty>No grade records yet.</CardEmpty>
            ) : (
              <RankedBars
                items={topCourses.map((c) => ({
                  label: c.course_code,
                  sublabel: c.course_name,
                  value: c.enrollment_count,
                }))}
              />
            )}
          </Card>

          <Card
            title="Recent enrollments"
            action={<CardLink to={ROUTES.students}>View all</CardLink>}
          >
            {recentEnrollments.length === 0 ? (
              <CardEmpty>No students yet.</CardEmpty>
            ) : (
              <ul className="-my-2 divide-y divide-line">
                {recentEnrollments.map((r, i) => (
                  <li key={i} className="flex items-center gap-3 py-3">
                    <Avatar first={r.first_name} last={r.last_name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{r.last_name}, {r.first_name}</p>
                      <p className="truncate text-xs text-ink-2">{r.student_number}, {r.program_abbr || 'No program'}</p>
                    </div>
                    <span className="shrink-0 text-xs text-ink-3">
                      {new Date(r.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;