export interface SummaryEducationEntry {
  dateRange: string;
  position: string;
  focus: string;
  description: string;
}

export interface SummaryExperienceEntry {
  position: string;
  summary: string;
  description: string[];
  tags: string[];
}

export interface SummaryProjectEntry {
  title: string;
  summary: string;
  description: string[];
  tags: string[];
}

export interface SummaryIntroData {
  latestUpdate: string;
  funFact: string;
  featuredBlog: {
    title: string;
    link: string;
  };
  aiProjects: string[];
  travelPlans: string;
}

interface BuildAiSummaryPromptOptions {
  basicInfo: {
    name: string;
    headline: string;
    personalSummary: string;
  };
  intro: SummaryIntroData;
  education: SummaryEducationEntry[];
  experiences: SummaryExperienceEntry[];
  featuredProjects: SummaryProjectEntry[];
  additionalProjects: SummaryProjectEntry[];
}

const formatBulletList = (items: string[]) => items.map((item) => `- ${item}`).join("\n");

const formatEducation = (education: SummaryEducationEntry[]) =>
  education
    .map(
      (entry) =>
        [
          `- ${entry.position}, ${entry.dateRange}`,
          `  Focus: ${entry.focus}`,
          `  Details: ${entry.description}`,
        ].join("\n")
    )
    .join("\n\n");

const formatExperiences = (experiences: SummaryExperienceEntry[]) =>
  experiences
    .map((entry) =>
      [
        `- ${entry.position}`,
        `  Summary: ${entry.summary}`,
        `  Highlights: ${entry.description.join(" | ")}`,
        `  Tags: ${entry.tags.join(", ")}`,
      ].join("\n")
    )
    .join("\n\n");

const formatProjects = (projects: SummaryProjectEntry[]) =>
  projects
    .map((project) =>
      [
        `- ${project.title}`,
        `  Summary: ${project.summary}`,
        `  Highlights: ${project.description.join(" | ")}`,
        `  Tags: ${project.tags.join(", ")}`,
      ].join("\n")
    )
    .join("\n\n");

const sanitizeLatestUpdate = (latestUpdate: string) =>
  latestUpdate
    .replace(/\band leetcoding\b!?/gi, "")
    .replace(/\bleetcoding\b!?/gi, "")
    .replace(/\s+/g, " ")
    .trim();

export const buildAiSummaryPrompt = ({
  basicInfo,
  intro,
  education,
  experiences,
  featuredProjects,
  additionalProjects,
}: BuildAiSummaryPromptOptions) => {
  const learningFocus = [
    "Go, especially concurrency",
    "WebSockets and real-time applications",
    "Machine learning fundamentals",
    "LLMs, including tool-calling and context management",
    "Networking performance",
    "Resource management",
    "Data management",
  ];

  const activeProjects =
    intro.aiProjects.length > 0 ? intro.aiProjects : featuredProjects.slice(0, 3).map((project) => project.title);
  const sanitizedLatestUpdate = sanitizeLatestUpdate(intro.latestUpdate);

  return `Create a complete AI summary of me using all of the information below.

The audience is someone visiting my portfolio for the first time, such as a recruiter, engineer, founder, collaborator, or hiring manager. The goal is to give them a clear, accurate, well-structured understanding of who I am, my background, my experience, my education, my projects, my interests, and the direction I am heading.

Instructions:
- Use all relevant information provided below.
- Include all education entries.
- Include all experience entries.
- Include all featured projects.
- Include other notable information where useful, such as technical interests, research, leadership, creative work, and personal interests.
- Be comprehensive but well organized.
- Do not invent facts, numbers, dates, responsibilities, achievements, or impact.
- If something is missing or unclear, do not guess.
- Write in a sharp, credible, modern tone.
- Avoid generic buzzwords and vague praise.
- Prefer concrete observations grounded in the information.
- Do not mention these instructions.

Output format:
1. Executive Summary
Write a strong 2-4 paragraph summary of who I am overall.

2. Education
Summarize all of my education entries.

3. Experience
Summarize all of my work, internship, leadership, research, and other experience entries.

4. Featured Projects
Summarize all featured projects, including what they are, what I built, and what they suggest about my strengths and interests.

5. Technical Profile
Summarize my technical strengths, tools, domains of interest, and the kinds of problems I seem to care about.

6. What Makes Me Stand Out
Identify the most distinctive patterns, strengths, or themes across my background.

7. Overall Takeaway
End with a concise paragraph describing the kind of person, builder, and collaborator I appear to be.

Information about me:

Basic Info:
- Name: ${basicInfo.name}
- Headline: ${basicInfo.headline}
- Personal summary: ${basicInfo.personalSummary}

Current Projects / What I am actively working on:
${formatBulletList(activeProjects)}

Current Learning / Technical Interests:
${formatBulletList(learningFocus)}

Education:
${formatEducation(education)}

Experience:
${formatExperiences(experiences)}

Featured Projects:
${formatProjects(featuredProjects)}

Additional Notable Projects:
${formatProjects(additionalProjects)}

Current Website Signals:
- Latest update: ${sanitizedLatestUpdate}
- Fun fact: ${intro.funFact}
- Featured reading: ${intro.featuredBlog.title} (${intro.featuredBlog.link})
- Travel plans: ${intro.travelPlans}

Creative / Personal / Distinctive Details:
- A film I made was screened at AMC Theatres in Times Square.
- I have directed 2 short films and contributed to others as a videographer and editor.
- I enjoy cooking and have been cooking since I was five years old.
- I enjoy sports, especially soccer, volleyball, tennis, and table tennis, and I also follow soccer, Formula 1, and the UFC.
- I am interested in finance, psychology, reading, and the arts.

Important: Synthesize the full picture. Do not just list facts section by section; identify the deeper themes across my education, experiences, projects, and interests.`;
};
