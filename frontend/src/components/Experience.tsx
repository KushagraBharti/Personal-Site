import React, { useEffect, useState } from "react";
import axios from "axios";
import { ExperienceData } from "../../../backend/src/data/experiences";

const Experiences: React.FC = () => {
  const [experiences, setExperiences] = useState<ExperienceData[]>([]);

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/experiences");
        setExperiences(response.data);
      } catch (error) {
        console.error("Error fetching experiences:", error);
      }
    };

    fetchExperiences();
  }, []);

  const ExperienceCard: React.FC<ExperienceData> = ({ position, summary, description, tags, companyLink }) => {
    return (
      <div className="card">
        <h3 className="text-xl font-semibold">
          <a href={companyLink} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            {position}
          </a>
        </h3>
        <p className="text-secondary mt-2">{summary}</p>
        <ul className="mt-2 list-disc list-inside">
          {description.map((item, index) => (
            <li key={index} className="text-gray-500 mt-1">{item}</li>
          ))}
        </ul>
        <div className="flex flex-wrap mt-4 space-x-2">
          {tags.map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-gray-200 rounded-full text-sm text-gray-700">{tag}</span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="mt-10">
      <h2 className="section-heading">Experiences</h2>
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {experiences.map((experience, index) => (
          <ExperienceCard key={index} {...experience} />
        ))}
      </div>
    </section>
  );
};

export default Experiences;
