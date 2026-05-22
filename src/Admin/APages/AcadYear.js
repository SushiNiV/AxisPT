import React, { useState, useEffect, useCallback } from 'react';
import './AcadYear.css';
import AddYear from './../AComponents/AddYear';
import { BiSearch, BiFilterAlt, BiPlusCircle, BiCalendar, BiTimeFive } from 'react-icons/bi';

function AAcadYear() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchSection, setSearchSection] = useState("");
  const [showAddProgram, setShowAddProgram] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = sessionStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    try {
      const sectRes = await fetch(`${process.env.REACT_APP_API_URL}/admin/academic-years`, { headers });
      if (sectRes.ok) {
        const sectData = await sectRes.json();
        if (sectData.success) setSections(sectData.data);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSuccess = () => {
    setShowAddProgram(false);
    fetchData();
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  return (
    <div className="aacadyearContainer">
      {showAddProgram && (
        <AddYear
          onClose={() => setShowAddProgram(false)} 
          onSuccess={handleAddSuccess}
        />
      )}

      <div className="searchBarSection">
        <div className="searchWrapper">
          <BiSearch className="searchIcon" />
          <input 
            type="text" 
            placeholder="Search academic year..." 
            className="studentSearchInput"
            value={searchSection}
            onChange={(e) => setSearchSection(e.target.value)}
          />
        </div>
        
        <div className="filterContainer">
          <button className="filterToggleBtn">
            <BiFilterAlt className="linkIcon" />
            Filter
          </button>
        </div>

        <div className="createBtnContainer">
          <button className="createBtn" onClick={() => setShowAddProgram(true)}>
            <BiPlusCircle className="linkIcon" />
            New Year
          </button>
        </div>
      </div>

      <div className="timelineContainer">
        {sections
          .filter(y => y.year_label?.includes(searchSection))
          .map((item) => (
            <div className="activityCard" key={item.id}>
              <div className="cardIconWrapper">
                <input 
                  type="checkbox" 
                />
              </div>
              <div className="cardIconWrapper">
                <div className={`iconCircle ${item.is_active ? 'active' : 'inactive'}`}>
                  <BiCalendar />
                </div>
              </div>

              <div className="cardContent">
                <div className="cardHeader">
                  <span className={`statusBadge ${item.is_active ? 'active-bg' : 'archived-bg'}`}>
                    {item.is_active ? 'Current Term' : 'Archived'}
                  </span>
                  <span className="cardTimestamp">
                    <BiTimeFive style={{marginRight: '4px'}}/>
                    {formatTimestamp(item.created_at)}
                  </span>
                </div>
                <h3 className="cardTitle">Academic Year {item.year_label}</h3>
              </div>
            </div>
          ))}
      </div>

      <div className="paginationContainer">
        <div className="paginationControls">
          <button className="pageBtn first">«</button>
          <button className="pageBtn prev">‹</button>
          <div className="currentPageInputWrapper">
            <input type="number" defaultValue="1" className="currentPageInput" />
          </div>
          <div className="paginationInfo">
            <div>out of <span>1</span></div>
          </div>
          <button className="pageBtn next">›</button>
          <button className="pageBtn last">»</button>
        </div>
      </div>
    </div>
  );
}

export default AAcadYear;