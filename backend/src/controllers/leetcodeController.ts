// backend/src/controllers/leetcodeController.ts
import { Request, Response, RequestHandler } from "express";
import axios from "axios";

export const getLeetCodeStats: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  // Use the environment variable LEETCODE_USERNAME or fallback to a default.
  const leetUsername = process.env.LEETCODE_USERNAME || "your_leetcode_username";
  const url = `https://leetcode-stats-api.herokuapp.com/${leetUsername}`;

  try {
    const response = await axios.get(url);
    // Adjust the returned data if necessary. Here we assume the API returns these fields:
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
