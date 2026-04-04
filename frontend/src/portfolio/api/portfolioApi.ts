import axios from "axios";
import { getApiBaseUrl } from "../../shared/lib/apiBaseUrl";
import type {
  PortfolioEducation,
  PortfolioExperience,
  PortfolioIntroResponse,
  PortfolioProject,
  PortfolioSnapshot,
} from "./contracts";

export const fetchPortfolioSnapshot = async (signal?: AbortSignal) => {
  const response = await axios.get<PortfolioSnapshot>(`${getApiBaseUrl()}/api/portfolio`, { signal });
  return response.data;
};

export const fetchIntroSection = async (signal?: AbortSignal) => {
  const response = await axios.get<PortfolioIntroResponse>(`${getApiBaseUrl()}/api/intro`, { signal });
  return response.data;
};

export const fetchEducation = async (signal?: AbortSignal) => {
  const response = await axios.get<PortfolioEducation[]>(`${getApiBaseUrl()}/api/education`, {
    signal,
    timeout: 5000,
  });
  return response.data;
};

export const fetchExperiences = async (signal?: AbortSignal) => {
  const response = await axios.get<PortfolioExperience[]>(`${getApiBaseUrl()}/api/experiences`, {
    signal,
    timeout: 5000,
  });
  return response.data;
};

export const fetchProjects = async (signal?: AbortSignal) => {
  const response = await axios.get<PortfolioProject[]>(`${getApiBaseUrl()}/api/projects`, {
    signal,
    timeout: 5000,
  });
  return response.data;
};
