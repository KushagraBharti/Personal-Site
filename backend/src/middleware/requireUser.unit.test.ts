import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { importFresh } from "../test/utils/importWithEnv";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

const makeResponse = () => {
  const response: Partial<Response> = {};
  response.status = vi.fn().mockReturnValue(response);
  response.json = vi.fn().mockReturnValue(response);
  return response as Response;
};

describe("requireUser", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("returns 401 when the bearer token is missing or malformed", async () => {
    const { requireUser } = await importFresh<typeof import("./requireUser")>(
      () => import("./requireUser"),
      {
        SUPABASE_URL: "https://supabase.test",
        SUPABASE_SECRET_KEY: "service-role-key",
      },
    );
    const response = makeResponse();
    const next = vi.fn() as NextFunction;

    await requireUser(
      {
        header: vi.fn().mockReturnValue("not-a-bearer"),
      } as unknown as Request,
      response,
      next
    );

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when Supabase rejects the token", async () => {
    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("invalid"),
        }),
      },
    });

    const { requireUser } = await importFresh<typeof import("./requireUser")>(
      () => import("./requireUser"),
      {
        SUPABASE_URL: "https://supabase.test",
        SUPABASE_SECRET_KEY: "service-role-key",
      },
    );
    const response = makeResponse();

    await requireUser(
      {
        header: vi.fn().mockImplementation((name: string) =>
          name === "authorization" ? "Bearer bad-token" : undefined
        ),
      } as unknown as Request,
      response,
      vi.fn() as NextFunction
    );

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  it("returns 500 when the backend auth configuration is missing", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { requireUser } = await importFresh<typeof import("./requireUser")>(
      () => import("./requireUser"),
      {
        SUPABASE_URL: undefined,
        SUPABASE_SECRET_KEY: undefined,
        SUPABASE_SERVICE_ROLE_KEY: undefined,
      },
    );
    const response = makeResponse();

    await requireUser(
      {
        header: vi.fn().mockImplementation((name: string) =>
          name === "authorization" ? "Bearer token" : undefined
        ),
      } as unknown as Request,
      response,
      vi.fn() as NextFunction
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({ error: "Server misconfigured" });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("injects req.user and calls next on success", async () => {
    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-1",
              email: "user@example.com",
            },
          },
          error: null,
        }),
      },
    });

    const { requireUser } = await importFresh<typeof import("./requireUser")>(
      () => import("./requireUser"),
      {
        SUPABASE_URL: "https://supabase.test",
        SUPABASE_SECRET_KEY: "service-role-key",
      },
    );
    const response = makeResponse();
    const next = vi.fn() as NextFunction;
    const request = {
      header: vi.fn().mockImplementation((name: string) =>
        name === "authorization" ? "Bearer valid-token" : undefined
      ),
    } as unknown as Request;

    await requireUser(request, response, next);

    expect(request.user).toEqual({
      id: "user-1",
      email: "user@example.com",
    });
    expect(next).toHaveBeenCalled();
  });
});
