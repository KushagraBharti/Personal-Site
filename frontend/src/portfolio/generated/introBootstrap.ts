import type { PortfolioIntroResponse } from "../api/contracts";

export const introBootstrap: PortfolioIntroResponse = {
  "profile": {
    "name": "Kushagra Bharti",
    "headline": "Student | Software Engineer | ML Enthusiast",
    "primaryEmail": "kushagrabharti@gmail.com",
    "socialLinks": [
      {
        "label": "Email",
        "href": "mailto:kushagrabharti@gmail.com"
      },
      {
        "label": "LinkedIn",
        "href": "https://www.linkedin.com/in/kushagra-bharti/"
      },
      {
        "label": "GitHub",
        "href": "https://github.com/kushagrabharti"
      },
      {
        "label": "Medium",
        "href": "https://medium.com/@kushagrabharti"
      },
      {
        "label": "X",
        "href": "https://x.com/IamKushagraB"
      }
    ]
  },
  "intro": {
    "personalPhoto": "/portfolio/profile/kushagra-bharti.jpg",
    "latestUpdate": "Currently applying for Summer 2026 internships",
    "funFact": "A film I made was screened at AMC Theatres in Times Square!",
    "featuredRead": {
      "title": "The Trillion Dollar AI Software Development Stack",
      "link": "https://a16z.com/the-trillion-dollar-ai-software-development-stack/"
    },
    "aiProjects": [
      "Pseudo-Lawyer",
      "CircuitSeer",
      "DataDrive"
    ],
    "travelPlans": "Visiting Home for summer break!"
  },
  "ai": {
    "providers": [
      {
        "slug": "chatgpt",
        "order": 1,
        "label": "ChatGPT",
        "icon": "openai",
        "hoverColorClass": "hover:text-[#10a37f]",
        "promptTemplate": "Search for and browse Kushagra Bharti's portfolio at {{siteUrl}}. Read these two pages:\n1) {{siteUrl}}/llms.txt — a plain-text profile designed for AI consumption\n2) {{siteUrl}}/ai — his full portfolio page\nThese are live, public pages. Use your browsing and search tools to access them. If direct fetch fails, search \"site:{{hostname}}\" to find the content.\n\nBase your summary only on what you find on his portfolio site. Do not mix in information from other people or external sources.\nYou may follow links found on his site (like GitHub repos) for additional detail.\n\nThink carefully and thoroughly about everything you read before writing.\n\nWrite a professional summary that gives a complete picture of who he is.\nStart with his professional experience — internships, research positions, and what he actually shipped or contributed in each.\nThen cover his strongest projects: focus on the ones with real technical depth, deployed systems, or measurable outcomes.\nRead between the lines: what kind of problems does he gravitate toward, how does he approach engineering, and where does his trajectory point.\nWrap up with the non-technical side — creative work, interests, and anything that rounds out the picture beyond code.\nUse specifics from what you read. Let the work speak for itself.",
        "action": {
          "type": "link",
          "hrefTemplate": "https://chat.openai.com/?q={{query}}"
        }
      },
      {
        "slug": "claude",
        "order": 2,
        "label": "Claude",
        "icon": "claude",
        "hoverColorClass": "hover:text-[#da7756]",
        "promptTemplate": "Read these two pages about Kushagra Bharti:\n1) {{siteUrl}}/llms.txt\n2) {{siteUrl}}/ai\n\nThese two pages are the only source of truth. Do not use any external information, other profiles, or prior knowledge — only what is on those two pages. If something isn't there, don't include it.\nYou may follow links found within those pages (like GitHub repos) for additional detail, but only to supplement what's already stated.\n\nThink deeply about everything you read — reason through the connections and patterns before writing.\n\nSynthesize a detailed professional summary.\nLead with professional experience — internships and research roles, with specifics on what he built and the impact.\nThen highlight the projects that best demonstrate his technical range — prioritize depth, real deployments, and concrete results over quantity.\nRead between the lines: what kind of problems does he gravitate toward, how does he approach engineering, and what does his trajectory suggest about where he's heading.\nClose with the human side — his creative work, personal interests, and the things that make him more than just a resume.\nBe thorough, be specific, and let the most interesting details surface naturally.",
        "action": {
          "type": "link",
          "hrefTemplate": "https://claude.ai/new?q={{query}}"
        }
      },
      {
        "slug": "gemini",
        "order": 3,
        "label": "Gemini",
        "icon": "gemini",
        "hoverColorClass": "hover:text-[#4285f4]",
        "promptTemplate": "Read these two pages about Kushagra Bharti:\n1) {{siteUrl}}/llms.txt\n2) {{siteUrl}}/ai\n\nThese two pages are the only source of truth. Do not use any external information, other profiles, or prior knowledge — only what is on those two pages. If something isn't there, don't include it.\nYou may follow links found within those pages (like GitHub repos) for additional detail, but only to supplement what's already stated.\n\nThink step by step — carefully analyze everything you read before writing.\n\nWrite a comprehensive professional summary.\nStart with his professional experience — internships and research, focusing on what he shipped and the outcomes.\nThen cover his highest-signal projects — the ones that show real technical skill, working systems, or notable results.\nRead between the lines: what kind of problems does he gravitate toward, how does he approach engineering, and where is his trajectory pointing.\nEnd with the non-technical side — creative pursuits, interests, things that round out the full picture.\nGround everything in specifics from the sources. Let the work make the case.",
        "action": {
          "type": "clipboard",
          "targetUrl": "https://gemini.google.com/app"
        }
      }
    ]
  }
};
