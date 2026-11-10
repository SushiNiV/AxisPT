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
import Announcements from '../../../Components/shared/Notification/Announcements';
import StudentBreakdown from '../../../Components/charts/StudentBreakdown';
import AISummary from '../../../Components/shared/AISummary';
import BottomSheet from '../../../Components/ui/Bottomsheet';

const ROUTES = {
  students: '/admin/student-management/masterlist',
  academics: '/admin/academics/programs&sections',
};

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // MOBILE: State for the enrollment bottom sheet
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  const role = sessionStorage.getItem('role') || localStorage.getItem('role');
  const userName = sessionStorage.getItem('first_name') || sessionStorage.getItem('username') || 'User';

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
          {/* MOBILE: banner skeleton shrinks on mobile to match WelcomeBanner height */}
          <div className="h-32 animate-pulse rounded-panel bg-line/60 sm:h-40" />
          {/* MOBILE: 2-up on mobile to avoid 4 stacked 128px cards = ~512px dead space */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-panel bg-line/60 sm:h-32" />
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
      {/* MOBILE: px-4 breathing room; prevent horizontal overflow from child charts */}
      <div className="ax flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-4 pb-4 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        <div className="shrink-0 space-y-4">
          <WelcomeBanner
            name={userName}
            role={role === 'faculty' ? 'FACULTY PORTAL' : 'ADMIN PORTAL'}
            subtext={`${totals.active_students} active students · ${totals.total_sections} sections on file`}
            actionText="Go to Masterlist"
            onAction={() => navigate(ROUTES.students)}
          />

          {/* MOBILE: 2-up grid on mobile, 4-up on lg */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard featured label="Active students" value={totals.active_students} hint={`${totals.total_students} total enrolled`} to={ROUTES.students} />
            <StatCard label="Programs" value={totals.active_programs} hint="Active academic programs" to={ROUTES.academics} />
            <StatCard featured label="Courses" value={totals.active_courses} hint="Active in the catalog" to={ROUTES.academics} />
            <StatCard label="Sections" value={totals.total_sections} hint="All sections on file" to={ROUTES.academics} />
          </div>

          {/* MOBILE: min-w-0 guards against chart overflow */}
          <div className="grid items-stretch gap-4 xl:grid-cols-2">
            <div className="min-w-0"><AISummary /></div>
            <div className="min-w-0">
              <StudentBreakdown
                studentsByYear={studentsByYear}
                studentsByProgram={studentsByProgram}
                standingCounts={standingCounts}
                totalStudents={totals.total_students}
              />
            </div>
          </div>
        </div>

        {/* MOBILE: single column up to lg (1024px); 3-col only on xl */}
        <div className="grid shrink-0 items-stretch gap-4 lg:grid-cols-2 xl:min-h-[16rem] xl:flex-1 xl:shrink xl:grid-cols-3 xl:grid-rows-[minmax(0,1fr)]">
          
          {/* RE-WIRED: Real Announcements Component */}
          <Announcements isAdmin={role === 'admin' || role === 'superadmin'} />

          <Card title="Most enrolled courses" hint="Based on recorded grades" scroll className="h-full min-w-0">
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

          {/* MOBILE: on lg (2-col) this spans both; on xl it's a single column again */}
          <Card
            title="Recent enrollments"
            action={<CardLink to={ROUTES.students}>View all</CardLink>}
            scroll
            className="h-full min-w-0 lg:col-span-2 xl:col-span-1"
          >
            {recentEnrollments.length === 0 ? (
              <CardEmpty>No students yet.</CardEmpty>
            ) : (
              <ul className="-my-2 divide-y divide-line">
                {recentEnrollments.map((r, i) => (
                  <li key={i}>
                    {/* MOBILE: row is now a button (44px min touch target, active feedback). Clicking opens the BottomSheet. */}
                    <button
                      type="button"
                      onClick={() => setSelectedEnrollment(r)}
                      className="flex w-full min-h-[44px] items-center gap-3 py-3 text-left transition-colors hover:bg-surface-2 active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand rounded-md sm:rounded-none"
                    >
                      <Avatar first={r.first_name} last={r.last_name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {r.last_name}, {r.first_name}
                        </p>
                        <p className="truncate text-xs text-ink-2">
                          {r.student_number}
                          <span className="hidden sm:inline">, {r.program_abbr || 'No program'}</span>
                        </p>
                        {/* MOBILE: program + date on their own line below sm */}
                        <p className="truncate text-xs text-ink-3 sm:hidden">
                          {r.program_abbr || 'No program'} · {new Date(r.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      {/* MOBILE: date column hidden <sm (moved into the sub-line above) */}
                      <span className="hidden shrink-0 text-xs text-ink-3 sm:inline">
                        {new Date(r.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* MOBILE: BottomSheet for enrollment details */}
      <BottomSheet
        open={!!selectedEnrollment}
        onClose={() => setSelectedEnrollment(null)}
        title="Enrollment Details"
      >
        {selectedEnrollment && (
          <div className="space-y-4 pb-4">
            <div className="flex items-center gap-4">
              <Avatar size="lg" first={selectedEnrollment.first_name} last={selectedEnrollment.last_name} />
              <div>
                <h3 className="text-lg font-semibold text-ink">
                  {selectedEnrollment.first_name} {selectedEnrollment.last_name}
                </h3>
                <p className="text-sm text-ink-2">{selectedEnrollment.student_number}</p>
              </div>
            </div>
            
            <div className="rounded-ctl border !border-line bg-surface-2 p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-ink-2">Program</span>
                <span className="font-medium text-ink">{selectedEnrollment.program_abbr || 'No program'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-2">Enrolled On</span>
                <span className="font-medium text-ink">
                  {new Date(selectedEnrollment.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button 
                className="w-full" 
                onClick={() => {
                  setSelectedEnrollment(null);
                  navigate(ROUTES.students);
                }}
              >
                View in Masterlist
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

export default Dashboard;