import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ASignIn.css';

function ASignIn() {
    const navigate = useNavigate();
    
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        employeeID: '',
        password: '',
        rememberMe: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === "employeeID") {
            const onlyNums = value.replace(/\D/g, "");
            setFormData(prev => ({ ...prev, [name]: onlyNums }));
        } else {
            setFormData(prev => ({ 
                ...prev, 
                [name]: type === 'checkbox' ? checked : value 
            }));
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        
        // Explicitly define the URL here to bypass .env issues for this test
        const targetUrl = "http://localhost:5000/api/admin/login";
        console.log("Forcing fetch to:", targetUrl);

        try {
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            console.log("Server Response:", data);

            if (data.success) {
                sessionStorage.setItem('token', data.token);
                navigate('/dashboard');
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Fetch Catch Triggered:", error);
            alert("Catch Block Triggered: Check Console");
        }
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
                    <p className="asigninTitle">Administrative</p>
                    <p className="asigninTitle">Axis Portal</p>
                    
                    <div className="aformColumn">
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
                            <div className="apasswordWrapper">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password"
                                    placeholder="Enter your password" 
                                    value={formData.password}
                                    onChange={handleChange}
                                    required 
                                />
                                <span className="material-icons aeyeIcon" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? 'visibility' : 'visibility_off'}
                                </span>
                            </div>
                        </div>
                        <div className="aformOptions">
                            <div className="arememberMeContainer">
                                <input 
                                    type="checkbox" 
                                    name="rememberMe" 
                                    id="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                />
                                <label htmlFor="rememberMe">Remember Me</label>
                            </div>
                            <div className="aforgotPassContainer">
                                <p className="aforgotPass">Forgot Password?</p>
                            </div>
                        </div>
                        
                        <div className="asigninBTContainer">
                            <button type="submit" className="asignInBT">
                                Sign In
                            </button>
                            <div className="aprivText">
                                <p>"By logging in, you agree to handle all data in accordance with the Data Privacy Act of 2012 and Privacy Policies."</p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ASignIn;