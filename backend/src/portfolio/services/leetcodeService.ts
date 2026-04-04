import axios from "axios";

export const fetchLeetCodeStats = async () => {
  const leetUsername = process.env.LEETCODE_USERNAME;
  if (!leetUsername) {
    throw new Error("LEETCODE_USERNAME is not configured");
  }

  const response = await axios.get(`https://leetcode-stats-api.herokuapp.com/${leetUsername}`);
  return {
    totalSolved: response.data.totalSolved,
    easySolved: response.data.easySolved,
    mediumSolved: response.data.mediumSolved,
    hardSolved: response.data.hardSolved,
  };
};
