import { http, HttpResponse } from "msw";
import { githubStatsFixture, introResponseFixture, portfolioSnapshotFixture, weatherFixture } from "../fixtures/portfolio";

const api = "http://localhost:5000";

export const handlers = [
  http.get(`${api}/api/portfolio`, () => HttpResponse.json(portfolioSnapshotFixture)),
  http.get(`${api}/api/intro`, () => HttpResponse.json(introResponseFixture)),
  http.get(`${api}/api/github/stats`, () => HttpResponse.json(githubStatsFixture)),
  http.get(`${api}/api/weather`, () => HttpResponse.json(weatherFixture)),
  http.get(`${api}/api/projects`, () => HttpResponse.json(portfolioSnapshotFixture.projects)),
  http.get(`${api}/api/experiences`, () => HttpResponse.json(portfolioSnapshotFixture.experiences)),
  http.get(`${api}/api/education`, () => HttpResponse.json(portfolioSnapshotFixture.education)),
];
