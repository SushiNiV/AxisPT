import React from 'react';
import ADocumentLayout from '../AComponents/ADocumentLayout';
import CourseOutline from '../../Components/CourseOutline'; 

function ACourseOutline() {
  return (
    <ADocumentLayout 
      title="Course Outline" 
      basePath="/admin/documents/course-outline" 
    >
      <CourseOutline adminMode={true} />
    </ADocumentLayout>
  );
}
export default ACourseOutline;