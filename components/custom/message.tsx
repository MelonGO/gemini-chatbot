"use client";

import { UIMessagePart } from "ai";
import { motion } from "framer-motion";
import { CopyIcon, RefreshCcw } from "lucide-react";
import { ReactNode, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { useCopyToClipboard } from "usehooks-ts";

import { cn } from "@/lib/utils";

import { BotIcon, UserIcon, LoaderIcon } from "./icons";
import { PreviewAttachment } from "./preview-attachment";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

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

type MessageProps =
  | {
    chatId?: string;
    role: string;
    content: string | ReactNode;
    parts?: Array<UIMessagePart<any, any>>;
    isLoading?: boolean;
    isEditing?: false;
    isSaving?: boolean;
    editedText?: string;
    onEditStart?: () => void;
    onEditCancel?: () => void;
    onEditChange?: (value: string) => void;
    onEditSave?: () => void;
    onDelete?: () => void;
    onRegenerate?: () => void;
  }
  | {
    chatId?: string;
    role: string;
    content: string | ReactNode;
    parts?: Array<UIMessagePart<any, any>>;
    isLoading?: boolean;
    isEditing: true;
    isSaving?: boolean;
    editedText: string;
    onEditStart: () => void;
    onEditCancel: () => void;
    onEditChange: (value: string) => void;
    onEditSave: () => void;
    onDelete: () => void;
    onRegenerate?: () => void;
  };

export const Message = ({
  role,
  content,
  parts,
  isLoading,
  isEditing,
  isSaving,
  editedText,
  onEditStart,
  onEditCancel,
  onEditChange,
  onEditSave,
  onDelete,
  onRegenerate,
}: MessageProps) => {
  const isAssistant = role === "assistant";
  const canEdit = typeof content === "string";
  const isEditable = Boolean(onEditSave && onEditCancel && onEditChange);

  // Create a ref for the textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Programmatically focus when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const length = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(length, length);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);


  const renderActions = (text: string) => (
    <div className="flex flex-row gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
      <CopyButton content={text} />
      {canEdit && !isEditing && isEditable && onEditStart && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEditStart}
          className="h-8 px-2 text-[11px] font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Edit
        </Button>
      )}
      {canEdit && !isEditing && isEditable && onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 px-2 text-[11px] font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Delete
        </Button>
      )}
      {!isEditing && onRegenerate && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          onClick={onRegenerate}
        >
          <RefreshCcw size={14} />
        </Button>
      )}
    </div>
  );

  const renderEditControls = () => {
    if (!isEditable || !onEditSave || !onEditCancel) {
      return null;
    }

    return (
      <div className="flex flex-row gap-2">
        <Button
          type="button"
          size="sm"
          onClick={onEditSave}
          disabled={isSaving || !editedText?.trim()}
        >
          Save
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEditCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
      </div>
    );
  };

  return (
    <motion.div
      className={cn(
        "flex flex-row gap-3 px-4 w-full max-w-3xl md:max-w-4xl lg:max-w-5xl first-of-type:pt-20 min-w-0",
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
        {parts ? (
          <div
            className={cn(
              "flex flex-col gap-2 w-full",
              isAssistant ? "items-start" : "items-end",
            )}
          >
            {parts.map((part, index) => {
              if (part.type === "text") {
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex flex-col gap-2 group w-full",
                      isAssistant ? "items-start" : "items-end",
                    )}
                  >
                    {renderActions(part.text)}

                    <div
                      className={cn(
                        "p-3 rounded-2xl text-sm md:text-base shadow-sm min-w-0 max-w-full",
                        // Only apply overflow-x-auto and break-words when NOT editing
                        !isEditing && "overflow-x-auto break-words",
                        isAssistant
                          ? "bg-muted text-zinc-800 dark:text-zinc-300 rounded-tl-none border border-border"
                          : "bg-primary text-secondary-foreground rounded-tr-none",
                        isEditing && "w-full",
                      )}
                    >
                      {isEditing ? (
                        <div className="flex flex-col gap-3">
                          <Textarea
                            ref={textareaRef}
                            value={editedText ?? ""}
                            onChange={(event) =>
                              onEditChange(event.target.value)
                            }
                            className="min-h-[300px] text-sm md:text-base"
                            disabled={isSaving}
                          />
                          {renderEditControls()}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <Streamdown>{part.text}</Streamdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              if (part.type === "file") {
                return (
                  <PreviewAttachment
                    key={part.url}
                    attachment={{
                      url: part.url,
                      name: part.filename,
                      contentType: part.mediaType,
                    }}
                  />
                );
              }

              return null;
            })}
          </div>
        ) : (
          content &&
          typeof content === "string" && (
            <div
              className={cn(
                "flex flex-col gap-2 group w-full",
                isAssistant ? "items-start" : "items-end",
              )}
            >
              {renderActions(content)}

              <div
                className={cn(
                  "p-3 rounded-2xl text-sm md:text-base shadow-sm min-w-0 max-w-full",
                  // Only apply overflow-x-auto and break-words when NOT editing
                  !isEditing && "overflow-x-auto break-words",
                  isAssistant
                    ? "bg-muted text-zinc-800 dark:text-zinc-300 rounded-tl-none border border-border"
                    : "bg-primary text-primary-foreground rounded-tr-none",
                )}
              >
                {isEditing ? (
                  <div className="flex flex-col gap-3">
                    <Textarea
                      ref={textareaRef}
                      value={editedText ?? ""}
                      onChange={(event) => onEditChange(event.target.value)}
                      className="min-h-[300px] text-sm md:text-base"
                      disabled={isSaving}
                    />
                    {renderEditControls()}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <Streamdown>{content}</Streamdown>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {isLoading && (
          <div className="flex flex-row items-center gap-2 text-zinc-500 bg-muted px-3 py-1.5 rounded-full border border-border">
            <div className="animate-spin">
              <LoaderIcon />
            </div>
            <div className="text-sm italic">AI is thinking...</div>
          </div>
        )}
      </div>
    </motion.div>
  );
};