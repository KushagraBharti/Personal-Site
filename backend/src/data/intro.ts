export interface IntroData {
    personalPhoto: string; /* not used bcuz not needed in frontend */
    latestUpdate: string;
    funFact: string;
    featuredBlog: {
      title: string;
      link: string;
    };
    aiProjects: string[];
    travelPlans: string;
  }
  
  // Local data that doesn’t need an external API
  export const introStaticData: IntroData = {
    
    personalPhoto: "/SelfPic.jpg",
    
    latestUpdate: "Currently applying for Summer 2025 internships and leetcoding!",
    
    funFact: "A film I made was screened at AMC Theatres in Times Square!",
    
    featuredBlog: {
      title: "The Trillion Dollar AI Software Development Stack",
      link: "https://a16z.com/the-trillion-dollar-ai-software-development-stack/",
    },
    
    aiProjects: ["Pseudo-Lawyer", "CircuitSeer", "DataDrive"],
    
    travelPlans: "Visiting Home for summer break!",
  };
  