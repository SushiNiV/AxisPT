import React, { useMemo } from 'react'; 
import nationality from 'i18n-nationality';
import './PersonalInfo.css';

nationality.registerLocale(require("i18n-nationality/langs/en.json"));  

function PersonalInfo({ formData, setFormData, handleChange }) {
  const nationalityOptions = useMemo(() => {
    const list = nationality.getNames("en");
    return Object.entries(list).map(([code, name]) => ({
      value: code,
      label: name
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const handleAddressCheckbox = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      setFormData(prev => ({
        ...prev,
        sameAsPermanent: true,
        provHouseNo: prev.permHouseNo,
        provStreet: prev.permStreet,
        provSubdivision: prev.permSubdivision,
        provCity: prev.permCity,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        sameAsPermanent: false,
        provHouseNo: '', provStreet: '', provSubdivision: '', provCity: ''
      }));
    }
  };
  
  return (
    <div className="slides">
      <h1 className="enrollmentTitle">Personal Information</h1>

      <h2 className="enrollmentSubtitle">Fullname</h2>
      <div className="row">
        <div className="col">
          <label>First Name <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="firstName"
            placeholder="First Name" 
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col">
          <label>Last Name <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="lastName" 
            placeholder="Last Name" 
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col">
          <label>Middle Name</label>
          <input 
            type="text" 
            name="middleName"
            placeholder="Middle Name" 
            value={formData.middleName}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label>Suffix</label>
          <select 
            name="suffix"
            value={formData.suffix}
            onChange={handleChange}
          >
            <option value="">NONE</option>
            <option value="JR.">JR.</option>
            <option value="SR.">SR.</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
          </select>
        </div>
        <div className="col">
          <label>Sex <span style={{color: 'red'}}>*</span></label>
          <select 
            name="sex"
            value={formData.sex}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Select Sex</option>
            <option value="MALE">MALE</option>
            <option value="FEMALE">FEMALE</option>
          </select>
        </div>
        <div className="col">
          <label>Date of Birth <span style={{color: 'red'}}>*</span></label>
          <input 
            type="date" 
            name="dateOfBirth"
            className="col-input" 
            value={formData.dateOfBirth}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        <div className="col">
          <label>Place of Birth <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="placeOfBirth"
            placeholder="Place of Birth" 
            value={formData.placeOfBirth}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label>Email <span style={{color: 'red'}}>*</span></label>
          <input 
            type="email" 
            name="email"
            placeholder="Email" 
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col">
          <label>Phone Number <span style={{color: 'red'}}>*</span></label>
          <input 
            type="tel" 
            name="phoneNumber"
            placeholder="Phone Number" 
            value={formData.phoneNumber}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col">
          <label>Landline</label>
          <input 
              type="tel" 
              name="landline"
              placeholder="Landline" 
              value={formData.landline}
              onChange={handleChange}
              required
            />
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label>Religion <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="religion"
            placeholder="Religion" 
            value={formData.religion}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col">
          <label>Nationality <span style={{color: 'red'}}>*</span></label>
            <select 
            name="nationality" 
            value={formData.nationality}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Select Nationality</option>              
            <option value="PILIPINO">Pilipino</option>
            <option disabled>──────────</option>
            {nationalityOptions.map((n) => (
              <option key={n.value} value={n.label}>
                {n.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col">
          <label>Civil Status</label>
          <select 
            name="civilStatus"
            value={formData.civilStatus}
            onChange={handleChange}
            required
            >
            <option value="" disabled>Civil Status</option>
            <option value="SINGLE">SINGLE</option>
            <option value="MARRIED">MARRIED</option>
            <option value="WIDOWED">WIDOWED</option>
          </select>
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label>Height (ft)<span style={{color: 'red'}}>*</span></label>
          <input 
            type="number"
            step="0.01" 
            name="height"
            placeholder="Height (ft) (e.g. 5.7)" 
            value={formData.height}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col">
          <label>Weight (lbs) <span style={{color: 'red'}}>*</span></label>
          <input 
            type="number" 
            name="weight" 
            placeholder="Weight (lbs) (e.g. 150)" 
            value={formData.weight}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col">
          <label>Language/Dialect</label>
          <input 
            type="text" 
            name="language"
            placeholder="Language/Dialect" 
            value={formData.language}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label>Do you have eye or visual problems? </label>
          <input 
            type="text" 
            name="visualProblems"
            placeholder="Type your specific visual problem here..." 
            value={formData.visualProblems}
            onChange={handleChange}
          />
        </div>
      </div>

      <h2 className="enrollmentSubtitle">Permanent Address</h2>
      <div className="row">
        <div className="col">
          <label>House No. <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="permHouseNo"
            placeholder="House No." 
            value={formData.permHouseNo}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col">
          <label>Street <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="permStreet"
            placeholder="Street" 
            value={formData.permStreet}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col">
          <label>Subdivision <span style={{color: 'red'}}>*</span></label>
          <input 
              type="text" 
              name="permSubdivision"
              placeholder="Subdivision/Barangay" 
              value={formData.permSubdivision}
              onChange={handleChange}
              required
            />
        </div>
        <div className="col">
          <label>City <span style={{color: 'red'}}>*</span></label>
          <input 
              type="text" 
              name="permCity"
              placeholder="City/Municipality" 
              value={formData.permCity}
              onChange={handleChange}
              required
            />
        </div>
      </div>

      <h2 className="enrollmentSubtitle">Provincial Address</h2>
      <label className="sameAddressLabel">
        <input 
          type="checkbox" 
          checked={formData.sameAsPermanent} 
          onChange={handleAddressCheckbox} 
        />
        Same with Permanent Address
      </label>
      {!formData.sameAsPermanent && (
      <>
        <div className="row">
          <div className="col">
            <label>House No. <span style={{color: 'red'}}>*</span></label>
            <input 
                type="text" 
              name="provHouseNo"
              placeholder="House No." 
              value={formData.provHouseNo}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col">
            <label>Street <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              name="provStreet"
              placeholder="Street" 
              value={formData.provStreet}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col">
            <label>Subdivision <span style={{color: 'red'}}>*</span></label>
            <input 
                type="text" 
                name="provSubdivision"
                placeholder="Subdivision/Barangay" 
                value={formData.provSubdivision}
                onChange={handleChange}
                required
              />
          </div>
          <div className="col">
            <label>City <span style={{color: 'red'}}>*</span></label>
            <input 
                type="text" 
                name="provCity"
                placeholder="City/Municipality" 
                value={formData.provCity}
                onChange={handleChange}
                required
              />
          </div>
        </div>
      </>
    )}
  </div>
)};

export default PersonalInfo;