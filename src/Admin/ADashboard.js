import React, { useState, useEffect, useRef } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  BiGroup, BiUserCheck, BiTime, BiError,
  BiChevronRight, BiBrain
} from 'react-icons/bi';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from 'chart.js';
import './ADashboard.css';


ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const PROGRAM_COLORS = ['#3D1616', '#8B4513', '#A0522D', '#CD853F', '#D2691E'];

function gradeColor(grade) {
  const n = parseFloat(grade);
  if (n <= 1.50) return '#3b6d11';
  if (n <= 2.00) return '#639922';
  if (n <= 2.50) return '#ba7517';
  if (n <= 3.00) return '#d85a30';
  return '#a32d2d';
}

function KpiCard({ icon: Icon, value, label, accent, onClick, hint }) {
  return (
    <button
      className={`db-kpi db-kpi--${accent}${onClick ? ' db-kpi--clickable' : ''}`}
      onClick={onClick}
      disabled={!onClick}
      title={hint}
    >
      <div className={`db-kpi__accent db-kpi__accent--${accent}`} />
      <div className={`db-kpi__icon db-kpi__icon--${accent}`}>
        <Icon size={20} aria-hidden="true" />
      </div>
      <div className="db-kpi__num">{value ?? '—'}</div>
      <div className="db-kpi__label">
        {label}
        {onClick && <BiChevronRight className="db-kpi__arrow" size={14} />}
      </div>
    </button>
  );
}

