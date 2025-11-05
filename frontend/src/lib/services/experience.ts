import { apiClient } from "../api";
import type { Experience } from "../types";

export const getExperience = async () => {
  const response = await apiClient.get<Experience[]>("/api/experiences");
  return response.data;
};
