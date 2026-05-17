import React from 'react';
import ADocumentLayout from '../AComponents/ADocumentLayout';
import TermGrade from '../../Components/TermGrade'; 

function ATermGrade() {
  return (
    <ADocumentLayout 
      title="Term Grade" 
      basePath="/admin/documents/term-grade"
    >
      <TermGrade adminMode={true} />
    </ADocumentLayout>
  );
}

export default ATermGrade;