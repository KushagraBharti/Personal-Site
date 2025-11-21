// frontend/src/components/LeetCodeStatsCard.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import GlassCard from "./ui/GlassCard";

interface LeetCodeStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}

const LeetCodeStatsCard: React.FC = () => {
  const [stats, setStats] = useState<LeetCodeStats | null>(() => {
    const cached = sessionStorage.getItem("leetcode-stats-cache");
    if (!cached) return null;
    try {
      return JSON.parse(cached) as LeetCodeStats;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const baseUrl =
      (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
    const controller = new AbortController();

    const fetchLeetCodeStats = async () => {
      try {
        const res = await axios.get<LeetCodeStats>(`${baseUrl}/api/leetcode/stats`, {
          signal: controller.signal,
          timeout: 4000,
        });
        setStats(res.data);
        sessionStorage.setItem("leetcode-stats-cache", JSON.stringify(res.data));
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Error fetching LeetCode stats:", err);
          setError("Failed to load LeetCode stats");
        }
      }
    };

    fetchLeetCodeStats();

    return () => {
      controller.abort();
    };
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
