import React, { useState, useEffect, useCallback } from 'react';
import { BiSearch, BiPlus, BiX, BiBookOpen, BiPencil } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../../Components/shared/ConfirmationModal';
import useMediaQuery from '../../../Components/useMediaQuery';
import AddCurriculum from '../../AComponents/AddModals/AddCurriculum';
import Button from '../../../Components/ui/Button';
import Badge from '../../../Components/ui/Badge';
import EmptyState from '../../../Components/ui/Emptystate';
import Pagination from '../../../Components/ui/Pagination';

function ACurricula() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const navigate = useNavigate();

  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = isMobile ? 10 : 15; 

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

  const fetchCurricula = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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

  useEffect(() => { setCurrentPage(1); }, [searchTerm, isMobile]);

  const handleAddSuccess = () => {
    setShowAdd(false);
    setEditingCurriculum(null);
    fetchCurricula();
  };

  const handleEdit = (curriculum) => {
    setEditingCurriculum(curriculum);
    setShowAdd(true);
  };

  const handleViewCourses = (curriculum) => {
    navigate(`/admin/academics/courses?curriculumId=${curriculum.curriculum_id}`);
  };

  const filteredCurricula = curricula.filter(c =>
    c.program_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.start_year?.toString().includes(searchTerm.toLowerCase()) ||
    c.version_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCurricula.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredCurricula.slice(indexOfFirstItem, indexOfLastItem);

  const hasSearchResults = searchTerm && filteredCurricula.length === 0 && curricula.length > 0;

  // --- SKELETON LOADER ---
  if (loading) {
    return (
      <div className="ax flex h-full min-h-0 flex-col gap-3 pb-4">
        <div className="flex shrink-0 items-center gap-2">
          <div className="h-10 flex-1 animate-pulse rounded-ctl bg-surface-2" />
          <div className="h-10 w-36 shrink-0 animate-pulse rounded-ctl bg-surface-2" />
        </div>
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-panel border !border-line bg-surface">
          <div className="p-4 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-4 border-b !border-line pb-4 last:border-0">
                <div className="flex flex-1 items-center gap-4">
                  <div className="hidden h-12 w-12 shrink-0 animate-pulse rounded-ctl bg-surface-2 sm:block" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-1/3 animate-pulse rounded bg-surface-2" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-surface-2" />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                  <div className="h-8 w-24 animate-pulse rounded-ctl bg-surface-2" />
                  <div className="h-8 w-16 animate-pulse rounded-ctl bg-surface-2" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="ax flex h-full min-h-0 flex-col gap-3 pb-4 relative">
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
        <AddCurriculum
          onClose={() => {
            setShowAdd(false);
            setEditingCurriculum(null);
          }}
          onSuccess={handleAddSuccess}
          curriculumToEdit={editingCurriculum}
        />
      )}

      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <BiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-ink-3" />
          <input
            type="text"
            placeholder="Search curriculum..."
            className="h-10 w-full rounded-ctl border !border-line bg-surface pl-10 pr-10 text-base text-ink placeholder:text-ink-3 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} aria-label="Clear search" className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-lg text-ink-3 hover:bg-surface-2 hover:text-ink">
              <BiX />
            </button>
          )}
        </div>

        <Button onClick={() => setShowAdd(true)} className="shrink-0 !px-3 sm:!px-4">
          <BiPlus className="text-xl" aria-hidden="true" />
          <span className="hidden sm:inline">Add Curriculum</span>
        </Button>
      </div>

      {filteredCurricula.length === 0 ? (
        <EmptyState 
          icon={BiBookOpen} 
          title={hasSearchResults ? "No matching results" : "No Curricula Yet"} 
          text={hasSearchResults ? `No curricula found matching "${searchTerm}"` : "Get started by creating your first curriculum."} 
          action={
            <Button variant={hasSearchResults ? "secondary" : "primary"} onClick={() => hasSearchResults ? setSearchTerm("") : setShowAdd(true)}>
              {hasSearchResults ? "Clear Search" : "Add Curriculum"}
            </Button>
          } 
        />
      ) : (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-panel border !border-line bg-surface">
          
          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul className="divide-y divide-line m-0 p-0 list-none">
              {currentItems.map((curriculum) => {
                const isActive = curriculum.is_active;
                
                return (
                  <li key={curriculum.curriculum_id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 transition-colors hover:bg-surface-2">
                    
                    {/* Left Side: Icon, Title, Plain Text Metadata */}
                    <div className="flex min-w-0 items-start gap-4">
                      <div className={`hidden h-12 w-12 shrink-0 place-items-center rounded-ctl sm:grid ${isActive ? 'bg-brand-soft text-brand-ink' : 'bg-surface-2 text-ink-3'}`}>
                        <BiBookOpen className="text-2xl" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-lg font-semibold text-ink truncate">
                            {curriculum.program_name}
                          </h3>
                          <Badge tone={isActive ? 'ok' : 'neutral'}>
                            {isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        <p className="mt-1 text-sm text-ink-3">
                          Effective {curriculum.start_year}
                          <span aria-hidden="true" className="mx-1.5">·</span>
                          {curriculum.version_name}
                          <span aria-hidden="true" className="mx-1.5">·</span>
                          {curriculum.course_count || 0} courses
                        </p>
                      </div>
                    </div>

                    {/* Right Side: Actions */}
                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                      <Button size="sm" variant="secondary" onClick={() => handleViewCourses(curriculum)}>
                        View Courses
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(curriculum)}>
                        <BiPencil className="text-base" aria-hidden="true" /> Edit
                      </Button>
                    </div>

                  </li>
                );
              })}
            </ul>
          </div>

          <Pagination page={currentPage} pageCount={totalPages} total={filteredCurricula.length} pageSize={rowsPerPage} onPageChange={setCurrentPage} />
        </section>
      )}
    </div>
  );
}

export default ACurricula;