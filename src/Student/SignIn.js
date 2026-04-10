import React from 'react';
import './SignIn.css';

function SignIn() {
  return (
    <div className="signinContainer">
        <div className="signin-lcontainer">
            <p className="asigninText">
                        <span>Have Trouble Signing In? </span>
                        <b>Contact CPT Administrator.</b>
                    </p>
            <div className="signin-form">
                <p className="signin-title">Student Axis Portal</p>
            </div>
        </div>
        <div className="signin-rcontainer">
            <div className="signin-rcard">
            </div>
        </div>
    </div>
  );
}

export default SignIn;