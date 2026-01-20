"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { useState, useEffect } from "react";

import { models, ModelId } from "@/ai";
import { Message as PreviewMessage } from "@/components/custom/message";
import { useScrollToBottom } from "@/components/custom/use-scroll-to-bottom";

import { MultimodalInput } from "./multimodal-input";
import { Overview } from "./overview";

export function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
}) {
  const [input, setInput] = useState('');

  const [selectedModelId, setSelectedModelId] = useState<ModelId>(
    models[0].id,
  );

  useEffect(() => {
    const savedModelId = localStorage.getItem("modelId");
    if (savedModelId && models.some((m) => m.id === savedModelId)) {
      setSelectedModelId(savedModelId as ModelId);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("modelId", selectedModelId);
  }, [selectedModelId]);

  const { messages, sendMessage, stop, status } =
    useChat({
      id,
      messages: initialMessages,
      transport: new DefaultChatTransport({
        body: { id, modelId: selectedModelId },
        api: '/api/chat',
        credentials: 'include',
      }),
      onFinish: () => {
        window.history.replaceState({}, "", `/chat/${id}`);
      },
    });

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  return (
    <div className="flex flex-row justify-center pb-4 md:pb-8 h-dvh bg-background">
      <div className="flex flex-col justify-between items-center gap-4 w-full">
        <div
          ref={messagesContainerRef}
          className="flex flex-col gap-4 size-full items-center overflow-y-scroll"
        >
          {messages.length === 0 && <Overview />}

          {messages.map((message) => (
            <PreviewMessage
              key={message.id}
              chatId={id}
              role={message.role}
              content={message.parts.map((part) => {
                if (part.type === "text") {
                  return part.text;
                }
                return "";
              }).join("")}
              parts={message.parts}
            />
          ))}

          {status === "submitted" &&
            messages.length > 0 &&
            messages[messages.length - 1].role === "user" && (
              <PreviewMessage
                chatId={id}
                role="assistant"
                content=""
                isLoading={true}
              />
            )}

          <div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>

        <form className="flex flex-row gap-2 relative items-end w-full md:max-w-3xl lg:max-w-4xl px-4 md:px-0">
          <MultimodalInput
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            isLoading={status === "submitted"}
            stop={stop}
            selectedModelId={selectedModelId}
            setSelectedModelId={setSelectedModelId}
          />
        </form>
      </div>
    </div>
  );
}
