"use client";

import { Attachment, Message } from "ai";
import { useChat } from "ai/react";
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
  initialMessages: Array<Message>;
}) {
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

  const { messages, handleSubmit, input, setInput, append, isLoading, stop } =
    useChat({
      id,
      body: { id, modelId: selectedModelId },
      initialMessages,
      maxSteps: 10,
      onFinish: () => {
        window.history.replaceState({}, "", `/chat/${id}`);
      },
    });

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  return (
    <div className="flex flex-row justify-center pb-4 md:pb-8 h-dvh bg-background">
      <div className="flex flex-col justify-between items-center gap-4 w-full">
        <div
          ref={messagesContainerRef}
          className="flex flex-col gap-4 h-full w-full items-center overflow-y-scroll"
        >
          {messages.length === 0 && <Overview />}

          {messages.map((message) => (
            <PreviewMessage
              key={message.id}
              chatId={id}
              role={message.role}
              content={message.content}
              attachments={message.experimental_attachments}
              toolInvocations={message.toolInvocations}
            />
          ))}

          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1].role === "user" && (
              <PreviewMessage
                chatId={id}
                role="assistant"
                content=""
                isLoading={true}
                toolInvocations={[]}
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
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            append={append}
            selectedModelId={selectedModelId}
            setSelectedModelId={setSelectedModelId}
          />
        </form>
      </div>
    </div>
  );
}
