"use client";

import { useState } from "react";
import { Loader2, Pencil, Lock } from "lucide-react";
import { toast } from "sonner";
import { db, type Project } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  project: Project;
}

export function EditProject({ project }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [owner, setOwner] = useState(project.owner ?? "");
  const [saving, setSaving] = useState(false);

  const isLocked = !!project.owner;

  if (isLocked) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Lock className="h-3.5 w-3.5" />
        <span>Locked by {project.owner}</span>
      </div>
    );
  }

  function reset() {
    setName(project.name);
    setDescription(project.description ?? "");
    setOwner(project.owner ?? "");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !project.id) return;
    setSaving(true);
    try {
      await db.projects.update(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        owner: owner.trim() || undefined,
      });
      toast.success("Project updated");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>
            Update the project details. Setting an owner will lock the project
            from further edits.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-owner">Owner / Conducted by</Label>
            <Input
              id="edit-owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Leave blank to keep the project open for editing"
            />
            {owner.trim() && (
              <p className="text-xs text-amber-600">
                ⚠ Adding an owner will lock this project from further edits.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
