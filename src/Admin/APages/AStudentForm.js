import React from 'react';
import ADocumentLayout from '../AComponents/ADocumentLayout';
import StudentForm from '../../Components/StudentForm'; 

function AStudentForm() {
  return (
    <ADocumentLayout 
      title="Student Form" 
      basePath="/admin/documents/student-form"
    >
      <StudentForm adminMode={true} />
    </ADocumentLayout>
  );
}

export default AStudentForm;