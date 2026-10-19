import React, { useEffect, useState } from 'react';
import '../../GlobalStyle/Global.css';

function SSubjects() {
  const [data, setData] = useState({ enrolled: [], education: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/student/subjects`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="DocListMessage">Loading…</div>;

  return (
    <div className="InnerContainer">
      {data.enrolled.length === 0 ? (
        <div className="emptyState">
          <h3 className="emptyStateTitle">No Enrolled Subjects</h3>
          <p className="emptyStateText">You have no active enrollment for this term.</p>
        </div>
      ) : (
        <div className="TableContainer">
          <table className="Table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course</th>
                <th>Units</th>
                <th>Section</th>
                <th>Faculty</th>
              </tr>
            </thead>
            <tbody>
              {data.enrolled.map(c => (
                <tr key={c.curriculum_course_id}>
                  <td>{c.course_code}</td>
                  <td>{c.course_name}</td>
                  <td>{(c.lec_units || 0) + (c.lab_units || 0)}</td>
                  <td>{c.section_name || '—'}</td>
                  <td>
                    {c.faculty_first_name
                      ? `${c.faculty_first_name} ${c.faculty_last_name}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SSubjects;