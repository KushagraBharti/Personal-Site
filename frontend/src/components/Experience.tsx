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

  const ExperienceCard: React.FC<ExperienceData> = ({ position, description, tags, companyLink }) => {
    return (
      <div className="border p-4 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold">{position}</h3>
        <p className="mt-2 text-gray-600">{description}</p>
        <div className="flex flex-wrap mt-4 space-x-2">
          {tags.map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-gray-200 rounded-full text-sm text-gray-700">
              {tag}
            </span>
          ))}
        </div>
        <a
          href={companyLink}
          className="inline-block mt-4 text-blue-500 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          View Company
        </a>
      </div>
    );
  };

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold mb-4">Experiences</h2>
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {experiences.map((experience, index) => (
          <ExperienceCard key={index} {...experience} />
        ))}
      </div>
    </section>
  );
};

export default Experiences;