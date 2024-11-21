import React, { useEffect, useState } from "react";
import axios from "axios";
import { EducationData } from "../../../backend/src/data/education";

const Education: React.FC = () => {
  const [education, setEducation] = useState<EducationData[]>([]);

  const BASE_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_BASE_URL_DEV
  : import.meta.env.VITE_API_BASE_URL;


  useEffect(() => {
    const fetchEducation = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/education`);
        setEducation(response.data);
      } catch (error) {
        console.error("Error fetching education:", error);
      }
    };

    fetchEducation();
  }, []);

  return (
    <section className="py-16">
      <div className="container mx-auto">
        <h2 className="section-heading">Education</h2>
        <div className="grid gap-8 md:grid-cols-2">
          {education.map((edu, index) => (
            <div key={index} className="card flex flex-col items-center text-center">
              <div className="flex items-center justify-center space-x-2">
                <h3 className="text-xl text-primary font-sans" >{edu.position}</h3>
                <a
                  href={edu.schoolLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-dark"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 2 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                </a>
              </div>
              <p className="text-gray-700 mt-2">{edu.focus}</p>
              <span className="text-sm text-gray-500">{edu.dateRange}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
  
  
export default Education;
