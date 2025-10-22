import React, { useEffect, useMemo, useState } from "react";
import { useWindows } from "../../../app/wm/hooks";
import {
  useGitHubStatsQuery,
  useLeetCodeStatsQuery,
  useProjectsQuery,
} from "../../../hooks/usePortfolioQueries";

const StatsApp: React.FC = () => {
  const windows = useWindows();
  const { data: projectsData } = useProjectsQuery();
  const { data: githubStats } = useGitHubStatsQuery();
  const { data: leetCodeStats } = useLeetCodeStatsQuery();
  const [uptimeSeconds, setUptimeSeconds] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setUptimeSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const uptimeDisplay = useMemo(() => {
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, [uptimeSeconds]);

  const projectCount = projectsData?.length ?? 0;
  const openWindowCount = windows.length;

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto bg-slate-950/30 p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Projects" value={projectCount.toString()} hint="Loaded from API" />
        <StatCard
          label="Open Windows"
          value={openWindowCount.toString()}
          hint="Current desktop session"
        />
        <StatCard label="Uptime" value={uptimeDisplay} hint="Since window opened" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          label="GitHub Commits"
          value={githubStats ? githubStats.totalCommits.toLocaleString() : "--"}
          hint={`Across ${githubStats ? githubStats.totalRepos : "--"} repositories`}
        />
        <StatCard
          label="LeetCode Solved"
          value={leetCodeStats ? leetCodeStats.totalSolved.toString() : "--"}
          hint={
            leetCodeStats
              ? `${leetCodeStats.easySolved} easy · ${leetCodeStats.mediumSolved} medium · ${leetCodeStats.hardSolved} hard`
              : ""
          }
        />
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 text-xs text-slate-300">
        <h3 className="text-sm font-semibold text-slate-100">Keyboard Shortcuts</h3>
        <ul className="mt-3 space-y-1">
          <li><span className="font-mono">Ctrl + W</span> — Close active window</li>
          <li><span className="font-mono">Ctrl + Tab</span> — Cycle windows</li>
          <li><span className="font-mono">Win + Space</span> — Toggle Start menu</li>
          <li><span className="font-mono">Win + T</span> — Open Terminal</li>
        </ul>
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, hint }) => (
  <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
    <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
    <p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
    {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
  </div>
);

export default StatsApp;
