import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BiSearch, BiPlus, BiX, BiPencil, BiTrash, BiErrorCircle, BiUser, BiChevronRight } from 'react-icons/bi';
import useMediaQuery from '../../../Components/useMediaQuery'; 
import Filter from '../../../Components/shared/Filter';
import ConfirmationModal from '../../../Components/shared/ConfirmationModal';
import AddFaculty from '../../AComponents/AddModals/AddFaculty';
import Button from '../../../Components/ui/Button';
import Badge from '../../../Components/ui/Badge';
import Avatar from '../../../Components/ui/Avatar';
import EmptyState from '../../../Components/ui/Emptystate';
import Pagination from '../../../Components/ui/Pagination';
import BottomSheet from '../../../Components/ui/Bottomsheet';
import Chip from '../../../Components/ui/Chip';

const TH = 'sticky top-0 z-10 border-b !border-line bg-surface-2 px-3 py-3 text-xs font-semibold text-ink-2';

function AManage() {
  const isMobile = useMediaQuery('(max-width: 768px)'); 
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const rowsPerPage = isMobile ? 10 : 50; 
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [tempRole, setTempRole] = useState("");
  const [tempDesignation, setTempDesignation] = useState("");
  
  const [sheetUser, setSheetUser] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [rolesList, setRolesList] = useState([]);

  useEffect(() => { setCurrentPage(1); }, [isMobile]);

  const closeConfirm = () => setConfirmState({ isOpen: false });
  const openConfirm = (config) => setConfirmState({ isOpen: true, variant: 'info', confirmLabel: 'CONFIRM', cancelLabel: 'CANCEL', isAlert: false, loading: false, ...config });
  const openAlert = (title, message, variant = 'info') => setConfirmState({ isOpen: true, title, message, variant, isAlert: true, onConfirm: closeConfirm, onCancel: closeConfirm });

  const formatRoleName = (roleId) => {
    if (!roleId) return '—';
    const role = rolesList.find(r => r.role_id === roleId);
    return role ? role.role_name : '—';
  };

  const hasActiveFilters = selectedRole !== "" || selectedDesignation !== "";

  useEffect(() => {
    if (isFilterOpen) {
      setTempRole(selectedRole);
      setTempDesignation(selectedDesignation);
    }
  }, [isFilterOpen, selectedRole, selectedDesignation]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/roles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setRolesList(data.data);
      } catch (err) {
        console.error("Error fetching roles:", err);
      }
    };
    fetchRoles();
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/faculties`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddSuccess = () => {
    setShowAddFaculty(false);
    setEditingFaculty(null);
    fetchUsers();
  };

  const handleEdit = (user) => {
    setEditingFaculty(user);
    setShowAddFaculty(true);
  };

  const handleArchive = (user) => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    openConfirm({
      title: 'Archive User',
      summary: <>Archive <strong>{user.username}</strong>{fullName ? ` (${fullName})` : ''}?</>,
      message: <span className="text-sm text-ink-2">The user account will be deactivated and hidden from the main list. Their data is preserved and can be restored from the Archive page.</span>,
      variant: 'danger',
      confirmLabel: 'ARCHIVE',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, loading: true }));
        try {
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
          const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/users/${user.user_id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          setConfirmState({ isOpen: false });
          if (data.success) {
            fetchUsers();
          } else {
            openAlert('Archive Failed', data.message || 'Failed to archive user.', 'danger');
          }
        } catch (error) {
          console.error("Error archiving user:", error);
          setConfirmState({ isOpen: false });
          openAlert('Error', 'An unexpected error occurred.', 'danger');
        }
      },
      onCancel: closeConfirm,
    });
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = !searchTerm ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = !selectedRole || user.role_id === parseInt(selectedRole);
      const matchesDesignation = !selectedDesignation || user.designation_name === selectedDesignation;

      return matchesSearch && matchesRole && matchesDesignation;
    });
  }, [users, searchTerm, selectedRole, selectedDesignation]);

  const baseFiltered = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = !searchTerm ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDesignation = !selectedDesignation || user.designation_name === selectedDesignation;
      return matchesSearch && matchesDesignation;
    });
  }, [users, searchTerm, selectedDesignation]);

  const roleCounts = useMemo(() => {
    return baseFiltered.reduce((acc, user) => {
      const rid = user.role_id;
      acc[rid] = (acc[rid] || 0) + 1;
      return acc;
    }, {});
  }, [baseFiltered]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };
  const clearSearch = () => { setSearchTerm(""); setCurrentPage(1); };
  
  const resetFilters = () => { setTempRole(""); setTempDesignation(""); setSelectedRole(""); setSelectedDesignation(""); setIsFilterOpen(false); setCurrentPage(1); };
  const applyFilters = () => { setSelectedRole(tempRole); setSelectedDesignation(tempDesignation); setIsFilterOpen(false); setCurrentPage(1); };

  const handleFilterChange = (name, value) => {
    if (name === 'role') setTempRole(value);
    else if (name === 'designation') setTempDesignation(value);
  };

  const uniqueDesignations = Array.from(new Set(users.map(u => u.designation_name).filter(Boolean)));
  const designationOptions = [{ value: "", label: "All designations" }, ...uniqueDesignations.map(d => ({ value: d, label: d }))];
  const filters = [{ name: "designation", label: "Designation", value: tempDesignation, options: designationOptions, placeholder: "All designations" }];

  const runFromSheet = (action) => {
    const user = sheetUser;
    setSheetUser(null);
    if (user) action(user);
  };

  // --- SKELETON LOADER ---
  if (loading) {
    return (
      <div className="ax flex h-full min-h-0 flex-col gap-3 pb-4">
        <div className="flex shrink-0 items-center gap-2">
          <div className="h-10 flex-1 animate-pulse rounded-ctl bg-surface-2" />
          <div className="h-10 w-24 shrink-0 animate-pulse rounded-ctl bg-surface-2" />
          <div className="h-10 w-24 shrink-0 animate-pulse rounded-ctl bg-surface-2" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-surface-2" />
          ))}
        </div>
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-panel border !border-line bg-surface">
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b !border-line pb-3 last:border-0">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface-2" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-surface-2" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-surface-2" />
                </div>
                <div className="h-6 w-20 animate-pulse rounded-full bg-surface-2" />
                <div className="h-8 w-32 animate-pulse rounded-ctl bg-surface-2" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) return <div className="ax flex h-full flex-col justify-center"><EmptyState icon={BiErrorCircle} title="Error Loading Users" text={error} action={<Button onClick={fetchUsers}>Try again</Button>} /></div>;

  return (
    <div className="ax flex h-full min-h-0 flex-col gap-3 pb-4 relative">
      <ConfirmationModal {...confirmState} onConfirm={confirmState.onConfirm} onCancel={confirmState.onCancel} />
      
      {showAddFaculty && (
        <AddFaculty
          onClose={() => { setShowAddFaculty(false); setEditingFaculty(null); }}
          onSuccess={handleAddSuccess}
          facultyToEdit={editingFaculty}
        />
      )}

      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <BiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-ink-3" />
          <input
            type="text"
            placeholder="Search users..."
            className="h-10 w-full rounded-ctl border !border-line bg-surface pl-10 pr-10 text-base text-ink placeholder:text-ink-3 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 sm:text-sm"
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <button onClick={clearSearch} aria-label="Clear search" className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-lg text-ink-3 hover:bg-surface-2 hover:text-ink">
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
        
        <Button onClick={() => setShowAddFaculty(true)} className="shrink-0 !px-3 sm:!px-4">
          <BiPlus className="text-xl" aria-hidden="true" />
          <span className="hidden sm:inline">User</span>
        </Button>
      </div>

      {/* Role Quick Filters (Pills) */}
      <div className="flex shrink-0 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip 
          selected={!selectedRole} 
          count={baseFiltered.length} 
          onClick={() => { setSelectedRole(''); setCurrentPage(1); }}
        >
          All
        </Chip>
        {rolesList.map((role) => (
          <Chip
            key={role.role_id}
            selected={parseInt(selectedRole) === role.role_id}
            count={roleCounts[role.role_id] || 0}
            onClick={() => {
              setSelectedRole(selectedRole === String(role.role_id) ? '' : String(role.role_id));
              setCurrentPage(1);
            }}
          >
            {role.role_name}
          </Chip>
        ))}
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState 
          icon={BiUser} 
          title={searchTerm || hasActiveFilters ? "No users found" : "No Users Yet"} 
          text={searchTerm || hasActiveFilters ? "Try adjusting your search or filters." : "Get started by creating your first user."} 
          action={<Button variant="secondary" onClick={() => setShowAddFaculty(true)}>Create User</Button>} 
        />
      ) : (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-panel border !border-line bg-surface">
          
          {isMobile ? (
            /* Mobile List */
            <ul className="flex-1 divide-y divide-line overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {currentItems.map((user) => (
                <li key={user.user_id} className="flex items-center gap-3 px-3">
                  <button onClick={() => setSheetUser(user)} className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left">
                    <Avatar first={user.first_name} last={user.last_name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{user.username}</span>
                      <span className="block truncate text-xs text-ink-2">{user.first_name} {user.last_name || ''} &middot; {user.email || 'No email'}</span>
                      <span className="mt-1 flex gap-1.5">
                        <Badge tone="neutral">{formatRoleName(user.role_id)}</Badge>
                        {user.designation_name && <Badge tone="neutral">{user.designation_name}</Badge>}
                      </span>
                    </span>
                    <BiChevronRight className="shrink-0 text-xl text-ink-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            /* Desktop Table */
            <div className="min-h-0 flex-1 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th scope="col" className={`${TH} pl-4`}>User</th>
                    <th scope="col" className={TH}>Role</th>
                    <th scope="col" className={TH}>Designation</th>
                    <th scope="col" className={TH}>School Email</th>
                    <th scope="col" className={TH}>Status</th>
                    <th scope="col" className={`${TH} w-44 text-right`}><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((user) => (
                    <tr key={user.user_id} className="border-t !border-line transition-colors hover:bg-surface-2">
                      <td className="px-3 py-3 pl-4">
                        <div className="flex items-center gap-3">
                          <Avatar first={user.first_name} last={user.last_name} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">{user.username}</p>
                            <p className="truncate text-xs text-ink-2">{user.first_name} {user.last_name || ''}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-3 py-3 text-ink-2"><Badge tone="neutral">{formatRoleName(user.role_id)}</Badge></td>
                      <td className="px-3 py-3 text-ink-2">{user.designation_name || '—'}</td>
                      <td className="px-3 py-3 text-ink-2">{user.email || '—'}</td>
                      <td className="px-3 py-3">
                        <Badge tone={user.is_active ? 'ok' : 'danger'}>{user.is_active ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td className="py-2 pl-3 pr-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => handleEdit(user)}>
                            <BiPencil className="text-base" /> Edit
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleArchive(user)}>
                            <BiTrash className="text-base" /> Archive
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination page={currentPage} pageCount={totalPages} total={filteredUsers.length} pageSize={rowsPerPage} onPageChange={setCurrentPage} />
        </section>
      )}

      {/* Mobile BottomSheet */}
      <BottomSheet open={!!sheetUser} onClose={() => setSheetUser(null)} title="User details">
        {sheetUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar size="lg" first={sheetUser.first_name} last={sheetUser.last_name} />
              <div>
                <p className="text-lg font-semibold text-ink">{sheetUser.username}</p>
                <p className="text-sm text-ink-2">{sheetUser.first_name} {sheetUser.last_name || ''}</p>
              </div>
            </div>

            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-3 text-sm">
              <dt className="text-ink-2">Role</dt>
              <dd className="text-right font-medium text-ink">{formatRoleName(sheetUser.role_id)}</dd>
              
              <dt className="text-ink-2">Designation</dt>
              <dd className="text-right font-medium text-ink">{sheetUser.designation_name || '—'}</dd>
              
              <dt className="text-ink-2">Email</dt>
              <dd className="break-all text-right font-medium text-ink">{sheetUser.email || '—'}</dd>
              
              <dt className="text-ink-2">Status</dt>
              <dd className="flex justify-end">
                <Badge tone={sheetUser.is_active ? 'ok' : 'danger'}>{sheetUser.is_active ? 'Active' : 'Inactive'}</Badge>
              </dd>
            </dl>

            <div className="grid gap-2">
              <Button variant="secondary" size="lg" onClick={() => runFromSheet(handleEdit)}>
                <BiPencil className="text-xl" aria-hidden="true" /> Edit user
              </Button>
              <Button variant="danger" size="lg" onClick={() => runFromSheet(handleArchive)}>
                <BiTrash className="text-xl" aria-hidden="true" /> Archive user
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

export default AManage;