function ChartCard({ title, hint, onClick, children, wide }) {
  return (
    <div
      className={`db-card${wide ? ' db-card--wide' : ''}${onClick ? ' db-card--clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={hint}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="db-card__head">
        <span className="db-card__title">{title}</span>
        {onClick && (
          <span className="db-card__nav-hint">
            View all <BiChevronRight size={14} />
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function ADashboard({ onNavigate }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiReport, setAiReport] = useState('');
  const [loadingReport, setLoadingReport] = useState(true);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const gradeChartRef = useRef(null);
  const yearChartRef  = useRef(null);
  const progChartRef  = useRef(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setAnalytics(data.data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // Fetch AI Report
  useEffect(() => {
    const fetchAIReport = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/ai-report`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setAiReport(data.report);
      } catch (err) {
        setAiReport('AI report unavailable. Ensure Ollama is running.');
      } finally {
        setLoadingReport(false);
      }
    };
    fetchAIReport();
  }, []);

    const nav = (page, filter = {}) => {
    if (onNavigate) onNavigate(page, filter);
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const username = sessionStorage.getItem('username') || 'Admin';

  const handleGradeBarClick = (event) => {
    if (!gradeChartRef.current) return;
    const chart = gradeChartRef.current;
    const elements = chart.getElementsAtEventForMode(event.nativeEvent, 'nearest', { intersect: true }, false);
    if (elements.length > 0) {
      const idx = elements[0].index;
      const grade = (analytics.grades || [])[idx]?.final_grade;
      if (grade) nav('grades', { final_grade: grade });
    }
  };

  const handleYearBarClick = (event) => {
    if (!yearChartRef.current) return;
    const chart = yearChartRef.current;
    const elements = chart.getElementsAtEventForMode(event.nativeEvent, 'nearest', { intersect: true }, false);
    if (elements.length > 0) {
      const idx = elements[0].index;
      const year = (analytics.yearLevels || [])[idx]?.year_level;
      if (year) nav('masterlist', { year_level: String(year) });
    }
  };

  const handleProgramClick = (event) => {
    if (!progChartRef.current) return;
    const chart = progChartRef.current;
    const elements = chart.getElementsAtEventForMode(event.nativeEvent, 'nearest', { intersect: true }, false);
    if (elements.length > 0) {
      const idx = elements[0].index;
      const program = (analytics.programs || [])[idx]?.program_abbr;
      if (program) nav('masterlist', { program });
    }
  };

  if (loading) return (
    <div className="db-root"><div className="db-body">
      <p className="db-loading">Loading analytics…</p>
    </div></div>
  );

  if (!analytics) return (
    <div className="db-root"><div className="db-body">
      <p className="db-loading">No data available.</p>
    </div></div>
  );

  const totalEnrolled = (analytics.programs || []).reduce((s, p) => s + parseInt(p.count, 10), 0);
  const passed  = analytics.passFail?.find(p => p.status === 'Passed')?.count ?? 0;
  const failed  = analytics.passFail?.find(p => p.status === 'Failed')?.count ?? 0;
  const pending = analytics.pendingCount ?? '—';

  const yearData = {
    labels: (analytics.yearLevels || []).map(y => `Year ${y.year_level}`),
    datasets: [{
      label: 'Students',
      data: (analytics.yearLevels || []).map(y => parseInt(y.count, 10)),
      backgroundColor: '#3D1616',
      hoverBackgroundColor: '#6b2c2c',
      borderRadius: 4,
      borderSkipped: false,
    }],
  };

  const programData = {
    labels: (analytics.programs || []).map(p => p.program_abbr),
    datasets: [{
      data: (analytics.programs || []).map(p => parseInt(p.count, 10)),
      backgroundColor: PROGRAM_COLORS,
      hoverOffset: 6,
      borderWidth: 0,
    }],
  };

  const gradeData = {
    labels: (analytics.grades || []).map(g => g.final_grade),
    datasets: [{
      label: 'Students',
      data: (analytics.grades || []).map(g => parseInt(g.count, 10)),
      backgroundColor: (analytics.grades || []).map(g => gradeColor(g.final_grade)),
      hoverBackgroundColor: (analytics.grades || []).map(g => gradeColor(g.final_grade) + 'cc'),
      borderRadius: 4,
      borderSkipped: false,
    }],
  };

  const barOpts = (axisLabel, clickable) => ({
    responsive: true,
    maintainAspectRatio: false,
    cursor: clickable ? 'pointer' : 'default',
    plugins: { legend: { display: false },
      tooltip: { callbacks: { label: c => ` ${c.parsed.y} students` } }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 12 } },
        ...(axisLabel ? { title: { display: true, text: axisLabel, font: { size: 11 }, color: '#888' } } : {}),
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.06)' },
        ticks: { font: { size: 11 } },
        border: { display: false },
      },
    },
  });

  const donutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: { legend: { display: false },
      tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed}` } }
    },
  };

  const gradeLegend = [
    { label: 'Excellent (1.00–1.50)', color: '#3b6d11' },
    { label: 'Good (1.75–2.00)',      color: '#639922' },
    { label: 'Average (2.25–2.50)',   color: '#ba7517' },
    { label: 'Below avg (2.75–3.00)', color: '#d85a30' },
    { label: 'Failed (5.00)',         color: '#a32d2d' },
  ];

  return (
    <div className="db-root">
      <div className="db-body">

        <div className="db-welcome">
          <div>
            <h1 className="db-welcome__title">Welcome back, {username}</h1>
            <p className="db-welcome__sub">{today}</p>
          </div>
          <span className="db-badge">A.Y. {analytics?.activeYear || '2025–2026'}</span>
        </div>

        {/* ── AI Report Button ── */}
        <button className="ai-report-btn" onClick={() => setAiModalOpen(true)}>
          <span className="ai-report-btn__left">
            <BiBrain size={18} className="ai-report-btn__icon" />
            <span>
              <span className="ai-report-btn__label">AI Analytics Report</span>
              <span className="ai-report-btn__sub">Click to view AI-generated insights</span>
            </span>
          </span>
          <BiChevronRight size={18} className="ai-report-btn__arrow" />
        </button>

        {/* ── AI Report Modal ── */}
        {aiModalOpen && (
          <div className="ai-modal-overlay" onClick={() => setAiModalOpen(false)}>
            <div className="ai-modal" onClick={e => e.stopPropagation()}>
              <div className="ai-modal__header">
                <span className="ai-modal__title-row">
                  <BiBrain size={18} /> AI Analytics Report
                </span>
                <button className="ai-modal__close" onClick={() => setAiModalOpen(false)}>&times;</button>
              </div>
              <div className="ai-modal__body">
                {loadingReport
                  ? <p className="ai-modal__loading">Generating AI insights from your data…</p>
                  : <p className="ai-modal__text">{aiReport}</p>
                }
              </div>
            </div>
          </div>
        )}

        {/* ── KPI row ── */}
        <div className="db-kpi-row">
          <KpiCard
            icon={BiGroup}
            value={totalEnrolled}
            label="Enrolled students"
            accent="maroon"
            onClick={() => nav('masterlist', {})}
            hint="View full masterlist"
          />
          <KpiCard
            icon={BiUserCheck}
            value={passed}
            label="Passed this term"
            accent="green"
            onClick={() => nav('grades', { remarks: 'P' })}
            hint="View students who passed"
          />
          <KpiCard
            icon={BiTime}
            value={pending}
            label="Pending applications"
            accent="amber"
            onClick={() => nav('pending', {})}
            hint="Review pending applications"
          />
          <KpiCard
            icon={BiError}
            value={failed}
            label="Failed this term"
            accent="red"
            onClick={() => nav('grades', { remarks: 'F' })}
            hint="View students who failed"
          />
        </div>

        {/* ── Charts row ── */}
        <div className="db-chart-row">

          <ChartCard
            title="Enrollment by year level"
            hint="Click a bar to filter masterlist by year"
            onClick={null}
          >
            <p className="db-chart-hint">Click a bar to filter by year level</p>
            <div className="db-chart-wrap" style={{ height: 220 }}>
              <Bar
                ref={yearChartRef}
                data={yearData}
                options={barOpts(null, true)}
                onClick={handleYearBarClick}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </ChartCard>

          <ChartCard
            title="Students per program"
            hint="Click a slice to filter masterlist by program"
            onClick={null}
          >
            <p className="db-chart-hint">Click a slice to filter by program</p>
            <div className="db-donut-layout">
              <div className="db-donut-canvas" style={{ cursor: 'pointer' }}>
                <Doughnut
                  ref={progChartRef}
                  data={programData}
                  options={donutOpts}
                  onClick={handleProgramClick}
                />
              </div>
              <div className="db-donut-stats">
                {(analytics.programs || []).map((p, i) => {
                  const pct = totalEnrolled > 0 ? Math.round(p.count / totalEnrolled * 100) : 0;
                  return (
                    <button
                      key={p.program_abbr}
                      className="db-donut-row db-donut-row--btn"
                      onClick={() => nav('masterlist', { program: p.program_abbr })}
                      title={`Filter masterlist by ${p.program_abbr}`}
                    >
                      <span className="db-donut-label">
                        <span className="db-legend-dot" style={{ background: PROGRAM_COLORS[i] }} />
                        {p.program_abbr}
                      </span>
                      <span className="db-donut-val">
                        {p.count} <span className="db-donut-pct">({pct}%)</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Grade distribution" wide hint="Click a bar to filter grades page by that grade">
            <p className="db-chart-hint">Click a bar to filter grades by that grade value</p>
            <div className="db-legend-row">
              {gradeLegend.map(d => (
                <span className="db-legend-item" key={d.label}>
                  <span className="db-legend-dot" style={{ background: d.color }} />
                  {d.label}
                </span>
              ))}
            </div>
            <div className="db-chart-wrap" style={{ height: 220 }}>
              <Bar
                ref={gradeChartRef}
                data={gradeData}
                options={barOpts('Final grade', true)}
                onClick={handleGradeBarClick}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </ChartCard>

        </div>
      </div>
    </div>
  );
}

export default ADashboard;