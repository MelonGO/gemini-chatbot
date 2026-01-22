import "server-only";

import { genSaltSync, hashSync } from "bcrypt-ts";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { user, chat, User, reservation, systemPrompt, SystemPrompt } from "./schema";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle
let client = postgres(`${process.env.POSTGRES_URL!}`);
let db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error("Failed to get user from database");
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error("Failed to create user in database");
    throw error;
  }
}

export async function saveChat({
  id,
  messages,
  userId,
  systemPromptId,
}: {
  id: string;
  messages: any;
  userId: string;
  systemPromptId?: string | null;
}) {
  try {
    const selectedChats = await db.select().from(chat).where(eq(chat.id, id));

    if (selectedChats.length > 0) {
      return await db
        .update(chat)
        .set({
          messages: JSON.stringify(messages),
        })
        .where(eq(chat.id, id));
    }

    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      messages: JSON.stringify(messages),
      userId,
      systemPromptId: systemPromptId ?? null,
    });
  } catch (error) {
    console.error("Failed to save chat in database");
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error("Failed to delete chat by id from database");
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error("Failed to get chats by user from database");
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error("Failed to get chat by id from database");
    throw error;
  }
}

export async function getReservationById({ id }: { id: string }) {
  const [selectedReservation] = await db
    .select()
    .from(reservation)
    .where(eq(reservation.id, id));

  return selectedReservation;
}

export async function updateReservation({
  id,
  hasCompletedPayment,
}: {
  id: string;
  hasCompletedPayment: boolean;
}) {
  return await db
    .update(reservation)
    .set({
      hasCompletedPayment,
    })
    .where(eq(reservation.id, id));
}

// System Prompt queries

export async function getSystemPromptsByUserId({
  userId,
}: {
  userId: string;
}): Promise<SystemPrompt[]> {
  try {
    return await db
      .select()
      .from(systemPrompt)
      .where(eq(systemPrompt.userId, userId))
      .orderBy(desc(systemPrompt.createdAt));
  } catch (error) {
    console.error("Failed to get system prompts from database");
    throw error;
  }
}

export async function getSystemPromptById({
  id,
}: {
  id: string;
}): Promise<SystemPrompt | undefined> {
  try {
    const [prompt] = await db
      .select()
      .from(systemPrompt)
      .where(eq(systemPrompt.id, id));
    return prompt;
  } catch (error) {
    console.error("Failed to get system prompt by id from database");
    throw error;
  }
}

export async function createSystemPrompt({
  userId,
  name,
  content,
  isDefault = false,
}: {
  userId: string;
  name: string;
  content: string;
  isDefault?: boolean;
}): Promise<SystemPrompt> {
  try {
    // If setting as default, unset existing defaults for this user
    if (isDefault) {
      await db
        .update(systemPrompt)
        .set({ isDefault: false })
        .where(eq(systemPrompt.userId, userId));
    }

    const [created] = await db
      .insert(systemPrompt)
      .values({ userId, name, content, isDefault, createdAt: new Date() })
      .returning();
    return created;
  } catch (error) {
    console.error("Failed to create system prompt in database");
    throw error;
  }
}

export async function updateSystemPrompt({
  id,
  userId,
  name,
  content,
  isDefault,
}: {
  id: string;
  userId: string;
  name?: string;
  content?: string;
  isDefault?: boolean;
}): Promise<void> {
  try {
    // If setting as default, unset existing defaults for this user
    if (isDefault) {
      await db
        .update(systemPrompt)
        .set({ isDefault: false })
        .where(eq(systemPrompt.userId, userId));
    }

    await db
      .update(systemPrompt)
      .set({
        ...(name !== undefined && { name }),
        ...(content !== undefined && { content }),
        ...(isDefault !== undefined && { isDefault }),
      })
      .where(eq(systemPrompt.id, id));
  } catch (error) {
    console.error("Failed to update system prompt in database");
    throw error;
  }
}

export async function deleteSystemPrompt({ id }: { id: string }): Promise<void> {
  try {
    await db.delete(systemPrompt).where(eq(systemPrompt.id, id));
  } catch (error) {
    console.error("Failed to delete system prompt from database");
    throw error;
  }
}

export async function getDefaultSystemPrompt({
  userId,
}: {
  userId: string;
}): Promise<SystemPrompt | undefined> {
  try {
    const [prompt] = await db
      .select()
      .from(systemPrompt)
      .where(
        and(eq(systemPrompt.userId, userId), eq(systemPrompt.isDefault, true))
      );
    return prompt;
  } catch (error) {
    console.error("Failed to get default system prompt from database");
    throw error;
  }
}
