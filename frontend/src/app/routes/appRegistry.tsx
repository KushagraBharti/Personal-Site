import AboutApp from "../../components/apps/About/AboutApp";
import EducationApp from "../../components/apps/Education/EducationApp";
import ExperienceApp from "../../components/apps/Experience/ExperienceApp";
import ProjectDetailsWindow from "../../components/apps/Projects/ProjectDetailsWindow";
import ProjectsApp from "../../components/apps/Projects/ProjectsApp";
import SettingsApp from "../../components/apps/Settings/SettingsApp";
import StatsApp from "../../components/apps/Stats/StatsApp";
import TerminalApp from "../../components/apps/Terminal/TerminalApp";
import WeatherApp from "../../components/apps/Weather/WeatherApp";
import type { AppDefinition, AppId } from "../wm/types";

export const appDefinitions: AppDefinition[] = [
  {
    appId: "projects",
    title: "Projects Explorer",
    icon: "[PRJ]",
    defaultSize: { width: 920, height: 560 },
    routes: ["/app/projects"],
    mount: ProjectsApp,
  },
  {
    appId: "projectDetails",
    title: "Project Details",
    icon: "[DOC]",
    defaultSize: { width: 720, height: 520 },
    mount: ProjectDetailsWindow,
    routes: ["/app/projects/:id"],
  },
  {
    appId: "experience",
    title: "Experience Timeline",
    icon: "[EXP]",
    defaultSize: { width: 720, height: 560 },
    routes: ["/app/experience"],
    mount: ExperienceApp,
  },
  {
    appId: "education",
    title: "Education",
    icon: "[EDU]",
    defaultSize: { width: 680, height: 520 },
    routes: ["/app/education"],
    mount: EducationApp,
  },
  {
    appId: "about",
    title: "About Me",
    icon: "[ABOUT]",
    defaultSize: { width: 640, height: 480 },
    routes: ["/app/about"],
    mount: AboutApp,
  },
  {
    appId: "weather",
    title: "Weather",
    icon: "[WX]",
    defaultSize: { width: 420, height: 360 },
    routes: ["/app/weather"],
    mount: WeatherApp,
  },
  {
    appId: "stats",
    title: "System Monitor",
    icon: "[STAT]",
    defaultSize: { width: 640, height: 480 },
    routes: ["/app/stats"],
    mount: StatsApp,
  },
  {
    appId: "settings",
    title: "Settings",
    icon: "[CFG]",
    defaultSize: { width: 520, height: 440 },
    routes: ["/app/settings"],
    mount: SettingsApp,
  },
  {
    appId: "terminal",
    title: "Terminal",
    icon: "[TERM]",
    defaultSize: { width: 640, height: 320 },
    routes: ["/app/terminal"],
    mount: TerminalApp,
  },
];

export const appRegistry: Map<AppId, AppDefinition> = new Map(
  appDefinitions.map((app) => [app.appId, app]),
);

export const getAppDefinition = (appId: AppId) => appRegistry.get(appId);
