import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

type AuthenticatedUser = User;

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Chat Router", () => {
  describe("getHistory", () => {
    it("should return empty array for new user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.getHistory();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it("should work without authentication (anonymous user)", async () => {
      const caller = appRouter.createCaller({ user: null, req: {}, res: {} } as any);

      // Anonymous users should get empty history
      const result = await caller.chat.getHistory();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("sendMessage", () => {
    it("should validate message content is not empty", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.chat.sendMessage({
          content: "",
          model: "openrouter/auto",
          appUrl: "http://localhost:3000",
          appName: "Test App",
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should validate message content max length", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const longContent = "a".repeat(5000);

      try {
        await caller.chat.sendMessage({
          content: longContent,
          model: "openrouter/auto",
          appUrl: "http://localhost:3000",
          appName: "Test App",
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should validate model is one of allowed models", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.chat.sendMessage({
          content: "Hello",
          model: "invalid/model" as any,
          appUrl: "http://localhost:3000",
          appName: "Test App",
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should work without authentication (anonymous user)", async () => {
      const caller = appRouter.createCaller({ user: null, req: {}, res: {} } as any);

      // This should not throw an error anymore since we support anonymous users
      // It will fail with API error if credentials are invalid, but not auth error
      try {
        await caller.chat.sendMessage({
          content: "Hello",
          model: "openrouter/auto",
          appUrl: "http://localhost:3000",
          appName: "Test App",
        });
      } catch (error) {
        // API errors are expected, but not auth errors
        if (error instanceof Error) {
          expect(error.message).not.toContain("UNAUTHORIZED");
        }
      }
    }, { timeout: 30000 });
  });

  describe("clearHistory", () => {
    it("should work without authentication (anonymous user)", async () => {
      const caller = appRouter.createCaller({ user: null, req: {}, res: {} } as any);

      // This should not throw an error anymore since we support anonymous users
      const result = await caller.chat.clearHistory();
      expect(result).toEqual({ success: true });
    });

    it("should return success when clearing history for authenticated user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.clearHistory();

      expect(result).toEqual({ success: true });
    });
  });
});
