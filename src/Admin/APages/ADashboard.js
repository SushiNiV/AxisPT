import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';
import { BiUser, BiBook, BiBookOpen, BiGroup, BiTrendingUp } from 'react-icons/bi';
import '../../Global.css';
import '../../GlobalEmpty.css';
import './Dashboard.css';

const PROGRAM_COLORS = ['#3d1616', '#7a2e2e', '#a84d4d', '#c97a7a', '#e5b4b4'];
const YEAR_COLORS = ['#3d1616', '#7a2e2e', '#a84d4d', '#c97a7a', '#e5b4b4'];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = sessionStorage.getItem('token');
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
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="InnerContainer">
        <div className="emptyState">
          <div className="emptyStateIcon">⏳</div>
          <h3 className="emptyStateTitle">Loading Dashboard</h3>
          <p className="emptyStateText">Please wait while we crunch the numbers...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="InnerContainer">
        <div className="emptyState">
          <div className="emptyStateIcon">⚠️</div>
          <h3 className="emptyStateTitle">Error Loading Dashboard</h3>
          <p className="emptyStateText">{error || 'No data available.'}</p>
        </div>
      </div>
    );
  }

  const { totals, studentsByYear, studentsByProgram, standingCounts, recentEnrollments, topCourses } = stats;

  // Format year level labels for chart
  const yearChartData = studentsByYear.map((y) => ({
    name: `Year ${y.year_level}`,
    students: y.count,
  }));

  // Standing chart: normalize to total for pie
  const totalStanding = standingCounts.reduce((sum, s) => sum + s.count, 0) || 1;
  const standingChartData = standingCounts.map((s) => ({
    name: s.status === 'None' ? 'Regular' : s.status,
    value: s.count,
    percentage: ((s.count / totalStanding) * 100).toFixed(0),
  }));

  return (
    <div className="InnerContainer DashboardContainer">
      {/* ===== KPI Cards ===== */}
      <div className="DashboardKPIGrid">
        <KPICard
          icon={<BiUser />}
          label="Active Students"
          value={totals.active_students}
          sublabel={`${totals.total_students} total enrolled`}
        />
        <KPICard
          icon={<BiBook />}
          label="Programs"
          value={totals.active_programs}
          sublabel="Active academic programs"
        />
        <KPICard
          icon={<BiBookOpen />}
          label="Courses"
          value={totals.active_courses}
          sublabel="Active in the catalog"
        />
        <KPICard
          icon={<BiGroup />}
          label="Sections"
          value={totals.total_sections}
          sublabel="All sections on file"
        />
      </div>

      {/* ===== Charts row ===== */}
      <div className="DashboardChartRow">
        {/* Students by Year Level */}
        <div className="DashboardCard">
          <div className="DashboardCardHeader">
            <h3>Students by Year Level</h3>
            <span className="DashboardCardHint">Currently enrolled</span>
          </div>
          <div className="DashboardChartBody">
            {yearChartData.length === 0 ? (
              <p className="DashboardEmpty">No enrollment data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={yearChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#555' }} axisLine={{ stroke: '#ddd' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#555' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: '0.8rem', borderRadius: 6, border: '1px solid #eee' }}
                    cursor={{ fill: 'rgba(61,22,22,0.05)' }}
                  />
                  <Bar dataKey="students" fill="#3d1616" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Academic Standing */}
        <div className="DashboardCard">
          <div className="DashboardCardHeader">
            <h3>Academic Standing</h3>
            <span className="DashboardCardHint">Program Head verified</span>
          </div>
          <div className="DashboardCardBody">
            {standingChartData.length === 0 ? (
              <p className="DashboardEmpty">No verified standings yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={standingChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    labelLine={false}
                    style={{ fontSize: '0.7rem' }}
                  >
                    {standingChartData.map((_, i) => (
                      <Cell key={i} fill={YEAR_COLORS[i % YEAR_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '0.8rem', borderRadius: 6 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ===== Lower row ===== */}
      <div className="DashboardChartRow">
        {/* Students by Program */}
        <div className="DashboardCard">
          <div className="DashboardCardHeader">
            <h3>Students by Program</h3>
            <span className="DashboardCardHint">Current enrollment</span>
          </div>
          <div className="DashboardCardBody">
            {studentsByProgram.length === 0 ? (
              <p className="DashboardEmpty">No students enrolled yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={studentsByProgram}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#555' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="program_abbr"
                    tick={{ fontSize: 12, fill: '#555' }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: '0.8rem', borderRadius: 6 }}
                    cursor={{ fill: 'rgba(61,22,22,0.05)' }}
                  />
                  <Bar dataKey="count" fill="#7a2e2e" radius={[0, 4, 4, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Enrollments */}
        <div className="DashboardCard">
          <div className="DashboardCardHeader">
            <h3>Recent Enrollments</h3>
            <span className="DashboardCardHint">Latest 5</span>
          </div>
          <div className="DashboardCardBody">
            {recentEnrollments.length === 0 ? (
              <p className="DashboardEmpty">No students yet.</p>
            ) : (
              <ul className="DashboardRecentList">
                {recentEnrollments.map((r, i) => (
                  <li key={i} className="DashboardRecentItem">
                    <div className="DashboardRecentInitial">
                      {(r.first_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="DashboardRecentContent">
                      <p className="DashboardRecentName">
                        {r.last_name}, {r.first_name}
                      </p>
                      <p className="DashboardRecentMeta">
                        {r.student_number} &middot; {r.program_abbr || 'No program'}
                      </p>
                    </div>
                    <span className="DashboardRecentDate">
                      {new Date(r.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ===== Top Courses ===== */}
      <div className="DashboardCard DashboardFullWidth">
        <div className="DashboardCardHeader">
          <h3>Most Enrolled Courses</h3>
          <span className="DashboardCardHint">Based on recorded grades</span>
        </div>
        <div className="DashboardCardBody">
          {topCourses.length === 0 ? (
            <p className="DashboardEmpty">No grade records yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topCourses} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="course_code" tick={{ fontSize: 11, fill: '#555' }} axisLine={{ stroke: '#ddd' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#555' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: '0.8rem', borderRadius: 6 }}
                  cursor={{ fill: 'rgba(61,22,22,0.05)' }}
                  formatter={(value, name, props) => [value, props.payload.course_name]}
                />
                <Bar dataKey="enrollment_count" fill="#a84d4d" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Small reusable KPI card ----------
function KPICard({ icon, label, value, sublabel }) {
  return (
    <div className="DashboardKPI">
      <div className="DashboardKPIIcon">{icon}</div>
      <div className="DashboardKPIContent">
        <p className="DashboardKPILabel">{label}</p>
        <p className="DashboardKPIValue">{value}</p>
        <p className="DashboardKPISub">{sublabel}</p>
      </div>
    </div>
  );
}

export default Dashboard;