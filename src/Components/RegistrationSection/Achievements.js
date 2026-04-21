import React from 'react';
import './Achievements.css';

const Achievements = ({ formData, handleChange, errors }) => {
  return (
    <div className="slides">
      <h1 className="enrollmentTitle">Achievements and Interests</h1>
      
      <h2 className="enrollmentSubtitle">Achievements</h2>
      <div className="row">
        <div className="col">
          <label>AWARDS / HONORS RECEIVED <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="awards"
            placeholder="Enter your awards and honors received..." 
            value={formData.awards}
            onChange={handleChange}
            className={errors.awards ? "input-error" : ""}
            required
          />
          {errors.awards && <span className="error-text">{errors.awards}</span>}
        </div>
      </div>

      <h2 className="enrollmentSubtitle">Hobbies and Interests</h2>
      <div className="row">
        <div className="col">
          <label>HOBBIES / SPORTS / INTERESTS <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="interests"
            placeholder="Enter your hobbies, sports, and interests..." 
            value={formData.interests}
            onChange={handleChange}
            className={errors.interests ? "input-error" : ""}
            required
          />
          {errors.interests && <span className="error-text">{errors.interests}</span>}
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label>WHAT CAREER / WORK DO YOU REALLY LIKE TO PURSUE? <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="careerGoal"
            placeholder="Enter the career or work you really like to pursue..." 
            value={formData.careerGoal}
            onChange={handleChange}
            className={errors.careerGoal ? "input-error" : ""}
            required
          />
          {errors.careerGoal && <span className="error-text">{errors.careerGoal}</span>}
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label>WHAT ACADEMIC CLUB OR EXTRACURRICULAR ACTIVITIES DO YOU WANT TO JOIN? <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            name="extracurricular"
            placeholder="Enter academic clubs or extracurricular activities you want to join..." 
            value={formData.extracurricular}
            onChange={handleChange}
            className={errors.extracurricular ? "input-error" : ""}
            required
          />
          {errors.extracurricular && <span className="error-text">{errors.extracurricular}</span>}
        </div>
      </div>
      
    </div>
  );
};

export default Achievements;