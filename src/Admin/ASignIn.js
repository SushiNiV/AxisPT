import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ASignIn.css';

function ASignIn() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        employeeID: '',
        password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "employeeID") {
            const onlyNums = value.replace(/\D/g, "");
            setFormData(prev => ({ ...prev, [name]: onlyNums }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        console.log("Attempting Login with:", formData);
        };

    return (
        <div className="asigninContainer">

                <div className="asigninLcard">
                    <div className="brandingContent">
                    </div>
                </div>

            <div className="asigninRcontainer">
                <div className="asignintopBar">
                    <p className="asigninText">
                        <span>Have Trouble Signing In? </span>
                        <b>Contact CPT Administrator.</b>
                    </p>
                </div>

                    <form className="asigninForm" onSubmit={handleLogin}>
                        <p className="asigninTitle">Administrative Axis Portal</p>

                        <div className="formColumn">
                            <div className="ascol">
                            <label>Employee ID <span style={{color: 'red'}}>*</span></label>
                            <input 
                                type="text" 
                                name="employeeID"
                                placeholder="Enter employee ID" 
                                value={formData.employeeID}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="ascol">
                            <label>Password <span style={{color: 'red'}}>*</span></label>
                            <input 
                                type="password" 
                                name="password" 
                                placeholder="Enter password" 
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <p className="forgotPass">Forgot Password?</p>
                        <div className="asigninBTContainer">
                            <button type="submit" className="asignInBT">
                                Sign In
                            </button>
                            <div className="privText">
                                <p>"By logging in, you agree to handle all data in accordance with the Data Privacy Act of 2012 and OLFU Confidentiality Policies.</p>
                            </div>
                        </div>
                    </div>
                        
                    </form>
                </div>
        </div>
    );
}

export default ASignIn;