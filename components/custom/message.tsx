"use client";

import { Attachment, ToolInvocation } from "ai";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Streamdown } from "streamdown";
import { useCopyToClipboard } from "usehooks-ts";
import { toast } from "sonner";
import { CopyIcon } from "lucide-react";

import { BotIcon, UserIcon, LoaderIcon } from "./icons";
import { PreviewAttachment } from "./preview-attachment";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const CopyButton = ({ content, className }: { content: string; className?: string }) => {
  const [_, copy] = useCopyToClipboard();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800",
        className,
      )}
      onClick={() => {
        copy(content).then(() => {
          toast.success("Copied to clipboard!");
        });
      }}
    >
      <CopyIcon size={14} />
    </Button>
  );
};

export const Message = ({
  role,
  content,
  attachments,
  isLoading,
}: {
  chatId: string;
  role: string;
  content: string | ReactNode;
  toolInvocations: Array<ToolInvocation> | undefined;
  attachments?: Array<Attachment>;
  isLoading?: boolean;
}) => {
  const isAssistant = role === "assistant";

  return (
    <motion.div
      className={cn(
        "flex flex-row gap-3 px-4 w-full max-w-3xl md:max-w-4xl lg:max-w-5xl first-of-type:pt-20",
        isAssistant ? "justify-start" : "flex-row-reverse",
      )}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div
        className={cn(
          "size-[24px] border rounded-full flex flex-col justify-center items-center shrink-0",
          isAssistant
            ? "bg-background text-zinc-500"
            : "bg-primary text-primary-foreground",
        )}
      >
        {isAssistant ? <BotIcon /> : <UserIcon />}
      </div>

      <div
        className={cn(
          "flex flex-col gap-2 flex-1 min-w-0",
          isAssistant ? "items-start" : "items-end",
        )}
      >
        {content && typeof content === "string" && (
          <div
            className={cn(
              "flex flex-row gap-2 items-start group w-full",
              isAssistant ? "justify-start" : "justify-end",
            )}
          >
            {!isAssistant && (
              <div className="shrink-0 pt-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                <CopyButton content={content} />
              </div>
            )}

            <div
              className={cn(
                "p-3 rounded-2xl text-sm md:text-base shadow-sm overflow-x-auto min-w-0",
                isAssistant
                  ? "bg-muted text-zinc-800 dark:text-zinc-300 rounded-tl-none border border-border"
                  : "bg-primary text-primary-foreground rounded-tr-none",
              )}
            >
              <div className="flex flex-col gap-4">
                <Streamdown>{content}</Streamdown>
              </div>
            </div>

            {isAssistant && (
              <div className="shrink-0 pt-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                <CopyButton content={content} />
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex flex-row items-center gap-2 text-zinc-500 bg-muted px-3 py-1.5 rounded-full border border-border">
            <div className="animate-spin">
              <LoaderIcon />
            </div>
            <div className="text-sm italic">AI is thinking...</div>
          </div>
        )}

        {attachments && (
          <div
            className={cn(
              "flex flex-row gap-2 flex-wrap",
              isAssistant ? "justify-start" : "justify-end",
            )}
          >
            {attachments.map((attachment) => (
              <PreviewAttachment key={attachment.url} attachment={attachment} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
