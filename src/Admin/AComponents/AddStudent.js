import React, { useState, useEffect, useRef } from "react";
import ReactDOM from 'react-dom';
import '../../GlobalForm.css'
import '../../GlobalOverlay.css';
import '../../Global.css';

function AddStudent({ onClose, onSuccess, studentToEdit = null }) {
  const [studentName, setStudentName] = useState("");
  const [studentID, setStudentID] = useState("");
  const [program, setProgram] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [isActive, setIsActive] = useState(true);

} 

export default AddStudent;