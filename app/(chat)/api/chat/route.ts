import { convertToCoreMessages, Message, streamText } from "ai";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";

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
  }: { id: string; messages: Array<Message>; modelId: string } =
    await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0,
  );

  const result = await streamText({
    model: getModelById(modelId),
    messages: coreMessages,
    onFinish: async ({ responseMessages }) => {
      if (session.user && session.user.id) {
        try {
          await saveChat({
            id,
            messages: [...coreMessages, ...responseMessages],
            userId: session.user.id,
          });
        } catch (error) {
          console.error("Failed to save chat");
        }
      }
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
  });

  return result.toDataStreamResponse({});
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

    const messages = chat.messages as Array<Message>;
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
      if (message.experimental_attachments) {
        for (const attachment of message.experimental_attachments) {
          if (attachment.url) {
            addKeyFromUrl(attachment.url);
          }
        }
      }

      if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (part.type === "image" && part.image) {
            if (typeof part.image === "string" && part.image.startsWith("http")) {
              addKeyFromUrl(part.image);
            }
          } else if (part.type === "file" && part.data) {
            if (typeof part.data === "string" && part.data.startsWith("http")) {
              addKeyFromUrl(part.data);
            }
          }
        }
      }
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
