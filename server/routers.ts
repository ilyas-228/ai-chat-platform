import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getChatMessages, insertChatMessage, clearChatMessages } from "./db";
import { callOpenRouterAPI } from "./openrouter";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

// Simple in-memory session storage for anonymous users
const sessionMessages = new Map<string, Array<{ role: "user" | "assistant"; content: string; model: string }>>();

function getSessionId(ctx: any): string {
  // Try to use user ID if authenticated
  if (ctx.user?.id) {
    return `user-${ctx.user.id}`;
  }
  
  // Otherwise, create/use a session ID from a cookie
  // For now, we'll use a simple approach with a generated ID
  // In production, you'd want to use actual session cookies
  return `session-${nanoid()}`;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  chat: router({
    getHistory: publicProcedure.query(async ({ ctx }) => {
      try {
        // If user is authenticated, get from database
        if (ctx.user?.id) {
          return await getChatMessages(ctx.user.id);
        }
        
        // Otherwise return empty array (session-based storage is handled client-side)
        return [];
      } catch (error) {
        console.error("Failed to get chat history:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve chat history",
        });
      }
    }),

    sendMessage: publicProcedure
      .input(
        z.object({
          content: z.string().min(1).max(4000),
          model: z.enum([
            "openrouter/auto",
            "openai/gpt-3.5-turbo",
          ]),
          appUrl: z.string(),
          appName: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Build message history for context
          let messages: Array<{ role: "user" | "assistant"; content: string }> = [];
          
          // If user is authenticated, get from database
          if (ctx.user?.id) {
            // Insert user message
            await insertChatMessage(
              ctx.user.id,
              "user",
              input.content,
              input.model
            );

            // Get chat history for context
            const chatHistory = await getChatMessages(ctx.user.id);
            messages = chatHistory.map((msg) => ({
              role: msg.role as "user" | "assistant",
              content: msg.content,
            }));
          } else {
            // For anonymous users, just use the current message
            // Client will handle building the full context
            messages = [{ role: "user", content: input.content }];
          }

          // Call OpenRouter API
          const response = await callOpenRouterAPI(
            {
              model: input.model,
              messages,
            },
            input.appUrl,
            input.appName
          );

          const aiMessage = response.choices[0]?.message.content;
          if (!aiMessage) {
            throw new Error("No response from OpenRouter API");
          }

          // If user is authenticated, save to database
          if (ctx.user?.id) {
            await insertChatMessage(
              ctx.user.id,
              "assistant",
              aiMessage,
              input.model
            );
          }

          return {
            success: true,
            message: aiMessage,
            usage: response.usage,
          };
        } catch (error) {
          console.error("Failed to send message:", error);

          if (error instanceof Error) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: error.message,
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to process your message",
          });
        }
      }),

    clearHistory: publicProcedure.mutation(async ({ ctx }) => {
      try {
        // Only clear database if user is authenticated
        if (ctx.user?.id) {
          await clearChatMessages(ctx.user.id);
        }
        return { success: true };
      } catch (error) {
        console.error("Failed to clear chat history:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to clear chat history",
        });
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
