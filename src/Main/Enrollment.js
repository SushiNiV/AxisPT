import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Enrollment.css';

function Enrollment() {
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = React.useState(1);
    const totalSteps = 5;
    const progressWidth = (currentStep / totalSteps) * 100;

    return (
    <div className="enrollmentContainer">

        <div className="topBar">
            <button className='returnBT' onClick={() => navigate(-1)}>
                <span className="material-icons">arrow_back</span>
            </button>
        </div>

        <div className="enrollmentNav">
  <div className="navLinks">
    <a className={`enrollmentLink ${currentStep == 1 ? 'active' : ''}`}>Personal Info</a>
    <a className={`enrollmentLink ${currentStep == 2 ? 'active' : ''}`}>Educational</a>
    <a className={`enrollmentLink ${currentStep == 3 ? 'active' : ''}`}>Program</a>
    <a className={`enrollmentLink ${currentStep == 4 ? 'active' : ''}`}>Documents</a>
    <a className={`enrollmentLink ${currentStep == 5 ? 'active' : ''}`}>Review</a>
  </div>
  
  <div className="progressBar">
    <div 
      className="progressFill" 
      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
    ></div>
  </div>
</div>

        <div className="enrollmentContent">
            {currentStep === 1 && (
                <div className="slides">
                    <h1 className="enrollmentTitle">Personal Information</h1>
                    <div style={{ height: '0.15rem', backgroundColor: '#3d1616', width: '90%', margin: '1rem 0' }}></div>
                    <span className="row">
                        <span className="col">
                            <label>First Name</label>
                            <input type="text" placeholder="First Name" />
                        </span>
                        <span className="col">
                            <label>Last Name</label>
                            <input type="text" placeholder="Last Name" />
                        </span>
                        <span className="col">
                            <label>Middle Name</label>
                            <input type="text" placeholder="Middle Name" />
                        </span>
                    </span>
                    
                    <span className="row">
                        <span className="col">
                            <label>First Name</label>
                            <input type="text" placeholder="First Name" />
                        </span>
                        <span className="col">
                            <label>Last Name</label>
                            <input type="text" placeholder="Last Name" />
                        </span>
                        <span className="col">
                            <label>Middle Name</label>
                            <input type="text" placeholder="Middle Name" />
                        </span>
                    </span>

                    <span className="row">
                        <span className="col">
                            <label>First Name</label>
                            <input type="text" placeholder="First Name" />
                        </span>
                        <span className="col">
                            <label>Last Name</label>
                            <input type="text" placeholder="Last Name" />
                        </span>
                        <span className="col">
                            <label>Middle Name</label>
                            <input type="text" placeholder="Middle Name" />
                        </span>
                    </span>

                    <span className="row">
                        <span className="col">
                            <label>First Name</label>
                            <input type="text" placeholder="First Name" />
                        </span>
                        <span className="col">
                            <label>Last Name</label>
                            <input type="text" placeholder="Last Name" />
                        </span>
                        <span className="col">
                            <label>Middle Name</label>
                            <input type="text" placeholder="Middle Name" />
                        </span>
                    </span>
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
                    <h1 className="enrollmentTitle">Program Selection</h1>
                    <div style={{ height: '0.15rem', backgroundColor: '#3d1616', width: '90%', margin: '1rem 0' }}></div>
                    <p className="enrollmentText">This is where the enrollment form will be.</p>
                </div>
            )}

            {currentStep === 4 && (
                <div className="slides">
                    <h1 className="enrollmentTitle">Documents</h1>
                    <div style={{ height: '0.15rem', backgroundColor: '#3d1616', width: '90%', margin: '1rem 0' }}></div>
                    <p className="enrollmentText">This is where the enrollment form will be.</p>
                </div>
            )}

            {currentStep === 5 && (
                <div className="slides">
                    <h1 className="enrollmentTitle">Review</h1>
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
                    onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
                >
                    <span className="material-icons">
                        {currentStep === totalSteps ? 'check_circle' : 'chevron_right'}
                    </span>
                </button>
            </div>
        </div>
    </div>
  );
}

export default Enrollment;