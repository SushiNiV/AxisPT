  import React from 'react';
  import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

  import Home from './Main/Home';

  import SignIn from './Student/SignIn';
  import Registration from './Main/Registration';
  import SChangePass from './Student/SChangePass';
  import SDashboard from './Student/SDashboard';

  import ASignIn from './Admin/ASignIn';
  import ADashboard from './Admin/ADashboard';

  import AStudentManage from './Admin/AStudentManage';
  import AMasterlist from './Admin/APages/AMasterlist';
  import APendingStudents from './Admin/APages/APendingStudents';
  import ATermGrade from './Admin/APages/ATermGrade';
  import AGrades from './Admin/APages/AGrades';

  import AAcademics from './Admin/AAcademics';
  import AProgSec from './Admin/APages/AProgSec'
  import ACourses from './Admin/APages/ACourses';
  import ACurricula from './Admin/APages/ACurricula';


  import ADocuments from './Admin/ADocuments';
  import AStudentForm  from './Admin/APages/AStudentForm';
  import ACourseOutline from './Admin/APages/ACourseOutline';


  import AAccessCtrl from './Admin/AAccessCtrl';
  import AAcadYear from './Admin/APages/AAcadYear';

  import AHistory from './Admin/AHistory';

  import ChangePass from './Admin/AChangePass';

  import ProtectedRoute from './Components/ProtectedRoute';
  import ALayout from './Admin/AComponents/ALayout';
  import SLayout from './Student/SComponents/SLayout';

  import StudentForm from './Components/StudentForm'
  import TermGrade from './Components/TermGrade';
  import CourseOutline from './Components/CourseOutline';
  import Sample from './Sample'


  function App() {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/admin-signin" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/student-form" element={<StudentForm />} />
          <Route path="/course-outline" element={<CourseOutline />} />
          <Route path="/term-grade" element={<TermGrade />} />
          <Route path="/sample" element={<Sample />} />

          {/* ADMIN */}
          <Route path="/admin-signin" element={<ASignIn />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<ALayout />}>
              <Route path="/admin/dashboard" element={<ADashboard />} />
              <Route path="/admin/student-management" element={<AStudentManage />}>
                <Route index element={<Navigate to="masterlist" replace />} />
                <Route path="masterlist" element={<AMasterlist />} />
                <Route path="pending-students" element={<APendingStudents />} />
                <Route path="student-grades" element={<AGrades />} />
              </Route>
              <Route path="/admin/academics" element={<AAcademics />} >
                <Route index element={<Navigate to="programs&sections" replace />} />
                <Route path="programs&sections" element={<AProgSec />} />
                <Route path="courses" element={<ACourses />} />
              </Route>

              <Route path="/admin/documents" element={<ADocuments />} >
                <Route path="student-form/:studentId?" element={<AStudentForm/>}/>
                <Route path="course-outline/:studentId?" element={<ACourseOutline />} />
                <Route path="term-grade/:studentId?" element={<ATermGrade />} />
              </Route>

              <Route path="/admin/access-control" element={<AAccessCtrl />} >
                <Route index element={<Navigate to="" replace />} />
                <Route path="academic-year" element={<AAcadYear />} />
                <Route path="curricula" element={<ACurricula />} />
              </Route>

              <Route path="admin/history" element={<AHistory />} >
              
              </Route>
            </Route>
            
          </Route> 

          <Route path="/change-password" element={<ChangePass />} />  

          {/* STUDENT */}
          <Route path="/registration" element={<Registration />} />

          <Route path="/signin" element={<SignIn />} />
          <Route element={<ProtectedRoute/>}>
            <Route element={<SLayout />}>
              <Route path="/student/dashboard" element={<SDashboard/>} />
            </Route> 
            <Route path="/student-change-password" element={<SChangePass/>}/>
          </Route>
  
        </Routes>
      </Router>
    );
  }

  export default App;