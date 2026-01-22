import { motion } from "framer-motion";
import Link from "next/link";

import { MessageIcon, VercelIcon } from "./icons";
import { SystemPromptSelector } from "./system-prompt-selector";

interface OverviewProps {
  selectedPromptId: string | null;
  onSelectPrompt: (id: string | null) => void;
  onManagePrompts: () => void;
  isPromptLocked?: boolean;
}

export const Overview = ({
  selectedPromptId,
  onSelectPrompt,
  onManagePrompts,
  isPromptLocked,
}: OverviewProps) => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mt-20 mx-4 md:mx-0"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="border-none bg-muted/50 rounded-2xl p-6 flex flex-col gap-4 text-zinc-500 text-sm dark:text-zinc-400 dark:border-zinc-700">
        <p className="flex flex-row justify-center gap-4 items-center text-zinc-900 dark:text-zinc-50">
          <VercelIcon />
          <span>+</span>
          <MessageIcon />
        </p>
        <p>
          This is an open source Chatbot template powered by the Google Gemini
          model built with Next.js and the AI SDK by Vercel. It uses the{" "}
          <code className="rounded-sm bg-muted-foreground/15 px-1.5 py-0.5">
            streamText
          </code>{" "}
          function in the server and the{" "}
          <code className="rounded-sm bg-muted-foreground/15 px-1.5 py-0.5">
            useChat
          </code>{" "}
          hook on the client to create a seamless chat experience.
        </p>
        <p>
          {" "}
          You can learn more about the AI SDK by visiting the{" "}
          <Link
            className="text-blue-500 dark:text-blue-400"
            href="https://sdk.vercel.ai/docs"
            target="_blank"
          >
            Docs
          </Link>
          .
        </p>
        
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 mt-2">
          <p className="text-xs text-muted-foreground mb-2">System Prompt</p>
          <SystemPromptSelector
            selectedPromptId={selectedPromptId}
            onSelectPrompt={onSelectPrompt}
            onManagePrompts={onManagePrompts}
            disabled={isPromptLocked}
          />
        </div>
      </div>
    </motion.div>
  );
};
