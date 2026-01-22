"use client";

import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { PencilEditIcon, PlusIcon, TrashIcon } from "@/components/custom/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SystemPrompt } from "@/db/schema";
import { fetcher } from "@/lib/utils";

interface SystemPromptManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Mode = "list" | "create" | "edit";

export function SystemPromptManager({
  open,
  onOpenChange,
}: SystemPromptManagerProps) {
  const [mode, setMode] = useState<Mode>("list");
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: prompts, mutate } = useSWR<Array<SystemPrompt>>(
    "/api/system-prompts",
    fetcher,
    {
      fallbackData: [],
    }
  );

  const resetForm = () => {
    setMode("list");
    setEditingPrompt(null);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const content = formData.get("content") as string;
    const isDefault = formData.get("isDefault") === "on";

    const promise = fetch("/api/system-prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, content, isDefault }),
    }).then(async (res) => {
      if (!res.ok) throw new Error("Failed to create prompt");
      return res.json();
    });

    toast.promise(promise, {
      loading: "Creating prompt...",
      success: () => {
        mutate();
        resetForm();
        return "Prompt created successfully";
      },
      error: "Failed to create prompt",
    });
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPrompt) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const content = formData.get("content") as string;
    const isDefault = formData.get("isDefault") === "on";

    const promise = fetch("/api/system-prompts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingPrompt.id,
        name,
        content,
        isDefault,
      }),
    }).then(async (res) => {
      if (!res.ok) throw new Error("Failed to update prompt");
      return res.json();
    });

    toast.promise(promise, {
      loading: "Updating prompt...",
      success: () => {
        mutate();
        resetForm();
        return "Prompt updated successfully";
      },
      error: "Failed to update prompt",
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const promise = fetch(`/api/system-prompts?id=${deleteId}`, {
      method: "DELETE",
    }).then(async (res) => {
      if (!res.ok) throw new Error("Failed to delete prompt");
      return res.json();
    });

    toast.promise(promise, {
      loading: "Deleting prompt...",
      success: () => {
        mutate((current) => current?.filter((p) => p.id !== deleteId));
        setDeleteId(null);
        return "Prompt deleted successfully";
      },
      error: "Failed to delete prompt",
    });
  };

  const promptToDelete = prompts?.find(p => p.id === deleteId);

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>
              {mode === "list" && "System Prompts"}
              {mode === "create" && "Create System Prompt"}
              {mode === "edit" && "Edit System Prompt"}
            </DialogTitle>
            <DialogDescription>
              {mode === "list" && "Manage your custom system instructions."}
              {(mode === "create" || mode === "edit") && "Define specific behavior for the AI assistant."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {mode === "list" && (
              <div className="space-y-4">
                {prompts?.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>No system prompts yet.</p>
                    <p className="text-sm">Create one to customize the AI behavior.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {prompts?.map((prompt) => (
                      <div
                        key={prompt.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-muted/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1 mr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{prompt.name}</h4>
                            {prompt.isDefault && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {prompt.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setEditingPrompt(prompt);
                              setMode("edit");
                            }}
                          >
                            <PencilEditIcon size={16} />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteId(prompt.id)}
                          >
                            <TrashIcon size={16} />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <Button
                  className="w-full gap-2 mt-4"
                  variant="outline"
                  onClick={() => setMode("create")}
                >
                  <PlusIcon size={16} />
                  Create New Prompt
                </Button>
              </div>
            )}

            {(mode === "create" || (mode === "edit" && editingPrompt)) && (
              <form
                id="prompt-form"
                onSubmit={mode === "create" ? handleCreate : handleUpdate}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Coding Assistant"
                    defaultValue={mode === "edit" ? editingPrompt?.name : ""}
                    required
                    maxLength={100}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content">Prompt Content</Label>
                  <Textarea
                    id="content"
                    name="content"
                    placeholder="You are a helpful coding assistant..."
                    defaultValue={mode === "edit" ? editingPrompt?.content : ""}
                    className="min-h-[200px] font-mono text-sm resize-none"
                    required
                  />
                </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      name="isDefault"
                      defaultChecked={mode === "edit" ? editingPrompt?.isDefault : false}
                      className="size-4 rounded border-zinc-200 text-zinc-900 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-300"
                    />
                    <Label htmlFor="isDefault" className="font-normal cursor-pointer text-muted-foreground">
                      Set as default system prompt
                    </Label>
                  </div>
              </form>
            )}
          </div>

          {(mode === "create" || mode === "edit") && (
            <div className="p-6 pt-2 border-t mt-auto flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" form="prompt-form">
                {mode === "create" ? "Create Prompt" : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(val) => !val && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the system prompt &quot;{promptToDelete?.name}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
