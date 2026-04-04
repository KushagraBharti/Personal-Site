import request from "supertest";
import { describe, expect, it } from "vitest";

describe("portfolio routes", () => {
  it("serves the canonical portfolio snapshot and slug-based detail routes", async () => {
    const { default: app } = await import("../../app");

    const snapshotResponse = await request(app).get("/api/portfolio");
    expect(snapshotResponse.status).toBe(200);
    expect(snapshotResponse.body).toHaveProperty("generatedAt");
    expect(Array.isArray(snapshotResponse.body.projects)).toBe(true);

    const projectSlug = snapshotResponse.body.projects[0]?.slug;
    expect(projectSlug).toBeTruthy();

    const detailResponse = await request(app).get(`/api/projects/${projectSlug}`);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.slug).toBe(projectSlug);

    const notFoundResponse = await request(app).get("/api/projects/not-a-real-project");
    expect(notFoundResponse.status).toBe(404);
    expect(notFoundResponse.body).toEqual({ message: "Project not found" });
  });

  it("serves intro, education, experiences, and llms.txt with resolved host headers", async () => {
    const { default: app } = await import("../../app");

    const introResponse = await request(app).get("/api/intro");
    expect(introResponse.status).toBe(200);
    expect(introResponse.body).toHaveProperty("profile.name");

    const educationResponse = await request(app).get("/api/education");
    expect(educationResponse.status).toBe(200);
    expect(Array.isArray(educationResponse.body)).toBe(true);

    const experiencesResponse = await request(app).get("/api/experiences");
    expect(experiencesResponse.status).toBe(200);
    expect(Array.isArray(experiencesResponse.body)).toBe(true);

    const llmsResponse = await request(app)
      .get("/api/portfolio/llms.txt")
      .set("host", "portfolio.example")
      .set("x-forwarded-proto", "https");

    expect(llmsResponse.status).toBe(200);
    expect(llmsResponse.type).toContain("text/plain");
    expect(llmsResponse.text).toContain("Canonical site: https://portfolio.example");
    expect(llmsResponse.text).toContain("Primary AI page: https://portfolio.example/ai");
  });
});
