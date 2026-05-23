import React, { useState, useEffect, useCallback } from 'react';
import './Curricula.css';
import { BiSearch, BiPlusCircle, BiX, BiBook, BiPencil, BiTrash } from 'react-icons/bi';

import '../../Global.css';
import '../../GlobalCard.css';
import '../../GlobalEmpty.css';
import AddCurriculum from '../AComponents/AddCurriculum';

function ACurricula() {
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState(null);

  const fetchCurricula = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/curricula`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setCurricula(data.data);
    } catch (err) {
      console.error("Error fetching curricula:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCurricula(); }, [fetchCurricula]);

  const handleAddSuccess = () => {
    setShowAdd(false);
    setEditingCurriculum(null);
    fetchCurricula();
  };

  const handleEdit = (curriculum) => {
    setEditingCurriculum(curriculum);
    setShowAdd(true);
  };

  const handleDelete = async (curriculumId, curriculumName) => {
    if (window.confirm(`Are you sure you want to delete ${curriculumName}?`)) {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/curricula/${curriculumId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          fetchCurricula();
        } else {
          alert(data.message || "Failed to delete curriculum.");
        }
      } catch (error) {
        console.error("Error deleting curriculum:", error);
        alert("An error occurred.");
      }
    }
  };

  const getCurriculumStatus = (isActive) => {
    if (isActive) return 'current';
    return 'inactive';
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'current': return 'Active';
      case 'inactive': return 'Inactive';
      default: return '';
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'current': return 'active-bg';
      case 'inactive': return 'inactive-bg';
      default: return '';
    }
  };

  const filteredCurricula = curricula.filter(c =>
    c.program_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.start_year?.toString().includes(searchTerm.toLowerCase()) ||
    c.version_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasSearchResults = searchTerm && filteredCurricula.length === 0 && curricula.length > 0;

  return (
    <div className="InnerContainer">
      {showAdd && (
        <AddCurriculum
          onClose={() => {
            setShowAdd(false);
            setEditingCurriculum(null);
          }}
          onSuccess={handleAddSuccess}
          curriculumToEdit={editingCurriculum}
        />
      )}

      <div className="TopSection">
        <div className="SearchWrapper">
          <BiSearch className="SearchIcon" />
          <input
            type="text"
            placeholder="Search curriculum..."
            className="SearchInput"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); }}
          />
          {searchTerm && (
            <BiX className="ClearSearchIcon" onClick={() => { setSearchTerm(""); }} />
          )}
        </div>

        <div className="TopbarBtnContainer">
          <button className="TopbarBtn" onClick={() => setShowAdd(true)}>
            <BiPlusCircle className="linkIcon" /> Curriculum
          </button>
        </div>
      </div>

      <div className="CardsContainer">
        {loading ? (
          <div className="emptyState">
            <div className="emptyStateIcon">⏳</div>
            <h3 className="emptyStateTitle">Loading Curricula</h3>
            <p className="emptyStateText">Please wait while we fetch the data...</p>
          </div>
        ) : filteredCurricula.length > 0 ? (
          filteredCurricula.map((curriculum) => {
            const status = getCurriculumStatus(curriculum.is_active);
            const statusLabel = getStatusLabel(status);
            const statusClass = getStatusClass(status);
            const academicYear = `${curriculum.start_year} - ${curriculum.start_year + 1}`;
            
            return (
              <div className="Card" key={curriculum.curriculum_id}>
                <div className="CardMain">
                  <div className={`cardIcon ${status === 'current' ? 'active' : 'inactive'}`}>
                    <BiBook />
                  </div>
                  <div className="cardContent">
                    <div className="cardHeader">
                      <span className={`statusBadge ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <h3 className="cardTitle">{curriculum.program_name}</h3>
                    <div className="CardDetails">
                      <span className="detailBadge">From: {curriculum.start_year}</span>
                      <span className="detailBadge">Version: {curriculum.version_name}</span>
                      <span className="detailBadge">Courses: {curriculum.course_count || 0}</span>
                    </div>
                  </div>
                  <div className="CardAction">
                    <button className="actionBtn editBtn" onClick={() => handleEdit(curriculum)}>
                      <BiPencil /> Edit
                    </button>
                    <button className="actionBtn deleteBtn" onClick={() => handleDelete(curriculum.curriculum_id, curriculum.program_name)}>
                      <BiTrash /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : hasSearchResults ? (
          <div className="emptyState">
            <div className="emptyStateIcon">🔍</div>
            <h3 className="emptyStateTitle">No matching results</h3>
            <p className="emptyStateText">No curricula found matching "{searchTerm}"</p>
            <button className="emptyStateBtn" onClick={() => setSearchTerm("")}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyStateIcon">📚</div>
            <h3 className="emptyStateTitle">No Curricula Yet</h3>
            <p className="emptyStateText">Get started by creating your first curriculum.</p>
            <button className="emptyStateBtn" onClick={() => setShowAdd(true)}>
              <BiPlusCircle className="linkIcon"/> Create Curriculum
            </button>
          </div>
        )}
      </div>

      <div className="BottomBuffer"></div>
    </div>
  );
}

export default ACurricula;