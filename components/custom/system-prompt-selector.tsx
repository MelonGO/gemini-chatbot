"use client";

import { Check, ChevronDown } from "lucide-react";
import useSWR from "swr";

import { SettingsIcon } from "@/components/custom/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SystemPrompt } from "@/db/schema";
import { cn, fetcher } from "@/lib/utils";

interface SystemPromptSelectorProps {
  selectedPromptId: string | null;
  onSelectPrompt: (id: string | null) => void;
  onManagePrompts: () => void;
  disabled?: boolean;
}

export function SystemPromptSelector({
  selectedPromptId,
  onSelectPrompt,
  onManagePrompts,
  disabled,
}: SystemPromptSelectorProps) {
  const { data: prompts } = useSWR<Array<SystemPrompt>>(
    "/api/system-prompts",
    fetcher,
    {
      fallbackData: [],
    }
  );

  const selectedPrompt = prompts?.find((p) => p.id === selectedPromptId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between gap-2 px-3 font-normal",
            !selectedPrompt && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedPrompt ? selectedPrompt.name : "No system prompt"}
          </span>
          <ChevronDown className="size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        <DropdownMenuItem
          onSelect={() => onSelectPrompt(null)}
          className="gap-2"
        >
          <div className="flex size-4 items-center justify-center">
            {!selectedPromptId && <Check className="size-4" />}
          </div>
          No system prompt
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <div className="max-h-[200px] overflow-y-auto">
          {prompts?.map((prompt) => (
            <DropdownMenuItem
              key={prompt.id}
              onSelect={() => onSelectPrompt(prompt.id)}
              className="gap-2"
            >
              <div className="flex size-4 items-center justify-center">
                {selectedPromptId === prompt.id && (
                  <Check className="size-4" />
                )}
              </div>
              <span className="truncate">{prompt.name}</span>
            </DropdownMenuItem>
          ))}
          {prompts?.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
              No prompts saved
            </div>
          )}
        </div>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onSelect={onManagePrompts}
          className="gap-2 text-muted-foreground"
        >
          <div className="flex size-4 items-center justify-center">
            <SettingsIcon size={14} />
          </div>
          Manage prompts...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
