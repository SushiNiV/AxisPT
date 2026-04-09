import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ASignIn.css';

function ASignIn() {
    const navigate = useNavigate();
    
    const [showPassword, setShowPassword] = useState(false);

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

    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('http://127.0.0.1:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('employeeID', formData.employeeID);
                sessionStorage.setItem('userName', data.user);

                if (data.mustChangePassword) {
                    navigate('/admin-change-password');
                } else {
                    navigate('/dashboard');
                }
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Error logging in:", error);
            alert("Could not connect to the server. Make sure your Node.js backend is running on port 5000.");
        }
    };

    return (
        <div className="asigninContainer">
            <div className="asigninLcard">
                <div className="brandingContent"></div>
            </div>

            <div className="asigninRcontainer">
                <div className="asignintopBar">
                    <p className="asigninText">
                        <span>Have Trouble Signing In? </span>
                        <b>Contact CPT Administrator.</b>
                    </p>
                </div>

                <form className="asigninForm" onSubmit={handleLogin}>
                    <p className="asigninTitle">Administrative</p>
                    <p className="asigninTitle">Axis Portal</p>
                    
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
                            <div className="password-wrapper">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password"
                                    placeholder="Enter your password" 
                                    value={formData.password}
                                    onChange={handleChange}
                                    required 
                                />
                                <span className="material-icons eye-icon" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? 'visibility' : 'visibility_off'}
                                </span>
                            </div>
                        </div>

                        <p className="forgotPass">Forgot Password?</p>
                        
                        <div className="asigninBTContainer">
                            <button type="submit" className="asignInBT">
                                Sign In
                            </button>
                            <div className="privText">
                                <p>"By logging in, you agree to handle all data in accordance with the Data Privacy Act of 2012 and OLFU Confidentiality Policies."</p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ASignIn;