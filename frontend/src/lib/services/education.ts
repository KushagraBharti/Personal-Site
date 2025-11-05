import { apiClient } from "../api";
import type { Education } from "../types";

export const getEducation = async () => {
  const response = await apiClient.get<Education[]>("/api/education");
  return response.data;
};
