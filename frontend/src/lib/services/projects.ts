import { apiClient } from "../api";
import type { Project } from "../types";

export const getProjects = async () => {
  const response = await apiClient.get<Project[]>("/api/projects");
  return response.data;
};
