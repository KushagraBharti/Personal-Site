import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { importFresh } from "../../test/utils/importWithEnv";

const axiosMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  isAxiosError: (error: unknown) => !!(error as { isAxiosError?: boolean })?.isAxiosError,
}));

vi.mock("axios", () => ({
  default: axiosMock,
  ...axiosMock,
}));

const mockedAxios = axios as unknown as typeof axiosMock;

describe("githubStatsService", () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
    vi.useRealTimers();
  });

  it("uses the GraphQL contribution path and returns cached data on repeat calls", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2020-06-01T00:00:00.000Z"));

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        public_repos: 37,
        created_at: "2020-01-01T00:00:00.000Z",
      },
    });
    mockedAxios.post.mockResolvedValue({
      data: {
        data: {
          user: {
            contributionsCollection: {
              totalCommitContributions: 907,
            },
          },
        },
      },
    });

    const service = await importFresh<typeof import("./githubStatsService")>(
      () => import("./githubStatsService"),
      {
        GITHUB_USERNAME: "kushagrabharti",
        GITHUB_TOKEN: "token",
        GITHUB_STATS_TTL_MS: "600000",
      },
    );

    const fresh = await service.fetchGitHubStats();
    const cached = await service.fetchGitHubStats();

    expect(fresh).toMatchObject({
      totalRepos: 37,
      totalCommits: 907,
    });
    expect(cached).toMatchObject({
      totalRepos: 37,
      totalCommits: 907,
      cached: true,
    });
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it("falls back to commit search when GraphQL fails and logs a warning", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2020-06-01T00:00:00.000Z"));

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          public_repos: 37,
          created_at: "2020-01-01T00:00:00.000Z",
        },
      })
      .mockResolvedValueOnce({
        data: {
          total_count: 818,
        },
      });
    mockedAxios.post.mockRejectedValueOnce(new Error("GraphQL unavailable"));

    const service = await importFresh<typeof import("./githubStatsService")>(
      () => import("./githubStatsService"),
      {
        GITHUB_USERNAME: "kushagrabharti",
        GITHUB_TOKEN: "token",
      },
    );

    const result = await service.fetchGitHubStats(true);

    expect(result).toMatchObject({
      totalRepos: 37,
      totalCommits: 818,
    });
    expect(warnSpy).toHaveBeenCalledWith(
      "GitHub GraphQL commit contributions query failed, falling back to commit search.",
      expect.any(Error)
    );
  });

  it("falls back to a repo walk when the primary GitHub queries fail", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url.endsWith("/users/kushagrabharti")) {
        throw new Error("Primary user profile failed");
      }

      if (url.includes("/users/kushagrabharti/repos")) {
        const page = new URL(url).searchParams.get("page");
        if (page === "1") {
          return {
            data: [
              { name: "repo-1", owner: { login: "kushagrabharti" } },
              { name: "repo-2", owner: { login: "kushagrabharti" } },
            ],
          };
        }

        return { data: [] };
      }

      if (url.endsWith("/repos/kushagrabharti/repo-1/commits")) {
        return {
          status: 200,
          headers: {
            link: '<https://api.github.com/repositories/1/commits?per_page=1&page=3>; rel="last"',
          },
          data: [{}],
        };
      }

      return {
        status: 409,
        headers: {},
        data: [],
      };
    });

    const service = await importFresh<typeof import("./githubStatsService")>(
      () => import("./githubStatsService"),
      {
        GITHUB_USERNAME: "kushagrabharti",
        GITHUB_TOKEN: "token",
      },
    );

    const result = await service.fetchGitHubStats(true);

    expect(result).toMatchObject({
      totalRepos: 2,
      totalCommits: 3,
    });
    expect(warnSpy).toHaveBeenCalledWith(
      "Primary GitHub stats query failed, falling back to repo walk.",
      expect.any(Error)
    );
  });

  it("returns stale cached stats while a background refresh is running and force refresh bypasses stale cache", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-04T12:00:00.000Z"));

    mockedAxios.get.mockResolvedValue({
      data: {
        public_repos: 37,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    });
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        data: {
          user: {
            contributionsCollection: {
              totalCommitContributions: 900,
            },
          },
        },
      },
    });

    const service = await importFresh<typeof import("./githubStatsService")>(
      () => import("./githubStatsService"),
      {
        GITHUB_USERNAME: "kushagrabharti",
        GITHUB_TOKEN: "token",
        GITHUB_STATS_TTL_MS: "1",
      },
    );

    await service.fetchGitHubStats(true);

    const deferred = Promise.withResolvers<{
      data: {
        data: {
          user: {
            contributionsCollection: {
              totalCommitContributions: number;
            };
          };
        };
      };
    }>();
    mockedAxios.post.mockReturnValueOnce(deferred.promise);

    vi.setSystemTime(new Date("2026-04-04T12:00:01.000Z"));

    const stale = await service.fetchGitHubStats();
    expect(stale).toMatchObject({
      totalRepos: 37,
      totalCommits: 900,
      cached: true,
      stale: true,
    });

    deferred.resolve({
      data: {
        data: {
          user: {
            contributionsCollection: {
              totalCommitContributions: 907,
            },
          },
        },
      },
    });

    await vi.runAllTimersAsync();

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        data: {
          user: {
            contributionsCollection: {
              totalCommitContributions: 920,
            },
          },
        },
      },
    });
    const forced = await service.fetchGitHubStats(true);

    expect(forced).toMatchObject({
      totalRepos: 37,
      totalCommits: 920,
    });
  });
});
