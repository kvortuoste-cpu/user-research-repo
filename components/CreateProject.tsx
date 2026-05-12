"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { Button, Dialog, FormControl, Spinner, TextInput, Textarea } from "@primer/react";

export function CreateProject() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [conductedBy, setConductedBy] = useState("");
  const [saving, setSaving] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function handleClose() {
    setOpen(false);
    setName("");
    setDescription("");
    setConductedBy("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await db.projects.add({
        name: name.trim(),
        description: description.trim() || undefined,
        conductedBy: conductedBy.trim() || undefined,
        createdAt: new Date(),
      });
      toast.success("Project created");
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Dashed "New project" card trigger */}
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className="flex flex-col items-center justify-center gap-2 w-full min-h-[160px] border-2 border-dashed border-[#e2e3e5] rounded-lg bg-white text-[#6d6d6f] cursor-pointer transition-all hover:border-[#1460aa] hover:text-[#1460aa]"
        aria-label="Create new project"
      >
        <Plus className="h-6 w-6" />
        <span className="text-sm font-semibold">New project</span>
      </button>

      {open && (
      <Dialog
        returnFocusRef={triggerRef}
        onClose={handleClose}
        title="New project"
      >
        <div className="p-4">
          <form id="create-project-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormControl required>
              <FormControl.Label>Name</FormControl.Label>
              <TextInput
                block
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Onboarding research Q2"
                autoFocus
              />
            </FormControl>
            <FormControl>
              <FormControl.Label>
                Description{" "}
                <span className="text-[#6d6d6f] font-normal">(optional)</span>
              </FormControl.Label>
              <Textarea
                block
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Goals, scope, who's involved..."
                rows={2}
              />
            </FormControl>
            <FormControl>
              <FormControl.Label>
                Conducted by{" "}
                <span className="text-[#6d6d6f] font-normal">(optional)</span>
              </FormControl.Label>
              <TextInput
                block
                value={conductedBy}
                onChange={(e) => setConductedBy(e.target.value)}
                placeholder="e.g. Kiefer Ortuoste"
              />
            </FormControl>
          </form>
        </div>
        <Dialog.Footer>
          <div className="flex gap-2 justify-end">
            <Button variant="default" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-project-form"
              variant="primary"
              disabled={saving || !name.trim()}
            >
              {saving ? <Spinner size="small" /> : "Create"}
            </Button>
          </div>
        </Dialog.Footer>
      </Dialog>
      )}
    </>
  );
}
