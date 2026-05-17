import React from 'react';
import './Review.css';

const Review = ({ formData }) => {

  const reviewSections = [
  {
    title: "Personal Information",
    fields: [
      { label: "Full Name", value: `${formData.firstName} ${formData.middleName} ${formData.lastName} ${formData.suffix}` },
      { label: "Sex", value: formData.sex },
      { label: "Date of Birth", value: formData.dateOfBirth },
      { label: "Place of Birth", value: formData.placeOfBirth },
      { label: "Email", value: formData.email },
      { label: "Phone", value: formData.phoneNumber },
      { label: "Landline", value: formData.landline },
      { label: "Religion", value: formData.religion},
      { label: "Nationality", value: formData.nationality},
      { label: "Civil Status", value: formData.civilStatus},
      { label: "Height", value: formData.height },
      { label: "Weight", value: formData.weight },
      { label: "Language/Dialect", value: formData.language },
      { label: "Visual Problem", value: formData.visualProblems },
      { label: "Permanent Address", value: `${formData.permHouseNo} ${formData.permStreet} ${formData.permSubdivision} ${formData.permCity}` },
      { label: "PROVINCIAL ADDRESS", 
        value: formData.sameAsPermanent 
          ? `${formData.permHouseNo} ${formData.permStreet} ${formData.permSubdivision} ${formData.permCity}` 
          : `${formData.provHouseNo} ${formData.provStreet} ${formData.provSubdivision} ${formData.provCity}` },
    ]
  },
  {
    title: "Program and Education",
    fields: [
      { label: "Program", value: formData.program },
      { label: "Year Level", value: formData.yearLevel },
      { label: "Classification", value: formData.classification },
      { label: "High School Graduated", value: formData.highschoolGraduated },
      { label: "Private or Public", value: formData.pubprivHS },
      { label: "School Address", value: formData.schoolAddress },
      { label: "4th Year High School Final GWA", value: formData.hsFinalGWA },
    ]
  },
  {
    title: "Family Information",
    fields: [
      { label: "Father Full Name", value: formData.fatherName },
      { label: "Status", value: formData.fatherStatus },
      { label: "Occupation", value: formData.classification },
      { label: "Contact Number", value: formData.highschoolGraduated },
      { label: "Mother Full Name", value: formData.pubprivHS },
      { label: "Status", value: formData.motherStatus },
      { label: "Occupation", value: formData.hsFinalGWA },
      { label: "Contact Number", value: formData.hsFinalGWA },
    ]
  }
];

  return (
    <div className="slides">
      <h1 className="enrollmentTitle">Review & Submit</h1>
      <p className="enrollmentText">Please verify your information before submitting.</p>

      {reviewSections.map((section, sIdx) => (
        <div key={sIdx} className="reviewSectionWrapper">
          <h2 className="enrollmentSubtitle">{section.title}</h2>
          
          {section.fields.map((field, fIdx) => (
            <div className="reviewRow" key={fIdx}>
              <div className="reviewCol">
                <label className="reviewLabel">{field.label}:</label>
              </div>
              <div className="reviewCol">
                <span className="reviewValue">{field.value || "N/A"}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Review;