import React, { useMemo } from 'react'; 
import nationality from 'i18n-nationality';
import './PersonalInfo.css';

nationality.registerLocale(require("i18n-nationality/langs/en.json"));  

function PersonalInfo({ formData, setFormData, handleChange, errors }) {
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
            className={errors.firstName ? "input-error" : ""}
            required
          />
          {errors.firstName && <span className="error-text">{errors.firstName}</span>}
        </div>
        <div className="col">
          <label>Last Name <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="lastName" 
            placeholder="Last Name" 
            value={formData.lastName}
            onChange={handleChange}
            className={errors.lastName ? "input-error" : ""}
            required
          />
          {errors.lastName && <span className="error-text">{errors.lastName}</span>}
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
            className={errors.sex ? "input-error" : ""}
            required
          >
            <option value="" disabled>Select Sex</option>
            <option value="MALE">MALE</option>
            <option value="FEMALE">FEMALE</option>
          </select>
          {errors.sex && <span className="error-text">{errors.sex}</span>}
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
            className={errors.dateOfBirth ? "input-error" : ""}
            required
          />
          {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
        </div>
        <div className="col">
          <label>Place of Birth <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="placeOfBirth"
            placeholder="Place of Birth" 
            value={formData.placeOfBirth}
            onChange={handleChange}
            className={errors.placeOfBirth ? "input-error" : ""}
            required
          />
          {errors.placeOfBirth && <span className="error-text">{errors.placeOfBirth}</span>}
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
            className={errors.email ? "input-error" : ""}
            required
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>
        <div className="col">
          <label>Phone Number <span style={{color: 'red'}}>*</span></label>
          <input 
            type="tel" 
            name="phoneNumber"
            placeholder="Phone Number" 
            value={formData.phoneNumber}
            onChange={handleChange}
            className={errors.phoneNumber ? "input-error" : ""}
            required
          />
          {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
        </div>
        <div className="col">
          <label>Landline</label>
          <input 
              type="tel" 
              name="landline"
              placeholder="Landline" 
              value={formData.landline}
              onChange={handleChange}
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
            className={errors.religion ? "input-error" : ""}
            required
          />
          {errors.religion && <span className="error-text">{errors.religion}</span>}
        </div>
        <div className="col">
          <label>Nationality <span style={{color: 'red'}}>*</span></label>
            <select 
            name="nationality" 
            value={formData.nationality}
            onChange={handleChange}
            className={errors.nationality ? "input-error" : ""}
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
          {errors.nationality && <span className="error-text">{errors.nationality}</span>}
        </div>
        <div className="col">
          <label>Civil Status</label>
          <select 
            name="civilStatus"
            value={formData.civilStatus}
            onChange={handleChange}
            className={errors.civilStatus ? "input-error" : ""}
            required
            >
            <option value="" disabled>Civil Status</option>
            <option value="SINGLE">SINGLE</option>
            <option value="MARRIED">MARRIED</option>
            <option value="WIDOWED">WIDOWED</option>
          </select>
          {errors.civilStatus && <span className="error-text">{errors.civilStatus}</span>}
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
            className={errors.height ? "input-error" : ""}
            required
          />
          {errors.height && <span className="error-text">{errors.height}</span>}
        </div>
        <div className="col">
          <label>Weight (lbs) <span style={{color: 'red'}}>*</span></label>
          <input 
            type="number" 
            name="weight" 
            placeholder="Weight (lbs) (e.g. 150)" 
            value={formData.weight}
            onChange={handleChange}
            className={errors.weight ? "input-error" : ""}
            required
          />
          {errors.weight && <span className="error-text">{errors.weight}</span>}
        </div>
        <div className="col">
          <label>Language / Dialect <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="language"
            placeholder="Language/Dialect" 
            value={formData.language}
            onChange={handleChange}
            className={errors.language ? "input-error" : ""}
            required
          />
          {errors.language && <span className="error-text">{errors.language}</span>}
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
            className={errors.permHouseNo ? "input-error" : ""}
            required
          />
          {errors.permHouseNo && <span className="error-text">{errors.permHouseNo}</span>}
        </div>
        <div className="col">
          <label>Street <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="permStreet"
            placeholder="Street" 
            value={formData.permStreet}
            onChange={handleChange}
            className={errors.permStreet ? "input-error" : ""}
            required
          />
          {errors.permStreet && <span className="error-text">{errors.permStreet}</span>}
        </div>
        <div className="col">
          <label>Subdivision <span style={{color: 'red'}}>*</span></label>
          <input 
              type="text" 
              name="permSubdivision"
              placeholder="Subdivision/Barangay" 
              value={formData.permSubdivision}
              onChange={handleChange}
              className={errors.permSubdivision ? "input-error" : ""}
              required
            />
            {errors.permSubdivision && <span className="error-text">{errors.permSubdivision}</span>}
        </div>
        <div className="col">
          <label>City <span style={{color: 'red'}}>*</span></label>
          <input 
              type="text" 
              name="permCity"
              placeholder="City/Municipality" 
              value={formData.permCity}
              onChange={handleChange}
              className={errors.permCity ? "input-error" : ""}
              required
            />
            {errors.permCity && <span className="error-text">{errors.permCity}</span>}
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
              className={errors.provHouseNo ? "input-error" : ""}
              required
            />
            {errors.provHouseNo && <span className="error-text">{errors.provHouseNo}</span>}
          </div>
          <div className="col">
            <label>Street <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              name="provStreet"
              placeholder="Street" 
              value={formData.provStreet}
              onChange={handleChange}
              className={errors.provStreet ? "input-error" : ""}
              required
            />
            {errors.provStreet && <span className="error-text">{errors.provStreet}</span>}
          </div>
          <div className="col">
            <label>Subdivision <span style={{color: 'red'}}>*</span></label>
            <input 
                type="text" 
                name="provSubdivision"
                placeholder="Subdivision/Barangay" 
                value={formData.provSubdivision}
                onChange={handleChange}
                className={errors.provSubdivision ? "input-error" : ""}
                required
              />
              {errors.provSubdivision && <span className="error-text">{errors.provSubdivision}</span>}
          </div>
          <div className="col">
            <label>City <span style={{color: 'red'}}>*</span></label>
            <input 
                type="text" 
                name="provCity"
                placeholder="City/Municipality" 
                value={formData.provCity}
                onChange={handleChange}
                className={errors.provCity ? "input-error" : ""}
                required
              />
              {errors.provCity && <span className="error-text">{errors.provCity}</span>}
          </div>
        </div>
      </>
    )}
  </div>
)};

export default PersonalInfo;