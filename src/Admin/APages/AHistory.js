import React, { useState, useEffect, useMemo } from 'react';
import { BiSearch, BiX, BiErrorCircle, BiHistory, BiChevronRight } from 'react-icons/bi';
import useMediaQuery from '../../Components/useMediaQuery';
import Filter from '../../Components/shared/Filter';
import Button from '../../Components/ui/Button';
import Badge from '../../Components/ui/Badge';
import Avatar from '../../Components/ui/Avatar';
import EmptyState from '../../Components/ui/Emptystate';
import Pagination from '../../Components/ui/Pagination';
import BottomSheet from '../../Components/ui/Bottomsheet';

const TH = 'sticky top-0 z-10 border-b !border-line bg-surface-2 px-3 py-3 text-xs font-semibold text-ink-2';

const getActionTone = (action) => {
  if (!action) return 'neutral';
  const a = action.toUpperCase();
  if (a.includes('ARCHIVE') || a.includes('DELETED')) return 'danger';
  if (a.includes('RESTORE') || a.includes('CREATED')) return 'ok';
  if (a.includes('UPDATED') || a.includes('CHANGED')) return 'warn';
  return 'neutral';
};

function AHistory() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = isMobile ? 15 : 50; 
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [tempDesignation, setTempDesignation] = useState("");
  const [tempAction, setTempAction] = useState("");
  
  const [designationOptions, setDesignationOptions] = useState([]);
  const [actionOptions, setActionOptions] = useState([]);
  const [sheetLog, setSheetLog] = useState(null);

  const hasActiveFilters = selectedDesignation !== "" || selectedAction !== "";

  useEffect(() => {
    if (isFilterOpen) {
      setTempDesignation(selectedDesignation);
      setTempAction(selectedAction);
    }
  }, [isFilterOpen, selectedDesignation, selectedAction]);

  useEffect(() => { setCurrentPage(1); }, [isMobile, searchTerm]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true); setError(null);
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/history`, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success && data.history) {
          const mappedData = data.history.map(item => ({
            id: item.log_id,
            userId: item.username,
            designation: item.designation || item.user_role,
            action: item.action,
            targetId: item.target_username || item.username,
            details: item.details,
            timestamp: item.timestamp
          }));
          
          setHistoryData(mappedData);
          
          const uniqueDesignations = [...new Set(mappedData.map(item => item.designation).filter(Boolean))];
          const uniqueActions = [...new Set(mappedData.map(item => item.action).filter(Boolean))];
          
          setDesignationOptions(uniqueDesignations.map(d => ({ value: d, label: d })));
          setActionOptions(uniqueActions.map(a => ({ value: a, label: a })));
        } else {
          setError(data.message || "Failed to fetch history data");
        }
      } catch (err) { setError("Failed to connect to the server"); } 
      finally { setLoading(false); }
    };
    fetchHistory();
  }, []);

  const filters = [
    { name: "designation", label: "Designation", value: tempDesignation, options: designationOptions, placeholder: "All designations" },
    { name: "action", label: "Action", value: tempAction, options: actionOptions, placeholder: "All actions" }
  ];

  const handleFilterChange = (name, value) => {
    if (name === "designation") setTempDesignation(value);
    else if (name === "action") setTempAction(value);
  };

  const resetFilters = () => {
    setTempDesignation(""); setTempAction("");
    setSelectedDesignation(""); setSelectedAction("");
    setIsFilterOpen(false); setCurrentPage(1);
  };

  const applyFilters = () => {
    setSelectedDesignation(tempDesignation); setSelectedAction(tempAction);
    setIsFilterOpen(false); setCurrentPage(1);
  };

  const filteredHistory = useMemo(() => {
    const searchStr = searchTerm.toLowerCase();
    return historyData.filter((item) => {
      const matchesSearch = 
        String(item.userId || '').toLowerCase().includes(searchStr) ||
        String(item.action || '').toLowerCase().includes(searchStr) ||
        String(item.details || '').toLowerCase().includes(searchStr);

      const matchesDesignation = !selectedDesignation || item.designation === selectedDesignation;
      const matchesAction = !selectedAction || item.action === selectedAction;

      return matchesSearch && matchesDesignation && matchesAction;
    });
  }, [historyData, searchTerm, selectedDesignation, selectedAction]);

  const totalPages = Math.ceil(filteredHistory.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);

  const clearSearch = () => { setSearchTerm(""); setCurrentPage(1); };

  // --- SKELETON LOADER ---
  if (loading) {
    return (
      <div className="ax flex h-full min-h-0 flex-col gap-3 pb-4">
        <div className="flex shrink-0 items-center gap-2">
          <div className="h-10 flex-1 animate-pulse rounded-ctl bg-surface-2" />
          <div className="h-10 w-24 shrink-0 animate-pulse rounded-ctl bg-surface-2" />
        </div>
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-panel border !border-line bg-surface">
          <div className="p-4 space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b !border-line pb-3 last:border-0">
                <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-surface-2" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 animate-pulse rounded bg-surface-2" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" />
                </div>
                <div className="h-6 w-24 animate-pulse rounded-full bg-surface-2" />
                <div className="h-4 w-1/4 animate-pulse rounded bg-surface-2" />
                <div className="h-4 w-20 animate-pulse rounded bg-surface-2" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) return <div className="ax flex h-full flex-col justify-center"><EmptyState icon={BiErrorCircle} title="Error Loading History" text={error} action={<Button onClick={() => window.location.reload()}>Try again</Button>} /></div>;

  return (
    <div className="ax flex h-full min-h-0 flex-col gap-3 pb-4 relative">
      
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <BiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-ink-3" />
          <input 
            type="text" 
            placeholder="Search history..." 
            className="h-10 w-full rounded-ctl border !border-line bg-surface pl-10 pr-10 text-base text-ink placeholder:text-ink-3 focus-visible:border-brand focus-visible:outline-none sm:text-sm"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          {searchTerm && (
            <button onClick={clearSearch} className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-lg text-ink-3 hover:bg-surface-2 hover:text-ink">
              <BiX />
            </button>
          )}
        </div>
        
        <Filter
          isOpen={isFilterOpen}
          setIsOpen={setIsFilterOpen}
          hasActiveFilters={hasActiveFilters}
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={resetFilters}
          onApply={applyFilters}
        />
      </div>

      {filteredHistory.length === 0 ? (
        <EmptyState 
          icon={BiHistory} 
          title={searchTerm || hasActiveFilters ? "No matching results" : "No History Records"} 
          text={searchTerm || hasActiveFilters ? "Try adjusting your search or filters." : "No activity has been recorded yet."} 
          action={(searchTerm || hasActiveFilters) ? <Button variant="secondary" onClick={() => { clearSearch(); resetFilters(); }}>Clear search and filters</Button> : null}
        />
      ) : (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-panel border !border-line bg-surface">
          
          {isMobile ? (
            /* MOBILE LIST */
            <ul className="flex-1 divide-y divide-line overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {currentItems.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-3 py-3">
                  <button onClick={() => setSheetLog(item)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <Avatar first={item.userId} last="" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 mb-1">
                        <Badge tone={getActionTone(item.action)}>{item.action}</Badge>
                      </span>
                      <span className="block truncate text-sm text-ink">{item.details}</span>
                      <span className="block truncate text-xs text-ink-3 mt-1">{item.timestamp}</span>
                    </span>
                    <BiChevronRight className="shrink-0 text-xl text-ink-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            /* DESKTOP TABLE */
            <div className="min-h-0 flex-1 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th scope="col" className={`${TH} w-16 pl-4`}>No.</th>
                    <th scope="col" className={TH}>User</th>
                    <th scope="col" className={TH}>Action</th>
                    <th scope="col" className={TH}>Target</th>
                    <th scope="col" className={`${TH} w-1/3`}>Details</th>
                    <th scope="col" className={TH}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, index) => (
                    <tr key={item.id} className="border-t !border-line transition-colors hover:bg-surface-2">
                      <td className="px-3 py-3 pl-4 text-ink-3 tabular-nums">{indexOfFirstItem + index + 1}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar first={item.userId} last="" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">{item.userId}</p>
                            <p className="truncate text-xs text-ink-2">{item.designation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={getActionTone(item.action)}>{item.action}</Badge>
                      </td>
                      <td className="px-3 py-3 text-ink-2">{item.targetId || "—"}</td>
                      <td className="px-3 py-3 text-ink-2 truncate max-w-[300px]" title={item.details}>{item.details}</td>
                      <td className="px-3 py-3 text-ink-3 text-xs tabular-nums whitespace-nowrap">{item.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination page={currentPage} pageCount={totalPages} total={filteredHistory.length} pageSize={rowsPerPage} onPageChange={setCurrentPage} />
        </section>
      )}

      {/* Mobile BottomSheet */}
      <BottomSheet open={!!sheetLog} onClose={() => setSheetLog(null)} title="Log Details">
        {sheetLog && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar size="lg" first={sheetLog.userId} last="" />
              <div>
                <p className="text-lg font-semibold text-ink">{sheetLog.userId}</p>
                <p className="text-sm text-ink-2">{sheetLog.designation}</p>
              </div>
            </div>

            <dl className="grid grid-cols-[auto_1fr] items-start gap-x-6 gap-y-3 text-sm">
              <dt className="text-ink-2 mt-1">Action</dt>
              <dd className="flex justify-end mt-1"><Badge tone={getActionTone(sheetLog.action)}>{sheetLog.action}</Badge></dd>
              
              <dt className="text-ink-2">Target</dt>
              <dd className="text-right font-medium text-ink">{sheetLog.targetId || '—'}</dd>
              
              <dt className="text-ink-2">Timestamp</dt>
              <dd className="text-right font-medium text-ink tabular-nums">{sheetLog.timestamp}</dd>
              
              <dt className="text-ink-2">Details</dt>
              <dd className="text-right text-ink">{sheetLog.details}</dd>
            </dl>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

export default AHistory;