import React, { useEffect, useState } from 'react';
import { BiChevronDown, BiChevronUp } from 'react-icons/bi';
import '../../GlobalStyle/Global.css';
import '../../GlobalStyle/GlobalAccordion.css';
import '../../ResponsiveStyle/ResponsiveComponent.css'

function SGrades() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTerms, setExpandedTerms] = useState({});

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/student/grades`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setGrades(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const toggleTerm = (termKey) => {
    setExpandedTerms(prev => ({
      ...prev,
      [termKey]: !prev[termKey]
    }));
  };

  if (loading) return <div className="InnerContainer"><p>Loading grades...</p></div>;

  if (grades.length === 0) {
    return (
      <div className="InnerContainer">
        <div className="emptyState">
          <h3 className="emptyStateTitle">No Grades Yet</h3>
          <p className="emptyStateText">Your grades will appear here once posted.</p>
        </div>
      </div>
    );
  }

  // Group grades by Year Level and Semester
  const groupedGrades = grades.reduce((acc, grade) => {
    const semLabel = grade.semester_label || `Semester ${grade.semester_id}`;
    const groupKey = `Year ${grade.year_level} - ${semLabel}`;
    
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(grade);
    return acc;
  }, {});

  // Sort the groups
  const sortedGroupKeys = Object.keys(groupedGrades).sort((a, b) => {
    const yearA = parseInt(a.match(/Year (\d+)/)[1], 10);
    const yearB = parseInt(b.match(/Year (\d+)/)[1], 10);
    if (yearA !== yearB) return yearA - yearB;
    return a.localeCompare(b);
  });
  return (
    <div className="InnerContainer" style={{ justifyContent: 'flex-start', overflowY: 'auto' }}>
      <div className="GradesAccordion">
        {sortedGroupKeys.map((groupKey) => {
          // THIS IS THE FIX: Default to closed unless explicitly toggled open
          const isExpanded = expandedTerms[groupKey] === true; 

          return (
            <div key={groupKey} className="GradesGroup">
              {/* Accordion Header */}
              <button 
                className="GradesGroupHeader"
                onClick={() => toggleTerm(groupKey)}
              >
                <span>{groupKey}</span>
                {isExpanded ? <BiChevronUp size={20} /> : <BiChevronDown size={20} />}
              </button>

              {/* Table Content */}
              {isExpanded && (
                <div className="GradesTableWrapper">
                  <table className="GradesTable">
                    <thead>
                      <tr>
                        <th>CODE</th>
                        <th>COURSE</th>
                        <th className="centered">PRELIM</th>
                        <th className="centered">MIDTERM</th>
                        <th className="centered">FINAL</th>
                        <th className="centered">FINAL GRADE</th>
                        <th className="centered">REMARKS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedGrades[groupKey].map(g => {
                        const prelim = g.components.find(c => 
                          c.term === 'Prelim' && (c.component_name === 'Prelim Exam' || c.component_name === 'Unit Practical Exam')
                        );
                        const midterm = g.components.find(c => 
                          c.term === 'Midterm' && (c.component_name === 'Midterm Exam' || c.component_name === 'Unit Practical Exam')
                        );
                        const final = g.components.find(c => 
                          c.term === 'Final' && (c.component_name === 'Final Exam' || c.component_name === 'Unit Practical Exam')
                        );

                        return (
                          <tr key={g.grade_id}>
                            <td style={{ fontWeight: 500 }}>{g.course_code}</td>
                            <td>{g.course_name}</td>
                            <td className="centered">{prelim?.score ?? '—'}</td>
                            <td className="centered">{midterm?.score ?? '—'}</td>
                            <td className="centered">{final?.score ?? '—'}</td>
                            <td className="centered">
                              <span className="GradesFinalGrade">{g.final_grade ?? '—'}</span>
                            </td>
                            <td className="centered">
                              <span className={g.remarks === 'P' ? 'statusBadge active-bg' : 'statusBadge inactive-bg'}>
                                {g.remarks === 'P' ? 'Passed' : g.remarks}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SGrades;