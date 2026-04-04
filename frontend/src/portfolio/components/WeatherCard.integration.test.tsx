import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import WeatherCard from "./WeatherCard";

describe("WeatherCard", () => {
  it("shows a loading state first and then renders weather data", async () => {
    render(<WeatherCard />);

    expect(screen.getByText("Loading weather...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Dallas: 72/i)).toBeInTheDocument();
      expect(screen.getByText(/clear sky/i)).toBeInTheDocument();
    });
  });
});
