import type { PortfolioIntroResponse } from "../api/contracts";

export const introBootstrap: PortfolioIntroResponse = {
  "profile": {
    "name": "Kushagra Bharti",
    "headline": "Student | Software Engineer | ML Enthusiast",
    "primaryEmail": "kbharti.work@gmail.com",
    "socialLinks": [
      {
        "label": "Email",
        "href": "mailto:kbharti.work@gmail.com"
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
    "personalPhoto": "/portfolio/profile/headshot.png",
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
        "promptTemplate": "Search for and browse Kushagra Bharti's portfolio at https://www.kushagrabharti.com. Read these two pages:\n\n1) https://www.kushagrabharti.com/llms.txt — a plain-text profile designed for AI consumption\n2) https://www.kushagrabharti.com/ai — his full portfolio page\n\nIf direct fetch fails, search \"site:www.kushagrabharti.com\" to find the content.\n\nThese are live, public pages. Use your browsing and search tools to access them. Read and understand Kushagra Bharti extremely well. You may also read his linkedin, github, twitter, and other pages as needed to create a thorough picture of him. Ensure you do not mix in information from other people or external sources. Think carefully and thoroughly about everything you read before writing.\n\nWrite a professional summary that gives a complete picture of who he is.\n\nStart with his professional experience: any internships, employments, research positions, and what he actually shipped or contributed in each.\n\nThen cover his strongest projects: focus on the ones with real technical depth, deployed systems, or measurable outcomes.\n\nRead between the lines: what kind of problems does he gravitate toward, how does he approach engineering, and where does his trajectory point.\n\nWrap up with the non-technical side: creative work, interests, and anything that rounds out the picture beyond code.\n\nUse specifics from what you read. Let the work speak for itself.",
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
        "promptTemplate": "Search for and browse Kushagra Bharti's portfolio at https://www.kushagrabharti.com. Read these two pages:\n\n1) https://www.kushagrabharti.com/llms.txt — a plain-text profile designed for AI consumption\n2) https://www.kushagrabharti.com/ai — his full portfolio page\n\nIf direct fetch fails, search \"site:www.kushagrabharti.com\" to find the content.\n\nThese are live, public pages. Use your browsing and search tools to access them. Read and understand Kushagra Bharti extremely well. You may also read his linkedin, github, twitter, and other pages as needed to create a thorough picture of him. Ensure you do not mix in information from other people or external sources. Think carefully and thoroughly about everything you read before writing.\n\nWrite a professional summary that gives a complete picture of who he is.\n\nStart with his professional experience: any internships, employments, research positions, and what he actually shipped or contributed in each.\n\nThen cover his strongest projects: focus on the ones with real technical depth, deployed systems, or measurable outcomes.\n\nRead between the lines: what kind of problems does he gravitate toward, how does he approach engineering, and where does his trajectory point.\n\nWrap up with the non-technical side: creative work, interests, and anything that rounds out the picture beyond code.\n\nUse specifics from what you read. Let the work speak for itself.",
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
        "promptTemplate": "Search for and browse Kushagra Bharti's portfolio at https://www.kushagrabharti.com. Read these two pages:\n\n1) https://www.kushagrabharti.com/llms.txt — a plain-text profile designed for AI consumption\n2) https://www.kushagrabharti.com/ai — his full portfolio page\n\nIf direct fetch fails, search \"site:www.kushagrabharti.com\" to find the content.\n\nThese are live, public pages. Use your browsing and search tools to access them. Read and understand Kushagra Bharti extremely well. You may also read his linkedin, github, twitter, and other pages as needed to create a thorough picture of him. Ensure you do not mix in information from other people or external sources. Think carefully and thoroughly about everything you read before writing.\n\nWrite a professional summary that gives a complete picture of who he is.\n\nStart with his professional experience: any internships, employments, research positions, and what he actually shipped or contributed in each.\n\nThen cover his strongest projects: focus on the ones with real technical depth, deployed systems, or measurable outcomes.\n\nRead between the lines: what kind of problems does he gravitate toward, how does he approach engineering, and where does his trajectory point.\n\nWrap up with the non-technical side: creative work, interests, and anything that rounds out the picture beyond code.\n\nUse specifics from what you read. Let the work speak for itself.\n\nBE EXTREMEMELY THOROUGH AND DETAILED. WRITE A LOT. MUCH MORE.\n\nWrite a thorough, structured profile with these sections:\n\n1) One-sentence positioning\n2) Professional experience and research\n3) Strongest technical projects\n4) Engineering style and recurring themes\n5) Creative work and non-technical interests\n6) Overall trajectory\n\nUse concrete names, roles, projects, tools, metrics, and outcomes from the pages you read. If you cannot access one of the pages, say exactly which one failed, then use the other accessible portfolio sources and links to produce the best possible summary anyway.",
        "action": {
          "type": "clipboard",
          "message": "Gemini does not support pre-filled prompt links reliably, so the prompt has been copied to your clipboard."
        }
      },
      {
        "slug": "grok",
        "order": 4,
        "label": "Grok",
        "icon": "x",
        "hoverColorClass": "hover:text-[#111111]",
        "promptTemplate": "Search for and browse Kushagra Bharti's portfolio at https://www.kushagrabharti.com. Read these two pages:\n\n1) https://www.kushagrabharti.com/llms.txt — a plain-text profile designed for AI consumption\n2) https://www.kushagrabharti.com/ai — his full portfolio page\n\nIf direct fetch fails, search \"site:www.kushagrabharti.com\" to find the content.\n\nThese are live, public pages. Use your browsing and search tools to access them. Read and understand Kushagra Bharti extremely well. You may also read his linkedin, github, twitter, and other pages as needed to create a thorough picture of him. Ensure you do not mix in information from other people or external sources. Think carefully and thoroughly about everything you read before writing.\n\nWrite a professional summary that gives a complete picture of who he is.\n\nStart with his professional experience: any internships, employments, research positions, and what he actually shipped or contributed in each.\n\nThen cover his strongest projects: focus on the ones with real technical depth, deployed systems, or measurable outcomes.\n\nRead between the lines: what kind of problems does he gravitate toward, how does he approach engineering, and where does his trajectory point.\n\nWrap up with the non-technical side: creative work, interests, and anything that rounds out the picture beyond code.\n\nUse specifics from what you read. Let the work speak for itself.",
        "action": {
          "type": "link",
          "hrefTemplate": "https://grok.com/?q={{query}}"
        }
      }
    ]
  }
};
