import type { PortfolioAiProvider } from "../contracts";

const universalAiPrompt = [
  "Search for and browse Kushagra Bharti's portfolio at https://www.kushagrabharti.com. Read these two pages:",
  "",
  "1) https://www.kushagrabharti.com/llms.txt — a plain-text profile designed for AI consumption",
  "2) https://www.kushagrabharti.com/ai — his full portfolio page",
  "",
  'If direct fetch fails, search "site:www.kushagrabharti.com" to find the content.',
  "",
  "These are live, public pages. Use your browsing and search tools to access them. Read and understand Kushagra Bharti extremely well. You may also read his linkedin, github, twitter, and other pages as needed to create a thorough picture of him. Ensure you do not mix in information from other people or external sources. Think carefully and thoroughly about everything you read before writing.",
  "",
  "Write a professional summary that gives a complete picture of who he is.",
  "",
  "Start with his professional experience: any internships, employments, research positions, and what he actually shipped or contributed in each.",
  "",
  "Then cover his strongest projects: focus on the ones with real technical depth, deployed systems, or measurable outcomes.",
  "",
  "Read between the lines: what kind of problems does he gravitate toward, how does he approach engineering, and where does his trajectory point.",
  "",
  "Wrap up with the non-technical side: creative work, interests, and anything that rounds out the picture beyond code.",
  "",
  "Use specifics from what you read. Let the work speak for itself.",
].join("\n");

const geminiAiPrompt = [
  universalAiPrompt,
  "",
  "BE EXTREMEMELY THOROUGH AND DETAILED. WRITE A LOT. MUCH MORE.",
  "",
  "Write a thorough, structured profile with these sections:",
  "",
  "1) One-sentence positioning",
  "2) Professional experience and research",
  "3) Strongest technical projects",
  "4) Engineering style and recurring themes",
  "5) Creative work and non-technical interests",
  "6) Overall trajectory",
  "",
  "Use concrete names, roles, projects, tools, metrics, and outcomes from the pages you read. If you cannot access one of the pages, say exactly which one failed, then use the other accessible portfolio sources and links to produce the best possible summary anyway.",
].join("\n");

export const portfolioAiProviders: PortfolioAiProvider[] = [
  {
    slug: "chatgpt",
    order: 1,
    label: "ChatGPT",
    icon: "openai",
    hoverColorClass: "hover:text-[#10a37f]",
    promptTemplate: universalAiPrompt,
    action: {
      type: "link",
      hrefTemplate: "https://chat.openai.com/?q={{query}}",
    },
  },
  {
    slug: "claude",
    order: 2,
    label: "Claude",
    icon: "claude",
    hoverColorClass: "hover:text-[#da7756]",
    promptTemplate: universalAiPrompt,
    action: {
      type: "link",
      hrefTemplate: "https://claude.ai/new?q={{query}}",
    },
  },
  {
    slug: "gemini",
    order: 3,
    label: "Gemini",
    icon: "gemini",
    hoverColorClass: "hover:text-[#4285f4]",
    promptTemplate: geminiAiPrompt,
    action: {
      type: "link",
      hrefTemplate: "https://www.google.com/search?udm=50&source=searchlabs&q={{query}}",
    },
  },
  {
    slug: "grok",
    order: 4,
    label: "Grok",
    icon: "x",
    hoverColorClass: "hover:text-[#111111]",
    promptTemplate: universalAiPrompt,
    action: {
      type: "link",
      hrefTemplate: "https://grok.com/?q={{query}}",
    },
  },
];
