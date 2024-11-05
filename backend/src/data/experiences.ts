export interface ExperienceData {
    position: string;
    description: string;
    tags: string[];
    companyLink: string;
  }
  
  export const experiencesData: ExperienceData[] = [
    { position: "Experience 1", description: "Description for experience 1", tags: ["React", "Node.js"], companyLink: "#" },
    { position: "Experience 2", description: "Description for experience 2", tags: ["Python", "Machine Learning"], companyLink: "#" },
    { position: "Experience 3", description: "Description for experience 3", tags: ["TypeScript", "Express"], companyLink: "#" },
    { position: "Experience 4", description: "Description for experience 4", tags: ["React", "GraphQL"], companyLink: "#" },
  ];
  