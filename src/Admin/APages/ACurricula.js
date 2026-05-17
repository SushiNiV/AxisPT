import React, { useState, useEffect, useCallback } from 'react';
import './ACurricula.css';
import { BiSearch, BiPlusCircle, BiX, BiTrash } from 'react-icons/bi';
import AddCurriculum from '../AComponents/AddCurriculum';

function ACurricula() {
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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

  return (
    <div className="curriculaContainer">
      {showAdd && (
        <AddCurriculum
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); fetchCurricula(); }}
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
              <th>Program</th>
              <th>Year</th>
              <th>Version</th>
              <th>Courses</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="curriculaEmpty">Loading...</td></tr>
            ) : paginated.length > 0 ? (
              paginated.map(c => (
                <tr key={c.id}>
                  <td>{c.program} - {c.program_name}</td>
                  <td>{c.curriculum_year}</td>
                  <td>{c.version_name}</td>
                  <td>{c.course_count}</td>
                  <td>
                    <span className={`curriculaStatusBadge ${c.is_active ? 'curriculaActive' : 'curriculaInactive'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(c.id)} className="curriculaDeleteBtn" disabled={c.is_active}>
                      <BiTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="curriculaEmpty">No curricula found.</td></tr>
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
    </div>
  );
}

export default ACurricula;