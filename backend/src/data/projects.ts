export interface ProjectData {
  title: string;
  description: string;
  tags: string[];
  githubLink: string;
}

export const projectsData: ProjectData[] = [  // Renamed from ProjectData to projectsData
  { title: "Project 1", description: "Description for project 1", tags: ["React", "Node.js"], githubLink: "#" },
  { title: "Project 2", description: "Description for project 2", tags: ["Python", "Machine Learning"], githubLink: "#" },
  { title: "Project 3", description: "Description for project 3", tags: ["TypeScript", "Express"], githubLink: "#" },
  { title: "Project 4", description: "Description for project 4", tags: ["React", "GraphQL"], githubLink: "#" },
];
