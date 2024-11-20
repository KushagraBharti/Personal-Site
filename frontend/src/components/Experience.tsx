import React, { useEffect, useState } from "react";
import axios from "axios";
import { ExperienceData } from "../../../backend/src/data/experiences";

const Experiences: React.FC = () => {
  const [experiences, setExperiences] = useState<ExperienceData[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceData | null>(null);

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/experiences`);
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
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto">
        <h2 className="section-heading">Experiences</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {experiences.map((experience, index) => (
            <div
              key={index}
              className="card cursor-pointer"
              onClick={() => handleCardClick(experience)}
            >
              <h3 className="text-lg font-bold text-primary">{experience.position}</h3>
              <p className="text-gray-600 mt-2">{experience.summary}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedExperience && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
          onClick={handleOverlayClick}
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={closePopup}
            >
              ✖
            </button>
            <h3 className="text-xl font-bold text-primary mb-4">{selectedExperience.position}</h3>
            <p className="text-gray-600 mb-4">{selectedExperience.summary}</p>
            <ul className="mb-4 space-y-2">
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
