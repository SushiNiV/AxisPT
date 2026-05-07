import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BiSearch, BiX, BiChevronRight } from 'react-icons/bi'; // BiExport removed
import StudentForm from '../../Components/StudentForm'; 
import './AStudentForm.css';

function AStudentForms() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchMasterlist();
  }, []);

  const fetchMasterlist = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/masterlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.students.filter(s => s.status === 'Enrolled' || s.status === 'Accepted'));
      }
    } catch (error) {
      console.error("Error loading list:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id, e) => {
    const isChecked = e.target.checked;

    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );

    if (isChecked) {
      navigate(`/admin/documents/student-form/${id}`);
    }
  };

  const handleBatchDownload = () => {
    alert(`Preparing ZIP for ${selectedIds.length} students...`);
    console.log("Downloading forms for IDs:", selectedIds);
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="a-student-forms-layout">
      <div className="forms-sidebar">
          <div className="sidebar-search-wrapper">
            <BiSearch className="search-icon-small" />
            <input 
              type="text" 
              placeholder="Search student..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && <BiX onClick={() => setSearchTerm("")} style={{cursor: 'pointer'}} />}
          </div>

          <div className="sidebar-list">
            {loading ? (
              <div className="loading-state">Loading students...</div>
            ) : (
              filteredStudents.map((student) => (
                <div 
                  key={student.id} 
                  className={`sidebar-item ${studentId === student.id ? 'active' : ''}`}
                  /* Removed navigate from here */
                  style={{ cursor: 'default' }} 
                >
                  <div className="sidebar-item-left">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(student.id)}
                      onChange={(e) => toggleSelect(student.id, e)} 
                      className="student-checkbox"
                      style={{ cursor: 'pointer' }} /* Only the box shows the pointer */
                    />
                    <div className="item-info">
                      <span className="item-name">{student.name}</span>
                      <span className="item-id">{student.id}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
      </div>

      <div className="forms-preview-area">
        {studentId ? (
          <div className="preview-container">
            <div className="preview-header">
               <h3>Student Record Preview</h3>
               <div className="preview-actions">
                  <button onClick={() => window.print()} className="action-btn">Download PDF</button>
               </div>
            </div>
            <div className="document-frame">
               <StudentForm adminMode={true} />
            </div>
          </div>
        ) : (
          <div className="empty-preview">
            <div className="empty-icon">📄</div>
            <p>Select a student from the list to preview their Student Form</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AStudentForms;