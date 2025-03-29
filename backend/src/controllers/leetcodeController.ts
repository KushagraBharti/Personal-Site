// backend/src/controllers/leetCodeController.ts
import { Request, Response, RequestHandler } from "express";
import axios from "axios";

export const getLeetCodeStats: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  // Here, we're using a community API endpoint.
  // Replace the URL below with your chosen LeetCode API endpoint.
  const leetUsername = process.env.LEETCODE_USERNAME || "your_leetcode_username";
  try {
    const url = `https://leetcode-stats-api.herokuapp.com/${leetUsername}`;
    const response = await axios.get(url);
    // Adjust the response data if needed:
    const data = {
      totalSolved: response.data.totalSolved,
      easySolved: response.data.easySolved,
      mediumSolved: response.data.mediumSolved,
      hardSolved: response.data.hardSolved,
    };
    res.json(data);
  } catch (error) {
    console.error("Error fetching LeetCode stats:", error);
    res.status(500).json({ error: "Failed to fetch LeetCode stats" });
  }
};
