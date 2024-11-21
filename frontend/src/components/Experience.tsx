import React, { useEffect, useState } from "react";
import axios from "axios";
import { ExperienceData } from "../../../backend/src/data/experiences";

const Experiences: React.FC = () => {
  const [experiences, setExperiences] = useState<ExperienceData[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceData | null>(null);

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
        const response = await axios.get(`${apiBaseUrl}/api/experiences`);
        setExperiences(response.data);
      } catch (error) {
        console.error("Error fetching experiences:", error);
      }
    };

    fetchExperiences();
  }, []);

  const handleCardClick = (experience: ExperienceData) => {
    setSelectedExperience(experience);
  };

  const closePopup = () => setSelectedExperience(null);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closePopup();
  };

  return (
    <section className="py-16">
      <div className="container mx-auto">
        <h2 className="section-heading">Experiences</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
          {experiences.map((experience, index) => (
            <div
              key={index}
              className="card cursor-pointer"
              onClick={() => handleCardClick(experience)}
            >
              <div className="flex items-center space-x-2 justify-center">
                <h3 className="text-xl text-primary font-sans">{experience.position}</h3>
                <a
                  href={experience.companyLink}
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
              <p className="text-gray-600 mt-2 text-center">{experience.summary}</p>
            </div>
          ))}
        </div>
      </div>
  
      {selectedExperience && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
          onClick={handleOverlayClick}
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={closePopup}
            >
              ✖
            </button>
            <h3 className="text-2xl font-bold text-primary mb-4">{selectedExperience.position}</h3>
            <p className="text-gray-600 mb-4">{selectedExperience.summary}</p>
            <ul className="mb-4 space-y-2 text-left list-disc pl-5">
              {selectedExperience.description.map((item, index) => (
                <li key={index} className="text-gray-700">
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              {selectedExperience.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-200 text-sm text-gray-700 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};  

export default Experiences;
