  import React, { useState, useEffect, useCallback } from 'react';
  import './Curricula.css';
  import { BiSearch, BiPlusCircle, BiX, BiTrash } from 'react-icons/bi';

  import '../../Global.css';
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

    const goToPrevPage = () => {
      if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const goToNextPage = () => {
      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const filtered = curricula.filter(c =>
      c.program?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.curriculum_year?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
    const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return (
      <div className="InnerContainer">
        {showAdd && (
          <AddCurriculum
            onClose={() => setShowAdd(false)}
            onSuccess={() => { setShowAdd(false); fetchCurricula(); }}
          />
        )}

        <div className="TopSection">
          <div className="SearchWrapper">
            <BiSearch className="SearchIcon" />
            <input
              type="text"
              placeholder="Search program or year..."
              className="SearchInput"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
            {searchTerm &&
              <BiX className="ClearSearchIcon"
              onClick={() => { setSearchTerm(""); setCurrentPage(1); }}/>
            }
          </div>

          <div className="TopbarBtnContainer">
            <button className="TopbarBtn" onClick={() => setShowAdd(true)}>
              <BiPlusCircle className="linkIcon" /> Curriculum
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="curriculaEmpty">Loading...</td></tr>
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
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="curriculaEmpty">No curricula found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="PaginationContainer">
          <div className="PaginationControls">
            <button className="PageBtn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
            <button className="PageBtn" onClick={goToPrevPage} disabled={currentPage === 1}>‹</button>
            <div className="CurrentPageInputWrapper">
              <input 
                type="number" 
                value={currentPage} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val > 0 && val <= totalPages) setCurrentPage(val);
                }} 
                className="CurrentPageInput" 
              />
            </div>
            <div className="PaginationInfo">
              out of <span>{totalPages}</span>
            </div>
            <button className="PageBtn" onClick={goToNextPage} disabled={currentPage === totalPages}>›</button>
            <button className="PageBtn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
          </div>
        </div>
      </div>
    );
  }

  export default ACurricula;