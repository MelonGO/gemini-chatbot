import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { convertToModelMessages, type UIMessage, streamText } from "ai";

import { getModelById } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import {
  deleteChatById,
  getChatById,
  saveChat,
} from "@/db/queries";
import { r2Client } from "@/lib/r2";

export async function POST(request: Request) {
  const {
    id,
    messages,
    modelId,
  }: { id: string; messages: UIMessage[]; modelId: string } =
    await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: getModelById(modelId),
    messages: coreMessages,
  });

  return result.toUIMessageStreamResponse({
    onFinish: async ({ responseMessage }) => {
      if (session.user && session.user.id) {
        try {
          await saveChat({
            id,
            messages: [...messages, responseMessage],
            userId: session.user.id,
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

    const messages = chat.messages as UIMessage[];
    const fileKeys: Array<{ Key: string }> = [];

    const r2PublicDomain = process.env.R2_PUBLIC_DOMAIN
      ? new URL(process.env.R2_PUBLIC_DOMAIN).hostname
      : null;

    const addKeyFromUrl = (urlString: string) => {
      try {
        const url = new URL(urlString);
        if (r2PublicDomain && url.hostname !== r2PublicDomain) return;

        const key = decodeURIComponent(url.pathname.slice(1));
        if (key && !fileKeys.some((fk) => fk.Key === key)) {
          fileKeys.push({ Key: key });
        }
      } catch (e) {
        // Not a valid URL
      }
    };

    for (const message of messages) {
      message.parts.map((part, index) => {
        if (part.type === 'file' && part.mediaType?.startsWith('image/')) {
          if (part.url) {
            addKeyFromUrl(part.url);
          }
        }

        if (part.type === 'file' && part.mediaType?.startsWith('application/pdf')) {
          if (part.url) {
            addKeyFromUrl(part.url);
          }
        }
      });
    }

    console.log("Deleting files from R2:", fileKeys);

    if (fileKeys.length > 0) {
      const command = new DeleteObjectsCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Delete: {
          Objects: fileKeys,
        },
      });

      await r2Client.send(command);
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
