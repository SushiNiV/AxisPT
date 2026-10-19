import React, { useEffect, useState } from 'react';
import '../../GlobalStyle/Global.css';

function SGrades() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/student/grades`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setGrades(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const componentFor = (grade, term) =>
    grade.components.find(c => c.term === term);

  if (loading) return <div className="DocListMessage">Loading…</div>;

  return (
    <div className="InnerContainer">
      {grades.length === 0 ? (
        <div className="emptyState">
          <h3 className="emptyStateTitle">No Grades Yet</h3>
          <p className="emptyStateText">Your grades will appear here once posted.</p>
        </div>
      ) : (
        <div className="TableContainer">
          <table className="Table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course</th>
                <th>Prelim</th>
                <th>Midterm</th>
                <th>Final</th>
                <th>Final Grade</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {grades.map(g => (
                <tr key={g.grade_id}>
                  <td>{g.course_code}</td>
                  <td>{g.course_name}</td>
                  <td>{componentFor(g, 'Prelim')?.score ?? '—'}</td>
                  <td>{componentFor(g, 'Midterm')?.score ?? '—'}</td>
                  <td>{componentFor(g, 'Final')?.score ?? '—'}</td>
                  <td><strong>{g.final_grade ?? '—'}</strong></td>
                  <td>{g.remarks ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SGrades;