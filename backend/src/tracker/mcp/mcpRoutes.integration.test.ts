import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("tracker MCP routes", () => {
  beforeEach(() => {
    process.env.TRACKER_MCP_ENABLED = "1";
    process.env.TRACKER_MCP_API_KEY = "test-mcp-key";
    process.env.TRACKER_MCP_OWNER_USER_ID = "user-1";
    process.env.SUPABASE_URL = "https://supabase.test";
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      "test.service.role.key.with.enough.parts";
  });

  afterEach(() => {
    delete process.env.TRACKER_MCP_ENABLED;
    delete process.env.TRACKER_MCP_API_KEY;
    delete process.env.TRACKER_MCP_OWNER_USER_ID;
    delete process.env.TRACKER_MCP_ALLOWED_POKE_USER_IDS;
  });

  it("exposes a health endpoint without MCP auth", async () => {
    const { default: app } = await import("../../app");
    const response = await request(app).get("/api/mcp/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      service: "tracker-mcp",
      configured: true,
    });
  }, 15_000);

  it("requires bearer auth for MCP requests", async () => {
    const { default: app } = await import("../../app");
    const response = await request(app).post("/api/mcp").send({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });

  it("blocks unexpected browser origins before MCP handling", async () => {
    const { default: app } = await import("../../app");
    const response = await request(app)
      .post("/api/mcp")
      .set("authorization", "Bearer test-mcp-key")
      .set("origin", "https://evil.example")
      .send({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Origin not allowed" });
  });

  it("lists Poke-visible tracker tools over plain JSON-RPC", async () => {
    const { default: app } = await import("../../app");
    const response = await request(app)
      .post("/api/mcp")
      .set("authorization", "Bearer test-mcp-key")
      .send({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
      });

    expect(response.status).toBe(200);
    expect(response.body.result.tools.map((tool: { name: string }) => tool.name)).toEqual([
      "get_tracker_snapshot",
      "list_tasks",
      "list_completed_tasks",
      "create_task",
      "update_task",
      "complete_task",
      "uncomplete_task",
      "delete_task",
      "sync_calendar_now",
    ]);
  });

  it("returns concise tracker behavior instructions during initialize", async () => {
    const { default: app } = await import("../../app");
    const response = await request(app)
      .post("/api/mcp")
      .set("authorization", "Bearer test-mcp-key")
      .send({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {},
      });

    expect(response.status).toBe(200);
    expect(response.body.result.instructions).toContain(
      "keep titles short",
    );
    expect(response.body.result.instructions).toContain(
      "set due_at to 10:00 PM",
    );
  });

  it("requires MCP auth for GET stream probes", async () => {
    const { default: app } = await import("../../app");
    const response = await request(app).get("/api/mcp");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });

  it("returns an authenticated SSE response for GET stream probes", async () => {
    const { default: app } = await import("../../app");
    const response = await request(app)
      .get("/api/mcp")
      .set("authorization", "Bearer test-mcp-key");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/event-stream");
    expect(response.text).toContain("tracker-mcp stream ready");
  });

  it("returns an MCP-shaped 405 for unsupported authenticated methods", async () => {
    const { default: app } = await import("../../app");
    const response = await request(app)
      .delete("/api/mcp")
      .set("authorization", "Bearer test-mcp-key");

    expect(response.status).toBe(405);
    expect(response.body).toEqual({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    });
  });
});
