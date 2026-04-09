import React, { useState } from 'react'; // Added useState import
import { useNavigate } from 'react-router-dom';
import './Enrollment.css';

function Enrollment() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        phoneNumber: '09',
        telephone: ''
    });

    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 5;

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "phoneNumber") {
            // PREVENTION: If the user tries to delete '0' or '9', 
            // we force the value back to '09' and stop the function.
            if (value.length < 2) {
                setFormData(prev => ({ ...prev, [name]: "09" }));
                return;
            }

            // Standard masking logic starts here
            const digits = value.replace(/\D/g, "");
            const limited = digits.slice(0, 11);
            
            let formatted = limited;
            if (limited.length > 4 && limited.length <= 7) {
                formatted = `${limited.slice(0, 4)}-${limited.slice(4)}`;
            } else if (limited.length > 7) {
                formatted = `${limited.slice(0, 4)}-${limited.slice(4, 7)}-${limited.slice(7)}`;
            }
            
            setFormData(prev => ({ ...prev, [name]: formatted }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleNext = () => {
        if (currentStep === 1) {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phoneNumber.trim()) {
                alert("Please fill in all required fields.");
                return;
            }

            if (!emailPattern.test(formData.email)) {
                alert("Please enter a valid email address.");
                return;
            }
            
            if (formData.phoneNumber.length < 13) {
                alert("Please enter a complete phone number (0000-000-0000).");
                return;
            }
        }

        setCurrentStep(Math.min(totalSteps, currentStep + 1));
    };

    return (
        <div className="enrollmentContainer">
            <div className="topBar">
                <button className='returnBT' onClick={() => navigate(-1)}>
                    <span className="material-icons">arrow_back</span>
                </button>
            </div>

            <div className="enrollmentNav">
                <div className="navLinks">
                    <a className={`enrollmentLink ${currentStep === 1 ? 'active' : ''}`}>Personal Info</a>
                    <a className={`enrollmentLink ${currentStep === 2 ? 'active' : ''}`}>Educational</a>
                    <a className={`enrollmentLink ${currentStep === 3 ? 'active' : ''}`}>Program</a>
                    <a className={`enrollmentLink ${currentStep === 4 ? 'active' : ''}`}>Documents</a>
                    <a className={`enrollmentLink ${currentStep === 5 ? 'active' : ''}`}>Review</a>
                </div>
                <div className="progressBar">
                    <div className="progressFill" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
                </div>
            </div>

            <div className="enrollmentContent">
                {currentStep === 1 && (
                    <div className="slides">
                        <h1 className="enrollmentTitle">Personal Information</h1>
                        <div style={{ height: '0.15rem', backgroundColor: '#3d1616', width: '90%', margin: '1rem 0' }}></div>
                        
                        <div className="row">
                            <div className="col">
                                <label>First Name <span style={{color: 'red'}}>*</span></label>
                                <input 
                                    type="text" 
                                    name="firstName"
                                    placeholder="First Name" 
                                    value={formData.firstName}
                                    onChange={handleChange}
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
                                <label>First Name </label>
                                <input 
                                    type="text" 
                                    name="firstName"
                                    placeholder="First Name" 
                                    value={formData.firstName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col">
                                <label>Last Name </label>
                                <input 
                                    type="text" 
                                    name="lastName" 
                                    placeholder="Last Name" 
                                    value={formData.lastName}
                                    onChange={handleChange}
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
                                <label>Email <span style={{color: 'red'}}>*</span></label>
                                <input 
                                    type="email" 
                                    name="email"
                                    placeholder="Email" 
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col">
                                <label>Phone Number <span style={{color: 'red'}}>*</span></label>
                                <input 
                                    type="text" 
                                    name="phoneNumber"
                                    placeholder="Phone Number" 
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col">
                                <label>Telephone</label>
                                <input 
                                    type="text" 
                                    name="telephone"
                                    placeholder="Telephone" 
                                    value={formData.telephone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="slides">
                        <h1 className="enrollmentTitle">Educational Background</h1>
                        <div style={{ height: '0.15rem', backgroundColor: '#3d1616', width: '90%', margin: '1rem 0' }}></div>
                        <p className="enrollmentText">This is where the enrollment form will be.</p>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="slides">
                        <h1 className="enrollmentTitle">Program Information</h1>
                        <div style={{ height: '0.15rem', backgroundColor: '#3d1616', width: '90%', margin: '1rem 0' }}></div>
                        <p className="enrollmentText">This is where the enrollment form will be.</p>
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="slides">
                        <h1 className="enrollmentTitle">Document Upload</h1>
                        <div style={{ height: '0.15rem', backgroundColor: '#3d1616', width: '90%', margin: '1rem 0' }}></div>
                        <p className="enrollmentText">This is where the enrollment form will be.</p>
                    </div>
                )}

                {currentStep === 5 && (
                    <div className="slides">
                        <h1 className="enrollmentTitle">Review & Submit</h1>
                        <div style={{ height: '0.15rem', backgroundColor: '#3d1616', width: '90%', margin: '1rem 0' }}></div>
                        <p className="enrollmentText">This is where the enrollment form will be.</p>
                    </div>
                )}


                <div className="enrollmentBTs">
                    <button 
                        className="iconBT" 
                        onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                        disabled={currentStep === 1}
                    >
                        <span className="material-icons">chevron_left</span>
                    </button>

                    <button 
                        className="iconBT" 
                        onClick={handleNext}
                    >
                        <span className="material-icons">
                            {currentStep === totalSteps ? 'check_circle' : 'chevron_right'}
                        </span>
                    </button>
                </div>
            </div>

            <div className="bottomBar">
                <p className="bottomText">© Copyright 2026. Our Lady of Fatima University - College of Physical Therapy. All Rights reserved. | Powered by CSTH BSCS 3-Y2-1</p>
            </div>
        </div>
    );
}

export default Enrollment;