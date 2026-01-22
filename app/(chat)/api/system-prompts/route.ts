import { auth } from "@/app/(auth)/auth";
import {
  getSystemPromptsByUserId,
  createSystemPrompt,
  updateSystemPrompt,
  deleteSystemPrompt,
  getSystemPromptById,
} from "@/db/queries";

export async function GET() {
  const session = await auth();

  if (!session || !session.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const prompts = await getSystemPromptsByUserId({ userId: session.user.id });
    return Response.json(prompts);
  } catch (error) {
    return new Response("Failed to fetch system prompts", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { name, content, isDefault } = await request.json();

    if (!name || !content) {
      return new Response("Name and content are required", { status: 400 });
    }

    const prompt = await createSystemPrompt({
      userId: session.user.id,
      name,
      content,
      isDefault: isDefault ?? false,
    });

    return Response.json(prompt, { status: 201 });
  } catch (error) {
    return new Response("Failed to create system prompt", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Prompt ID required", { status: 400 });
  }

  try {
    const existing = await getSystemPromptById({ id });
    if (!existing || existing.userId !== session.user.id) {
      return new Response("Not found or unauthorized", { status: 404 });
    }

    const { name, content, isDefault } = await request.json();

    await updateSystemPrompt({
      id,
      userId: session.user.id,
      name,
      content,
      isDefault,
    });

    return new Response("Updated", { status: 200 });
  } catch (error) {
    return new Response("Failed to update system prompt", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Prompt ID required", { status: 400 });
  }

  try {
    const existing = await getSystemPromptById({ id });
    if (!existing || existing.userId !== session.user.id) {
      return new Response("Not found or unauthorized", { status: 404 });
    }

    await deleteSystemPrompt({ id });
    return new Response("Deleted", { status: 200 });
  } catch (error) {
    return new Response("Failed to delete system prompt", { status: 500 });
  }
}
