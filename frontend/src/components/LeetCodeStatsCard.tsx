// frontend/src/components/LeetCodeStatsCard.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import GlassCard from "./ui/GlassCard";

interface LeetCodeStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}

const LeetCodeStatsCard: React.FC = () => {
  const [stats, setStats] = useState<LeetCodeStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeetCodeStats = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
        // Calling the backend endpoint for LeetCode stats
        const res = await axios.get<LeetCodeStats>(`${baseUrl}/api/leetcode/stats`);
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching LeetCode stats:", err);
        setError("Failed to load LeetCode stats");
      }
    };
    fetchLeetCodeStats();
  }, []);

  if (error) {
    return (
      <GlassCard className="p-4 w-60 text-center">
        <h4 className="text-sm font-bold text-white mb-1">LeetCode Stats</h4>
        <p className="text-sm text-red-300">{error}</p>
      </GlassCard>
    );
  }

  if (!stats) {
    return (
      <GlassCard className="p-4 w-60 text-center">
        <h4 className="text-sm font-bold text-white mb-1">LeetCode Stats</h4>
        <p className="text-sm text-gray-200">Loading LeetCode stats...</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4 w-60 text-center">
      <h4 className="text-sm font-bold text-white mb-1">LeetCode Stats</h4>
      <p className="text-sm text-gray-200">
        <strong>Total Solved:</strong> {stats.totalSolved}
        <br />
        <strong>E/M/H:</strong> {stats.easySolved}/{stats.mediumSolved}/{stats.hardSolved}
      </p>
    </GlassCard>
  );
};

export default LeetCodeStatsCard;
