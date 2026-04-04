import { expect, test } from "@playwright/test";

const apiBaseUrl = "http://127.0.0.1:5000";

test("core public portfolio APIs return success", async ({ request }) => {
  const responses = await Promise.all([
    request.get(`${apiBaseUrl}/api/portfolio`),
    request.get(`${apiBaseUrl}/api/intro`),
    request.get(`${apiBaseUrl}/api/projects`),
    request.get(`${apiBaseUrl}/api/projects/monopoly-llm-benchmark`),
    request.get(`${apiBaseUrl}/api/experiences`),
    request.get(`${apiBaseUrl}/api/experiences/abilitie-software-engineering-intern`),
    request.get(`${apiBaseUrl}/api/education`),
    request.get(`${apiBaseUrl}/api/education/ut-dallas-bs-computer-science`),
    request.get(`${apiBaseUrl}/api/portfolio/llms.txt`),
  ]);

  responses.forEach((response) => {
    expect(response.status()).toBe(200);
  });

  const snapshot = await responses[0].json();
  expect(snapshot.profile.name).toBe("Kushagra Bharti");

  const llmsText = await responses[8].text();
  expect(llmsText).toContain("Kushagra Bharti");
  expect(llmsText).toContain("Monopoly LLM Benchmark Platform");
});
