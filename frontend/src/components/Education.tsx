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

  const EducationCard: React.FC<EducationData> = ({ position, focus, description, schoolLink }) => {
    return (
      <div className="border p-4 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold">
          <a 
            href={schoolLink}
            className="text-blue-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            >{position}
          </a>
        </h3>
        <h4 className="text-xl font-semibold">{focus}</h4>
        <p className="text-gray-600 mt-1">{description}</p>
      </div>
    );
  };

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold mb-4">Education</h2>
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {education.map((education, index) => (
          <EducationCard key={index} {...education} />
        ))}
      </div>
    </section>
  );
};

export default Education;