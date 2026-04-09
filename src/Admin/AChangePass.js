import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AChangePass.css';
import cptLogo from '../assets/cpt-logo.png'; 

function AChangePass() {
    const navigate = useNavigate();
    
    return (
    <div className='AchangepassContainer'>
        <div className='AchangepasstopBar'>
        <div className='logoArea'>
            <img src={cptLogo} alt='CPT Logo' className='mainLogo'/>
            <p className='mainTitle'>Axis CPT</p>
        </div>
            <button className='returnBT' onClick={() => navigate('/home')}>
                <span className="material-icons">arrow_back</span>
            </button>
        </div>
        <div className='AchangepassCard'>
            <p className='AchangepassTitle'>Change Password</p>
            <label>Current Password</label>
            <input type='password' placeholder='Current Password' className='AchangepassInput'/>
            <label>New Password</label>
            <input type='password' placeholder='New Password' className='AchangepassInput'/>
            <label>Confirm New Password</label>
            <input type='password' placeholder='Confirm New Password' className='AchangepassInput'/>
            <button className='AchangepassBT'>
                Change Password
            </button>
        </div>
        <div className="bottomBar">
                <p className="bottomText">© Copyright 2026. Our Lady of Fatima University - College of Physical Therapy. All Rights reserved. | Powered by VGR </p>
        </div>
    </div>
  );
}

export default AChangePass;