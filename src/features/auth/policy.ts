import { z } from "zod";
export function isOwner(userId: string | undefined, ownerId: string | undefined): boolean {
  return !!userId && !!ownerId && z.uuid().safeParse(ownerId).success && userId === ownerId;
}
export function demoEnabled(env: { NODE_ENV?: string; JARVIS_DEMO_MODE?: string }): boolean {
  return env.NODE_ENV !== "production" && env.JARVIS_DEMO_MODE === "true";
}
