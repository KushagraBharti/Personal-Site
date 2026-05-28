import type { PortfolioMediaItem } from "../contracts";

export const portfolioMedia: PortfolioMediaItem[] = [
  {
    slug: "st-stephens-dining-hall-documentary",
    order: 1,
    title: "St. Stephen's Dining Hall Documentary",
    shortTitle: "Dining Hall Documentary",
    subtitle: "2022",
    year: "2022",
    genre: "Documentary",
    duration: "10 min",
    summary:
      "A documentary on the dining hall staff and the people behind the daily experience.",
    description:
      "A documentary following the St. Stephen's dining hall staff from the start of their day to the end, combining observational footage, intimate interviews, and a close look at the full dining hall experience.",
    watchUrl: "https://youtu.be/WM6RvRfDCX4",
    embedUrl: "https://www.youtube-nocookie.com/embed/WM6RvRfDCX4",
    platform: "youtube",
    type: "video",
    roles: ["Director", "Cinematographer", "Editor"],
    notes: [
      "Nominated for The All-American High School Film Festival 2023.",
      "Screened at AMC Theatres in New York City.",
    ],
    actions: [
      {
        label: "Watch",
        url: "https://youtu.be/WM6RvRfDCX4",
        variant: "primary",
      },
      {
        label: "Festival Selection",
        url: "https://www.hsfilmfest.com/2023-official-selections",
        variant: "secondary",
      },
    ],
  },
  {
    slug: "the-pbj-documentary",
    order: 2,
    title: "The PB&J Documentary",
    shortTitle: "The PB&J Documentary",
    subtitle: "2023",
    year: "2023",
    genre: "Documentary",
    duration: "19 min",
    summary:
      "A comedic documentary about obsession, mentorship, and the perfect PB&J sandwich.",
    description:
      "A comedic documentary following Liam and Edison as they chase the perfect PB&J through restaurants, roadside discoveries, and a boutique in San Antonio before the whole mentor-protege dynamic starts to unravel.",
    watchUrl: "https://youtu.be/FS8l8G2p7PM",
    embedUrl: "https://www.youtube-nocookie.com/embed/FS8l8G2p7PM",
    platform: "youtube",
    type: "video",
    roles: ["Director", "Cinematographer", "Editor"],
    actions: [
      {
        label: "Watch",
        url: "https://youtu.be/FS8l8G2p7PM",
        variant: "primary",
      },
    ],
  },
  {
    slug: "rtms-recap",
    order: 3,
    title: "RTMS Semesterly Recap",
    shortTitle: "RTMS Semesterly Recap",
    subtitle: "2018",
    year: "2018",
    genre: "Recap",
    duration: "3 min",
    summary:
      "A semester photo montage focused on rhythm, pacing, and raw editing craft.",
    description:
      "A semesterly recap film from Ras Tanura Middle School built as a photo montage. It has no traditional narrative, but it highlights editing instincts, visual sequencing, and the ability to build momentum through rhythm alone.",
    watchUrl:
      "https://drive.google.com/file/d/1az0x6mwBzTXJEPBC7zhBQk9_DGO_8GwN/view?usp=sharing",
    embedUrl:
      "https://drive.google.com/file/d/1az0x6mwBzTXJEPBC7zhBQk9_DGO_8GwN/preview",
    platform: "drive",
    type: "video",
    roles: ["Editor", "Photographer", "Story Builder"],
    actions: [
      {
        label: "Watch",
        url: "https://drive.google.com/file/d/1az0x6mwBzTXJEPBC7zhBQk9_DGO_8GwN/view?usp=sharing",
        variant: "primary",
      },
    ],
  },
];
