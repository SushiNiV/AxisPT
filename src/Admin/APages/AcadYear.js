import React, { useState, useEffect, useCallback } from 'react';
import AddYear from './../AComponents/AddModals/AddYear';
import ConfirmationModal from '../AComponents/ConfirmationModal';
import { BiSearch, BiPlusCircle, BiCalendar, BiX, BiPencil, BiTrash } from 'react-icons/bi';

import '../../Global.css';
import '../../GlobalCard.css';
import '../../GlobalEmpty.css';

function AAcadYear() {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingYear, setEditingYear] = useState(null);

  const [confirmState, setConfirmState] = useState({ isOpen: false });

  const closeConfirm = () => setConfirmState({ isOpen: false });

  const openConfirm = (config) => {
    setConfirmState({
      isOpen: true,
      variant: 'info',
      confirmLabel: 'CONFIRM',
      cancelLabel: 'CANCEL',
      isAlert: false,
      loading: false,
      ...config,
    });
  };

  const openAlert = (title, message, variant = 'info') => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      variant,
      isAlert: true,
      onConfirm: closeConfirm,
      onCancel: closeConfirm,
    });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = sessionStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/academic-years`, { headers });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAcademicYears(data.data);
        }
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
    setShowAdd(false);
    setEditingYear(null);
    fetchData();
  };

  const handleEdit = (year) => {
    setEditingYear(year);
    setShowAdd(true);
  };

  const handleDelete = (year) => {
    openConfirm({
      title: 'Delete Academic Year',
      summary: (
        <>Delete Academic Year <strong>{year.year_label}</strong>?</>
      ),
      message: (
        <>
          This action cannot be undone. If the academic year is currently active,
          it must be deactivated first.
        </>
      ),
      variant: 'danger',
      confirmLabel: 'DELETE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token');
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/academic-years/${year.year_id}`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          const data = await response.json();
          setConfirmState({ isOpen: false });
          if (data.success) {
            fetchData();
          } else {
            openAlert('Delete Failed', data.message || 'Failed to delete academic year.', 'danger');
          }
        } catch (error) {
          console.error("Error deleting academic year:", error);
          setConfirmState({ isOpen: false });
          openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      },
      onCancel: closeConfirm,
    });
  };

  const handleSetActive = (year) => {
    openConfirm({
      title: 'Activate Academic Year',
      summary: (
        <>Set Academic Year <strong>{year.year_label}</strong> as active?</>
      ),
      message: (
        <>
          The currently active academic year will be deactivated. All new
          enrollments and grade entries will default to this year.
        </>
      ),
      variant: 'warning',
      confirmLabel: 'ACTIVATE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token');
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/academic-years/${year.year_id}/activate`,
            {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          const data = await response.json();
          setConfirmState({ isOpen: false });
          if (data.success) {
            fetchData();
          } else {
            openAlert('Activation Failed', data.message || 'Failed to activate academic year.', 'danger');
          }
        } catch (error) {
          console.error("Error activating academic year:", error);
          setConfirmState({ isOpen: false });
          openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      },
      onCancel: closeConfirm,
    });
  };

  const handleSetSemester = (year, semesterId, semesterName) => {
    openConfirm({
      title: 'Set Current Semester',
      summary: (
        <>Set <strong>{semesterName}</strong> as the current term for AY {year.year_label}?</>
      ),
      message: (
        <>
          All new enrollments and grade entries will default to this semester.
        </>
      ),
      variant: 'info',
      confirmLabel: 'SET',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token');
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/academic-years/${year.year_id}/semester`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ current_sem: semesterId })
            }
          );
          const data = await response.json();
          setConfirmState({ isOpen: false });
          if (data.success) {
            fetchData();
          } else {
            openAlert('Update Failed', data.message || 'Failed to set semester.', 'danger');
          }
        } catch (error) {
          console.error("Error setting semester:", error);
          setConfirmState({ isOpen: false });
          openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      },
      onCancel: closeConfirm,
    });
  };

  const getAcademicYearStatus = (yearLabel, isActive) => {
    if (isActive) return 'current';

    const currentYear = new Date().getFullYear();
    const startYear = parseInt(yearLabel.split('-')[0]);

    if (startYear > currentYear) {
      return 'future';
    } else {
      return 'past';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'current': return 'Active';
      case 'future': return 'Inactive';
      case 'past': return 'Inactive';
      default: return '';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'current': return 'active-bg';
      case 'future': return 'inactive-bg';
      case 'past': return 'inactive-bg';
      default: return '';
    }
  };

  const getTermStatusLabel = (status) => {
    switch (status) {
      case 'current': return 'Current Term';
      case 'future': return 'Future Term';
      case 'past': return 'Past Term';
      default: return '';
    }
  };

  const filteredYears = academicYears.filter(year =>
    year.year_label?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasSearchResults = searchTerm && filteredYears.length === 0 && academicYears.length > 0;

  const semesters = [
    { id: 1, name: '1st Semester' },
    { id: 2, name: '2nd Semester' },
    { id: 3, name: 'Summer Term' }
  ];

  return (
    <div className="InnerContainer">
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        summary={confirmState.summary}
        message={confirmState.message}
        variant={confirmState.variant}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        isAlert={confirmState.isAlert}
        loading={confirmState.loading}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />

      {showAdd && (
        <AddYear
          onClose={() => {
            setShowAdd(false);
            setEditingYear(null);
          }}
          onSuccess={handleAddSuccess}
          yearToEdit={editingYear}
        />
      )}

      <div className="TopSection">
        <div className="SearchWrapper">
          <BiSearch className="SearchIcon" />
          <input
            type="text"
            placeholder="Search academic year..."
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
            <BiPlusCircle className="linkIcon" /> Academic Year
          </button>
        </div>
      </div>

      <div className="CardsContainer">
        {loading ? (
          <div className="emptyState">
            <div className="emptyStateIcon">⏳</div>
            <h3 className="emptyStateTitle">Loading Academic Years</h3>
            <p className="emptyStateText">Please wait while we fetch the data...</p>
          </div>
        ) : filteredYears.length > 0 ? (
          filteredYears.map((year) => {
            const status = getAcademicYearStatus(year.year_label, year.is_active);
            const statusLabel = getStatusLabel(status);
            const statusClass = getStatusClass(status);
            const termStatusLabel = getTermStatusLabel(status);

            return (
              <div className="Card" key={year.year_id}>
                <div className="CardMain">
                  <div className={`cardIcon ${status === 'current' ? 'active' : 'inactive'}`}>
                    <BiCalendar />
                  </div>
                  <div className="cardContent">
                    <div className="cardHeader">
                      <span className={`statusBadge ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <h3 className="cardTitle">Academic Year {year.year_label}</h3>
                    <div className="CardDetails">
                      <span className={`detailBadge ${status === 'current' ? 'current-bg' : status === 'future' ? 'future-bg' : 'past-bg'}`}>
                        {termStatusLabel}
                      </span>
                      {status === 'current' && semesters.map((sem) => (
                        <button
                          key={sem.id}
                          className={`detailBadge ${year.current_sem === sem.id ? 'active-semester' : 'inactive-semester'}`}
                          onClick={() => handleSetSemester(year, sem.id, sem.name)}
                        >
                          {sem.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="CardAction">
                    {status !== 'current' && status !== 'past' && (
                      <button className="actionBtn activateBtn" onClick={() => handleSetActive(year)}>
                        Set Active
                      </button>
                    )}
                    <button className="actionBtn editBtn" onClick={() => handleEdit(year)}>
                      <BiPencil /> Edit
                    </button>
                    <button className="actionBtn deleteBtn" onClick={() => handleDelete(year)}>
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
            <p className="emptyStateText">No academic years found matching "{searchTerm}"</p>
            <button className="emptyStateBtn" onClick={() => setSearchTerm("")}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyStateIcon">📅</div>
            <h3 className="emptyStateTitle">No Academic Years Yet</h3>
            <p className="emptyStateText">Get started by creating your first academic year.</p>
            <button className="emptyStateBtn" onClick={() => setShowAdd(true)}>
              <BiPlusCircle className="linkIcon"/> Create Year
            </button>
          </div>
        )}
      </div>

      <div className="BottomBuffer"></div>
    </div>
  );
}

export default AAcadYear;