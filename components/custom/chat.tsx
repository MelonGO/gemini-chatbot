"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage, UIMessagePart } from "ai";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { models, ModelId } from "@/ai";
import { Message as PreviewMessage } from "@/components/custom/message";
import { useScrollToBottom } from "@/components/custom/use-scroll-to-bottom";
import { SystemPrompt } from "@/db/schema";
import { fetcher } from "@/lib/utils";

import { MultimodalInput } from "./multimodal-input";
import { Overview } from "./overview";
import { SystemPromptManager } from "./system-prompt-manager";

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

  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [showPromptManager, setShowPromptManager] = useState(false);

  const { data: prompts } = useSWR<Array<SystemPrompt>>(
    "/api/system-prompts",
    fetcher,
    { fallbackData: [] }
  );

  useEffect(() => {
    if (initialMessages.length === 0 && prompts && prompts.length > 0) {
      const defaultPrompt = prompts.find((p) => p.isDefault);
      if (defaultPrompt && selectedPromptId === null) {
        setSelectedPromptId(defaultPrompt.id);
      }
    }
  }, [prompts, initialMessages.length, selectedPromptId]);

  useEffect(() => {
    const savedModelId = localStorage.getItem("modelId");
    if (savedModelId && models.some((m) => m.id === savedModelId)) {
      setSelectedModelId(savedModelId as ModelId);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("modelId", selectedModelId);
  }, [selectedModelId]);

  const { messages, sendMessage, stop, regenerate, status, setMessages } =
    useChat({
      id,
      messages: initialMessages,
      transport: new DefaultChatTransport({
        body: { id, modelId: selectedModelId },
        api: '/api/chat',
        credentials: 'include',
      }),
      onError: (error) => {
        toast.error("Something went wrong: " + (error as Error).message);
      },
      onFinish: () => {
        window.history.replaceState({}, "", `/chat/${id}`);
      },
    });

  const isPromptLocked = initialMessages.length > 0 || messages.length > 0;

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [savingMessageId, setSavingMessageId] = useState<string | null>(null);

  const extractText = (message: UIMessage) => {
    if (message.parts && message.parts.length > 0) {
      return message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");
    }

    return "";
  };

  const updateMessageText = (message: UIMessage, nextText: string) => {
    const textPart = {
      type: "text",
      text: nextText,
    } as UIMessagePart<any, any>;

    if (message.parts && message.parts.length > 0) {
      const hasTextPart = message.parts.some((part) => part.type === "text");
      const nextParts = message.parts.map((part) =>
        part.type === "text"
          ? ({ ...part, text: nextText } as UIMessagePart<any, any>)
          : (part as UIMessagePart<any, any>),
      );

      if (!hasTextPart) {
        nextParts.push(textPart as UIMessagePart<any, any>);
      }

      return { ...message, parts: nextParts as UIMessagePart<any, any>[] };
    }

    return {
      ...message,
      parts: [textPart as UIMessagePart<any, any>],
    } as UIMessage;
  };

  const persistMessages = async (nextMessages: UIMessage[], fallback: UIMessage[]) => {
    try {
      const response = await fetch(`/api/chat?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed to update messages");
      }
    } catch (error) {
      setMessages(fallback);
      toast.error("Failed to update message. Please try again.");
    } finally {
      setSavingMessageId(null);
    }
  };

  const handleEditStart = (message: UIMessage) => {
    setEditingMessageId(message.id);
    setDraftText(extractText(message));
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setDraftText("");
  };

  const handleEditSave = async (messageId: string) => {
    const previousMessages = messages;
    const nextMessages = messages.map((message) =>
      message.id === messageId ? updateMessageText(message, draftText) : message,
    ) as UIMessage[];

    setMessages(nextMessages);
    setEditingMessageId(null);
    setSavingMessageId(messageId);
    setDraftText("");

    await persistMessages(nextMessages, previousMessages);
  };

  const handleDelete = async (messageId: string) => {
    const previousMessages = messages;
    const nextMessages = messages.filter((message) => message.id !== messageId) as UIMessage[];

    setMessages(nextMessages);
    setEditingMessageId(null);
    setSavingMessageId(messageId);

    await persistMessages(nextMessages, previousMessages);
  };

  const handleRegenerate = async (index: number) => {
    stop();

    const previousMessages = messages;
    const messageToRegenerate = messages[index];

    // If regenerating an assistant message, we keep everything up to the previous message (the user prompt)
    // If regenerating a user message, we keep everything up to that message
    const truncateIndex = messageToRegenerate.role === "assistant" ? index : index + 1;
    const nextMessages = messages.slice(0, truncateIndex);

    setMessages(nextMessages);

    await persistMessages(nextMessages, previousMessages);

    try {
      await regenerate();
    } catch (error) {
      toast.error("Failed to regenerate message: " + (error as Error).message);
    }
  };

  return (
    <>
      <div className="flex flex-row justify-center pb-4 md:pb-8 h-dvh bg-background">
        <div className="flex flex-col justify-between items-center gap-4 w-full">
          <div
            ref={messagesContainerRef}
            className="flex flex-col gap-4 size-full items-center overflow-y-scroll"
          >
            {messages.length === 0 && (
              <Overview
                selectedPromptId={selectedPromptId}
                onSelectPrompt={setSelectedPromptId}
                onManagePrompts={() => setShowPromptManager(true)}
                isPromptLocked={isPromptLocked}
              />
            )}

            {messages.map((message, index) => (
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
                isEditing={editingMessageId === message.id}
                isSaving={savingMessageId === message.id}
                editedText={draftText}
                onEditStart={() => handleEditStart(message)}
                onEditCancel={handleEditCancel}
                onEditChange={setDraftText}
                onEditSave={() => handleEditSave(message.id)}
                onDelete={() => handleDelete(message.id)}
                onRegenerate={() => handleRegenerate(index)}
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
              systemPromptId={selectedPromptId}
            />
          </form>
        </div>
      </div>

      <SystemPromptManager
        open={showPromptManager}
        onOpenChange={setShowPromptManager}
      />
    </>
  );
}
