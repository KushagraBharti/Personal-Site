import { apiClient } from "../api";
import type { Intro } from "../types";

export const getIntro = async () => {
  const response = await apiClient.get<Intro>("/api/intro");
  return response.data;
};
