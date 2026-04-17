import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ADashboard.css';

function ADashboard() {
  return (
    <div className="adashboardContainer">
      <div className="wcMessageArea">
        <p>Welcome, Ma'am Admin!</p>
      </div>
    </div>
  );
}

export default ADashboard;