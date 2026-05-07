"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function CreateProject() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await db.projects.add({
        name: name.trim(),
        description: description.trim() || undefined,
        owner: owner.trim() || undefined,
        createdAt: new Date(),
      });
      setName("");
      setDescription("");
      setOwner("");
      setOpen(false);
      toast.success("Project created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create project");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Card
        className="border-dashed border-2 hover:border-blue-400 cursor-pointer transition-colors h-full flex items-center justify-center min-h-[160px]"
        onClick={() => setOpen(true)}
      >
        <CardContent className="flex flex-col items-center justify-center gap-2 text-neutral-500 hover:text-blue-600">
          <Plus className="h-6 w-6" />
          <span className="text-sm font-medium">New project</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Onboarding research Q2"
              autoFocus
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-description">Description (optional)</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Goals, scope, who's involved..."
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-owner">Owner / Conducted by (optional)</Label>
            <Input
              id="project-owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g. Kiefer Ortuoste"
            />
            <p className="text-xs text-neutral-500">
              Setting an owner locks this project from being edited by others.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setName("");
                setDescription("");
                setOwner("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
