import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { BiSearch, BiPrinter } from 'react-icons/bi';
import FilterComponent from '../../Components/FilterComponent';
import './ADocumentLayout.css';

function ADocumentLayout({ title, children, basePath }) {
  const { studentId } = useParams();
  const navigate = useNavigate();

  // State Management for the Sidebar
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const componentRef = useRef(null);

  const masterlistFilters = [
    { label: "Year Level", options: ["1ST YEAR", "2ND YEAR", "3RD YEAR", "4TH YEAR"] },
    { label: "Program", options: ["PHYSICAL THERAPY", "RESPIRATORY THERAPY", "RADIOLOGIC TECHNOLOGY"] }
  ];

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
        // Filtering for active/enrolled students only
        setStudents(data.students.filter(s => s.status === 'Enrolled' || s.status === 'Accepted'));
      }
    } catch (error) {
      console.error("Error loading list:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredStudents = students.filter((s) => {
    const studentYear = (s.year || "").toString().toUpperCase();
    const studentProg = (s.program || "").toUpperCase();
    const selectedYears = activeFilters["Year Level"] || [];
    const selectedProgs = activeFilters["Program"] || [];

    const matchesSearch = 
      (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.id || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesYear = !selectedYears.length || 
      selectedYears.some(f => f.toUpperCase().includes(studentYear) || studentYear.includes(f.split(' ')[0]));

    const matchesProgram = !selectedProgs.length || selectedProgs.includes(studentProg);

    return matchesSearch && matchesYear && matchesProgram;
  });

  // Selection Logic
  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allFilteredIds = filteredStudents.map(s => s.id);
      setSelectedIds(allFilteredIds);
    } else {
      setSelectedIds([]);
    }
  };

  // Print Logic
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${title}_${studentId || 'Batch'}`,
  });

  return (
    <div className="a-student-forms-layout">
      {/* SIDEBAR */}
      <div className="forms-sidebar">
        <div className="sidebar-content-card">
          <div className="sidebar-search-wrapper">
            <BiSearch className="search-icon-small" />
            <input 
              type="text" 
              placeholder="Search student..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="sidebar-controls-row">
            <label className="select-all-label">
              <input 
                type="checkbox"
                onChange={handleSelectAll}
                checked={filteredStudents.length > 0 && selectedIds.length === filteredStudents.length}
              />
              <span className="item-name">Select All</span>
            </label>
            <FilterComponent filters={masterlistFilters} onApply={setActiveFilters} />
          </div>

          <div className="sidebar-list">
            {loading ? (
              <div className="loading-state">Loading...</div>
            ) : (
              filteredStudents.map((student) => (
                <div 
                  key={student.id} 
                  className={`sidebar-item ${studentId === student.id ? 'active' : ''}`}
                  onClick={() => navigate(`${basePath}/${student.id}`)}
                >
                  <div className="sidebar-item-left">
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(student.id)}
                      onChange={(e) => toggleSelect(student.id, e)}
                      onClick={(e) => e.stopPropagation()} 
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
      </div>

      {/* PREVIEW AREA */}
      <div className="forms-preview-area">
        <div className="preview-header">
          <h3>{title} Preview</h3>
          <button 
            onClick={handlePrint} 
            className="action-btn"
            disabled={!studentId && selectedIds.length === 0}
          >
            <BiPrinter className="download-icon" />
            <span>Print {selectedIds.length > 1 ? `Batch (${selectedIds.length})` : ''}</span>
          </button>
        </div>

        <div className="preview-container">
          {studentId || selectedIds.length > 0 ? (
            <div className="document-frame" ref={componentRef}>
              {/* This is where StudentForm, CourseOutline, or TermGrade will render */}
              {selectedIds.length > 1 ? (
                selectedIds.map(id => (
                  <div key={id} className="page-break">
                    {React.cloneElement(children, { studentId: id })}
                  </div>
                ))
              ) : (
                React.cloneElement(children, { studentId: studentId })
              )}
            </div>
          ) : (
            <div className="empty-preview">
              <p>Select a student to preview the {title}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ADocumentLayout;