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

  const EducationCard: React.FC<EducationData> = ({ dateRange, position, focus, description, schoolLink }) => {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center py-6 border-b border-gray-700">
        <div className="text-gray-400 text-sm font-medium sm:w-1/4">
          {dateRange}
        </div>
        <div className="sm:w-3/4">
          <h3 className="text-lg font-semibold">
            <a
              href={schoolLink}
              className="text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >{position} <span aria-hidden="true">↗</span>
            </a>
          </h3>
          <h4 className="text-md font-medium text-gray-300 mt-1">{focus}</h4>
          <p className="text-gray-500 mt-2">{description}</p>
        </div>
      </div>
    );
  };

  return (
    <section className="flex flex-col items-center mt-10 px-4 md:px-10 lg:px-24">
      <h2 className="text-3xl font-bold mb-10 text-gray-100">Education</h2>
      <div className="w-full max-w-2xl">
        {education.map((education, index) => (
          <EducationCard key={index} {...education} />
        ))}
      </div>
    </section>
  );
};

export default Education;
