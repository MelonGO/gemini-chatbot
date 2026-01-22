import {
  convertToModelMessages,
  type UIMessage,
  streamText,
  generateId,
} from "ai";

import { getModelById } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import {
  deleteChatById,
  getChatById,
  saveChat,
  getSystemPromptById,
} from "@/db/queries";

export async function POST(request: Request) {
  const {
    id,
    messages,
    modelId,
    systemPromptId,
  }: {
    id: string;
    messages: UIMessage[];
    modelId: string;
    systemPromptId?: string;
  } = await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  let systemMessage: string | undefined;
  if (systemPromptId && session.user?.id) {
    const prompt = await getSystemPromptById({ id: systemPromptId });
    if (prompt && prompt.userId === session.user.id) {
      systemMessage = prompt.content;
    }
  }

  const coreMessages = await convertToModelMessages(messages);
  const messageId = generateId();

  const result = streamText({
    model: getModelById(modelId),
    system: systemMessage,
    messages: coreMessages,
  });

  return result.toUIMessageStreamResponse({
    generateMessageId: () => messageId,
    onError: (error) => {
      console.error("Error during message streaming:", error);
      return "Error: " + (error as Error).message;
    },
    onFinish: async ({ responseMessage }) => {
      if (session.user && session.user.id) {
        try {
          await saveChat({
            id,
            messages: [
              ...messages,
              { ...responseMessage, id: messageId } as UIMessage,
            ],
            userId: session.user.id,
            systemPromptId,
          });
        } catch (error) {
          console.error("Failed to save chat");
        }
      }
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (!chat || chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (!chat || chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages }: { messages: UIMessage[] } = await request.json();

    await saveChat({
      id,
      messages,
      userId: session.user.id,
    });

    return new Response("Chat updated", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
