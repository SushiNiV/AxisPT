import React, { useState, useEffect, useCallback } from 'react';
import './ACurricula.css';
import { BiSearch, BiPlusCircle, BiX, BiTrash, BiEdit } from 'react-icons/bi';
import AddCurriculum from '../AComponents/AddCurriculum';
import EditCurriculum from '../AComponents/AEditCurriculum';
import SelectionPanel from '../../Components/SelectionPanel';

function ACurricula() {
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editCurriculumId, setEditCurriculumId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const rowsPerPage = 10;

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

  const filtered = curricula.filter(c =>
    c.program?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.curriculum_year?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginated.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Delete single
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this curriculum?")) return;
    try {
      const token = sessionStorage.getItem('token');
      await fetch(`${process.env.REACT_APP_API_URL}/admin/curriculum/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCurricula();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} curricula?`)) return;
    
    for (const id of selectedIds) {
      try {
        const token = sessionStorage.getItem('token');
        await fetch(`${process.env.REACT_APP_API_URL}/admin/curriculum/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
    setSelectedIds([]);
    fetchCurricula();
  };

  // Edit handler
  const handleEdit = (id) => {
    setEditCurriculumId(id);
    setShowEditModal(true);
  };

  return (
    <div className="curriculaContainer">
      {showAdd && (
        <AddCurriculum
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); fetchCurricula(); }}
        />
      )}

      {showEditModal && editCurriculumId && (
        <EditCurriculum
          curriculumId={editCurriculumId}
          onClose={() => { setShowEditModal(false); setEditCurriculumId(null); }}
          onSuccess={() => { setShowEditModal(false); setEditCurriculumId(null); fetchCurricula(); }}
        />
      )}

      <div className="curriculaSearchBar">
        <div className="curriculaSearchWrapper">
          <BiSearch className="curriculaSearchIcon" />
          <input type="text" placeholder="Search program or year..." className="curriculaSearchInput"
            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          {searchTerm && <BiX className="curriculaClearIcon" onClick={() => { setSearchTerm(""); setCurrentPage(1); }} />}
        </div>
        <div className="curriculaCreateBtnContainer">
          <button className="curriculaCreateBtn" onClick={() => setShowAdd(true)}>
            <BiPlusCircle className="curriculaBtnIcon" /> Curriculum
          </button>
        </div>
      </div>

      <div className="curriculaTableContainer">
        <table className="curriculaTable">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input type="checkbox" onChange={handleSelectAll}
                  checked={paginated.length > 0 && selectedIds.length === paginated.length} />
              </th>
              <th>Program</th>
              <th>Year</th>
              <th>Version</th>
              <th>Courses</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="curriculaEmpty">Loading...</td></tr>
            ) : paginated.length > 0 ? (
              paginated.map(c => (
                <tr key={c.id} className={selectedIds.includes(c.id) ? 'selected-row' : ''}>
                  <td>
                    <input type="checkbox" checked={selectedIds.includes(c.id)}
                      onChange={() => handleSelectRow(c.id)} />
                  </td>
                  <td>{c.program} - {c.program_name}</td>
                  <td>{c.curriculum_year}</td>
                  <td>{c.version_name}</td>
                  <td>{c.course_count}</td>
                  <td>
                    <span className={`curriculaStatusBadge ${c.is_active ? 'curriculaActive' : 'curriculaInactive'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" className="curriculaEmpty">No curricula found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="curriculaPagination">
        <div className="curriculaPaginationControls">
          <button className="curriculaPageBtn first" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
          <button className="curriculaPageBtn prev" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>‹</button>
          <div className="curriculaPageInputWrapper">
            <input type="number" value={currentPage} onChange={(e) => {
              const val = Number(e.target.value);
              if (val >= 1 && val <= totalPages) setCurrentPage(val);
            }} className="curriculaPageInput" min="1" max={totalPages || 1} />
          </div>
          <div className="curriculaPaginationInfo">
            <div>out of <span>{totalPages || 1}</span></div>
          </div>
          <button className="curriculaPageBtn next" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>›</button>
          <button className="curriculaPageBtn last" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
        </div>
      </div>

      <SelectionPanel selectedCount={selectedIds.length} onClear={() => setSelectedIds([])}>
        <button 
          onClick={() => {
            if (selectedIds.length === 1) {
              handleEdit(selectedIds[0]);
            } else {
              alert("Please select only one curriculum to edit.");
            }
          }}
          disabled={selectedIds.length !== 1}
        >
          <BiEdit size={18} /> Edit
        </button>
        <button onClick={handleBulkDelete} className="deleteBtn">
          <BiTrash size={18} /> Delete Selected
        </button>
      </SelectionPanel>
    </div>
  );
}

export default ACurricula;