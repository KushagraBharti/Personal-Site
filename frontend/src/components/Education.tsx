import React, { useEffect, useState } from "react";
import axios from "axios";
import { EducationData } from "../../../backend/src/data/education";

const Education: React.FC = () => {
  const [education, setEducation] = useState<EducationData[]>([]);

  useEffect(() => {
    const fetchEducation = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/education");
        setEducation(response.data);
      } catch (error) {
        console.error("Error fetching education:", error);
      }
    };

    fetchEducation();
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto">
        <h2 className="text-3xl font-playfair text-center text-dark mb-10">
          Education
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          {education.map((edu, index) => (
            <div key={index} className="card">
              <h3 className="text-lg font-bold">{edu.position}</h3>
              <p className="text-secondary">{edu.focus}</p>
              <span className="text-sm text-gray-500">{edu.dateRange}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Education;
