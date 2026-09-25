import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import ConfirmationModal from '../ConfirmationModal';
import '../../../GlobalForm.css';
import '../../../GlobalOverlay.css';
import '../../../Global.css';


function AddFaculty({ onClose, onSuccess, facultyToEdit = null }) {
  const [formData, setFormData] = useState({
    last_name: "",
    first_name: "",
    middle_name: "",
    suffix: "",
    username: "",
    email: "",
    role_id: "",
    designation_id: "",
    new_designation_name: "",
    is_active: true
  });
  const [roles, setRoles] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isNewDesignation, setIsNewDesignation] = useState(false);
  const portalRoot = document.getElementById('portal-root') || document.body;
  const isEditMode = !!facultyToEdit;

  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [successState, setSuccessState] = useState({ isOpen: false });

  const closeConfirm = () => setConfirmState({ isOpen: false });

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

  const showSuccess = (title, message) => {
    setSuccessState({ isOpen: true, title, message, variant: 'success' });
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem('token');
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
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (isEditMode && facultyToEdit) {
      setFormData({
        last_name: facultyToEdit.last_name || "",
        first_name: facultyToEdit.first_name || "",
        middle_name: facultyToEdit.middle_name || "",
        suffix: facultyToEdit.suffix || "",
        username: facultyToEdit.username || "",
        email: facultyToEdit.email || "",
        role_id: facultyToEdit.role_id || "",
        designation_id: facultyToEdit.designation_id || "",
        new_designation_name: "",
        is_active: facultyToEdit.is_active !== undefined ? facultyToEdit.is_active : true
      });
      setIsActive(facultyToEdit.is_active !== undefined ? facultyToEdit.is_active : true);
      setIsNewDesignation(false);
    }
  }, [isEditMode, facultyToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "designation_id" && value === "new") {
      setIsNewDesignation(true);
      setFormData(prev => ({ ...prev, designation_id: "" }));
    } else if (name === "designation_id" && value !== "new") {
      setIsNewDesignation(false);
      setFormData(prev => ({ ...prev, new_designation_name: "" }));
    }
  };

  const toggleActive = () => {
    setIsActive(!isActive);
  };

  const handleSubmit = async () => {
    const { last_name, first_name, username, email, role_id, designation_id, new_designation_name } = formData;

    if (!last_name || !first_name || !username || !email || !role_id) {
      openAlert('Missing Fields', 'Please fill in all required fields.', 'warning');
      return;
    }

    if (!isNewDesignation && !designation_id) {
      openAlert('Missing Designation', 'Please select a designation.', 'warning');
      return;
    }

    if (isNewDesignation && !new_designation_name) {
      openAlert('Missing Designation Name', 'Please enter the new designation name.', 'warning');
      return;
    }

    if (!email.includes('@')) {
      openAlert('Invalid Email', 'Please enter a valid email address.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('token');
      const url = isEditMode
        ? `${process.env.REACT_APP_API_URL}/admin/users/${facultyToEdit.user_id}`
        : `${process.env.REACT_APP_API_URL}/admin/users`;

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          last_name,
          first_name,
          middle_name: formData.middle_name,
          suffix: formData.suffix,
          username,
          email,
          role_id: parseInt(role_id),
          designation_id: isNewDesignation ? null : parseInt(designation_id),
          new_designation_name: isNewDesignation ? new_designation_name : null,
          is_active: isActive
        })
      });

      const data = await response.json();

      if (data.success) {
        // Show success; include temporary password if this was a new user.
        showSuccess(
          isEditMode ? 'User Updated' : 'User Created',
          data.password
            ? `The user has been ${isEditMode ? 'updated' : 'created'} successfully.\n\nTemporary password: ${data.password}`
            : `The user has been ${isEditMode ? 'updated' : 'created'} successfully.`
        );
      } else {
        openAlert(
          isEditMode ? 'Update Failed' : 'Creation Failed',
          data.message || (isEditMode ? 'Failed to update user.' : 'Failed to create user.'),
          'danger'
        );
      }
    } catch (error) {
      console.error("Error submitting user:", error);
      openAlert('Connection Error', 'An unexpected error occurred. Please try again.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="modalOverlay">
      <div className="modalContainer">
        <div className="modalHeader">
          <h3 className="modalTitle">{isEditMode ? "UPDATE USER" : "ADD NEW USER"}</h3>
          <div className="CloseBtnArea">
            <button className="CloseBtn" onClick={onClose} disabled={isSubmitting}>&times;</button>
          </div>
        </div>

        <div className="modalScrollArea">
          <div className="FormContent">
            <div className="formRow">
              <div className="formGroup">
                <label className="formLabel">LAST NAME <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  name="last_name"
                  placeholder="Dela Cruz"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">FIRST NAME <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  name="first_name"
                  placeholder="Juan"
                  value={formData.first_name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="formRow">
              <div className="formGroup">
                <label className="formLabel">MIDDLE NAME</label>
                <input
                  type="text"
                  name="middle_name"
                  placeholder="Santos"
                  value={formData.middle_name}
                  onChange={handleChange}
                />
              </div>
              <div className="formGroup">
                <label className="formLabel">SUFFIX</label>
                <select
                  name="suffix"
                  value={formData.suffix}
                  onChange={handleChange}
                  className="formSelect"
                >
                  <option value="">Select Suffix</option>
                  <option value="Jr.">Jr.</option>
                  <option value="Sr.">Sr.</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                </select>
              </div>
            </div>

            <div className="formRow">
              <div className="formGroup">
                <label className="formLabel">USERNAME <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  name="username"
                  placeholder="01230001231"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>

              <div className="formGroup">
                <label className="formLabel"> SCHOOL EMAIL <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="email"
                  name="email"
                  placeholder="juan.delacruz@school.edu"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="formRow">
              <div className="formGroup">
                <label className="formLabel">ROLE <span style={{ color: 'red' }}>*</span></label>
                <select
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleChange}
                  className="formSelect"
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name === 'SUPERADMIN' ? 'Super Admin' : 'Admin'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="formGroup">
                <label className="formLabel">DESIGNATION <span style={{ color: 'red' }}>*</span></label>
                <select
                  name="designation_id"
                  value={formData.designation_id}
                  onChange={handleChange}
                  className="formSelect"
                >
                  <option value="">Select Designation</option>
                  {designations.map(designation => (
                    <option key={designation.designation_id} value={designation.designation_id}>
                      {designation.designation_name}
                    </option>
                  ))}
                  <option value="new">Add New Designation</option>
                </select>
              </div>
            </div>

            {isNewDesignation && (
              <div className="formGroup">
                <label className="formLabel">NEW DESIGNATION NAME <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  name="new_designation_name"
                  placeholder="e.g., Department Chair"
                  value={formData.new_designation_name}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="formGroup">
              <label className="formLabel">STATUS <span style={{ color: 'red' }}>*</span></label>
              <div className="statusToggleContainer" onClick={toggleActive}>
                <div className={`statusSwitch ${isActive ? 'active' : 'inactive'}`}>
                  <div className="switchHandle"></div>
                </div>
                <span className={`statusLabel ${isActive ? 'text-active' : 'text-inactive'}`}>
                  {isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
            </div>

            <div className="BtnsContainer">
              <button className="ResetFilterBtn" onClick={onClose} disabled={isSubmitting}>CANCEL</button>
              <button className="ApplyFilterBtn" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (isEditMode ? "UPDATING..." : "CREATING...") : (isEditMode ? "UPDATE" : "CREATE")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success modal */}
      <ConfirmationModal
        isOpen={successState.isOpen}
        title={successState.title}
        message={successState.message}
        variant={successState.variant}
        isAlert={true}
        onConfirm={() => {
          setSuccessState({ isOpen: false });
          onSuccess();
        }}
        onCancel={() => {
          setSuccessState({ isOpen: false });
          onSuccess();
        }}
      />

      {/* Alert / error modal */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        isAlert={confirmState.isAlert}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />
    </div>
  );

  return ReactDOM.createPortal(modalContent, portalRoot);
}

export default AddFaculty;