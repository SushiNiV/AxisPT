import React, { useState, useEffect } from "react";
import { BiUserPlus } from 'react-icons/bi';
import ConfirmationModal from '../../../Components/shared/ConfirmationModal';
import Dropdown from '../../../Components/shared/Dropdown'; 
import Modal from '../../../Components/ui/Modal';
import Button from '../../../Components/ui/Button';
import TextField from '../../../Components/ui/Textfield';
import cx from '../../../Components/ui/Cx';

function AddFaculty({ onClose, onSuccess, facultyToEdit = null }) {
  const [formData, setFormData] = useState({
    last_name: "", first_name: "", middle_name: "", suffix: "", username: "", email: "",
    role_id: "", designation_id: "", new_designation_name: "", is_active: true
  });
  const [roles, setRoles] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isNewDesignation, setIsNewDesignation] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const isEditMode = !!facultyToEdit;

  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [successState, setSuccessState] = useState({ isOpen: false });

  const closeConfirm = () => setConfirmState({ isOpen: false });
  const openAlert = (title, message, variant = 'info') => setConfirmState({ isOpen: true, title, message, variant, isAlert: true, onConfirm: closeConfirm, onCancel: closeConfirm });
  const showSuccess = (title, summary) => setSuccessState({ isOpen: true, title, summary, variant: 'success' });

  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      try {
        const [rolesRes, designationsRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/admin/roles`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/admin/designations`, { headers })
        ]);
        const rolesData = await rolesRes.json();
        const designationsData = await designationsRes.json();
        if (rolesData.success) setRoles(rolesData.data);
        if (designationsData.success) setDesignations(designationsData.data);
      } catch (err) { console.error("Error fetching data:", err); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isEditMode && facultyToEdit) {
      setFormData({
        last_name: facultyToEdit.last_name || "", first_name: facultyToEdit.first_name || "",
        middle_name: facultyToEdit.middle_name || "", suffix: facultyToEdit.suffix || "",
        username: facultyToEdit.username || "", email: facultyToEdit.email || "",
        role_id: facultyToEdit.role_id != null ? String(facultyToEdit.role_id) : "",
        designation_id: facultyToEdit.designation_id != null ? String(facultyToEdit.designation_id) : "",
        new_designation_name: "", is_active: facultyToEdit.is_active !== undefined ? facultyToEdit.is_active : true
      });
      setIsActive(facultyToEdit.is_active !== undefined ? facultyToEdit.is_active : true);
      setIsNewDesignation(false);
    }
  }, [isEditMode, facultyToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setIsDirty(true);
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "designation_id" && value === "new") {
      setIsNewDesignation(true);
      setFormData(prev => ({ ...prev, designation_id: "" }));
    } else if (name === "designation_id" && value !== "new") {
      setIsNewDesignation(false);
      setFormData(prev => ({ ...prev, new_designation_name: "" }));
    }
  };

  const handleSubmit = async () => {
    const { last_name, first_name, username, email, role_id, designation_id, new_designation_name } = formData;
    if (!last_name || !first_name || !username || !email || !role_id) { openAlert('Missing Fields', 'Please fill in all required fields.', 'warning'); return; }
    if (!isNewDesignation && !designation_id) { openAlert('Missing Designation', 'Please select a designation.', 'warning'); return; }
    if (isNewDesignation && !new_designation_name) { openAlert('Missing Designation Name', 'Please enter the new designation name.', 'warning'); return; }
    if (!email.includes('@')) { openAlert('Invalid Email', 'Please enter a valid email address.', 'warning'); return; }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const url = isEditMode
        ? `${process.env.REACT_APP_API_URL}/admin/users/${facultyToEdit.user_id}`
        : `${process.env.REACT_APP_API_URL}/admin/users`;
      const method = isEditMode ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          last_name, first_name, middle_name: formData.middle_name, suffix: formData.suffix, username, email,
          role_id: parseInt(role_id), designation_id: isNewDesignation ? null : parseInt(designation_id),
          new_designation_name: isNewDesignation ? new_designation_name : null, is_active: isActive
        })
      });
      const data = await response.json();
      if (data.success) {
        setIsDirty(false);
        showSuccess(isEditMode ? 'User Updated' : 'User Created',
          data.password
            ? `The user has been ${isEditMode ? 'updated' : 'created'} successfully.\n\nTemporary password: ${data.password}`
            : `The user has been ${isEditMode ? 'updated' : 'created'} successfully.`
        );
      } else {
        openAlert('Save Failed', data.message || 'Failed to save user.', 'danger');
      }
    } catch (error) {
      openAlert('Connection Error', 'An unexpected error occurred. Please try again.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [{ value: "", label: "Select Role" }, ...roles.map(role => ({ value: role.role_id, label: role.role_name === 'SUPERADMIN' ? 'Super Admin' : role.role_name }))];
  const designationOptions = [{ value: "", label: "Select Designation" }, ...designations.map(d => ({ value: d.designation_id, label: d.designation_name })), { value: "new", label: "+ Add New Designation" }];
  const suffixOptions = [{ value: "", label: "None" }, { value: "Jr.", label: "Jr." }, { value: "Sr.", label: "Sr." }, { value: "III", label: "III" }, { value: "IV", label: "IV" }];

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={isEditMode ? "Update User" : "Add New User"}
        description="Enter the faculty or staff details."
        icon={<BiUserPlus className="text-2xl" />}
        loading={isSubmitting}
        isDirty={isDirty}
        footer={({ requestClose }) => (
          <>
            <Button type="button" variant="secondary" onClick={requestClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleSubmit} loading={isSubmitting} disabled={!isDirty}>
              {isSubmitting ? "Saving..." : (isEditMode ? "Update User" : "Create User")}
            </Button>
          </>
        )}
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={<>Last Name <span className="text-danger">*</span></>} name="last_name" placeholder="Dela Cruz" value={formData.last_name} onChange={handleChange} />
            <TextField label={<>First Name <span className="text-danger">*</span></>} name="first_name" placeholder="Juan" value={formData.first_name} onChange={handleChange} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Middle Name" name="middle_name" placeholder="Santos" value={formData.middle_name} onChange={handleChange} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink">Suffix</label>
              <Dropdown options={suffixOptions} value={formData.suffix} onChange={(val) => handleChange({ target: { name: 'suffix', value: val } })} placeholder="Select Suffix" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={<>Username <span className="text-danger">*</span></>} name="username" placeholder="juandelacruz" value={formData.username} onChange={handleChange} />
            <TextField label={<>School Email <span className="text-danger">*</span></>} name="email" type="email" placeholder="juan@school.edu" value={formData.email} onChange={handleChange} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink">Role <span className="text-danger">*</span></label>
              <Dropdown options={roleOptions} value={formData.role_id} onChange={(val) => handleChange({ target: { name: 'role_id', value: val } })} placeholder="Select Role" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink">Designation <span className="text-danger">*</span></label>
              <Dropdown options={designationOptions} value={isNewDesignation ? "new" : formData.designation_id} onChange={(val) => handleChange({ target: { name: 'designation_id', value: val } })} placeholder="Select Designation" />
            </div>
          </div>
          {isNewDesignation && (
            <TextField label={<>New Designation Name <span className="text-danger">*</span></>} name="new_designation_name" placeholder="e.g., Department Chair" value={formData.new_designation_name} onChange={handleChange} />
          )}
          <div className="space-y-3 pt-2">
            <label className="block text-sm font-medium text-ink">Account Status <span className="text-danger">*</span></label>
            <div className="flex cursor-pointer items-center gap-3" onClick={() => { setIsDirty(true); setIsActive(!isActive); }}>
              <div className={cx("relative h-6 w-11 rounded-full transition-colors duration-200 ease-in-out", isActive ? "bg-brand" : "bg-line-strong")}>
                <div className={cx("absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out", isActive ? "translate-x-6" : "translate-x-1")} />
              </div>
              <span className={cx("text-sm font-medium transition-colors", isActive ? "text-brand-ink" : "text-ink-2")}>{isActive ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmationModal isOpen={successState.isOpen} title={successState.title} summary={successState.summary} variant={successState.variant} isAlert={true} onConfirm={() => { setSuccessState({ isOpen: false }); onSuccess(); }} onCancel={() => { setSuccessState({ isOpen: false }); onSuccess(); }} />
      <ConfirmationModal isOpen={confirmState.isOpen} title={confirmState.title} message={confirmState.message} variant={confirmState.variant} isAlert={confirmState.isAlert} onConfirm={confirmState.onConfirm} onCancel={confirmState.onCancel} />
    </>
  );
}

export default AddFaculty;