import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { importFresh } from "../../test/utils/importWithEnv";

const axiosMock = vi.hoisted(() => ({
  get: vi.fn(),
  isAxiosError: (error: unknown) => !!(error as { isAxiosError?: boolean })?.isAxiosError,
}));

vi.mock("axios", () => ({
  default: axiosMock,
  ...axiosMock,
}));

const mockedAxios = axios as unknown as typeof axiosMock;

const makeAxiosError = (status: number, message = "Bad Request") => ({
  isAxiosError: true,
  response: {
    status,
    data: {
      message,
    },
  },
});

describe("weatherService", () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
  });

  it("uses explicit coordinates when they succeed", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { name: "Dallas" } });

    const { fetchWeather } = await importFresh<typeof import("./weatherService")>(
      () => import("./weatherService"),
      {
        OPENWEATHER_API_KEY: "key",
      },
    );

    const result = await fetchWeather({ lat: "32.7767", lon: "-96.7970" });

    expect(result).toEqual({ name: "Dallas" });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: expect.objectContaining({
          lat: "32.7767",
          lon: "-96.7970",
        }),
      })
    );
  });

  it("falls back from coordinates to q when the location is retryable", async () => {
    mockedAxios.get
      .mockRejectedValueOnce(makeAxiosError(400))
      .mockResolvedValueOnce({ data: { name: "New York" } });

    const { fetchWeather } = await importFresh<typeof import("./weatherService")>(
      () => import("./weatherService"),
      {
        OPENWEATHER_API_KEY: "key",
      },
    );

    const result = await fetchWeather({ lat: "40.7128", lon: "-74.0060", q: "New York, US" });

    expect(result).toEqual({ name: "New York" });
    expect(mockedAxios.get).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: expect.objectContaining({
          q: "New York, US",
        }),
      })
    );
  });

  it("falls back to Austin when the guessed location is invalid", async () => {
    mockedAxios.get
      .mockRejectedValueOnce(makeAxiosError(400))
      .mockResolvedValueOnce({ data: { name: "Austin" } });

    const { fetchWeather } = await importFresh<typeof import("./weatherService")>(
      () => import("./weatherService"),
      {
        OPENWEATHER_API_KEY: "key",
      },
    );

    const result = await fetchWeather({ q: "Unknown, US" });

    expect(result).toEqual({ name: "Austin" });
    expect(mockedAxios.get).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: expect.objectContaining({
          q: "Austin",
        }),
      })
    );
  });

  it("throws when the weather API key is missing", async () => {
    const { fetchWeather } = await importFresh<typeof import("./weatherService")>(
      () => import("./weatherService"),
      {
        OPENWEATHER_API_KEY: undefined,
      },
    );

    await expect(fetchWeather({})).rejects.toThrow("OPENWEATHER_API_KEY is missing");
  });
});
