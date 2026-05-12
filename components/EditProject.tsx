"use client";

import { useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { db, type Project } from "@/lib/db";
import { Button, Dialog, FormControl, Spinner, TextInput, Textarea } from "@primer/react";

interface Props {
  project: Project;
}

export function EditProject({ project }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [conductedBy, setConductedBy] = useState(project.conductedBy ?? "");
  const [saving, setSaving] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function reset() {
    setName(project.name);
    setDescription(project.description ?? "");
    setConductedBy(project.conductedBy ?? "");
  }

  function handleClose() {
    setOpen(false);
    reset();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !project.id) return;
    setSaving(true);
    try {
      await db.projects.update(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        conductedBy: conductedBy.trim() || undefined,
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
    <>
      <Button
        ref={triggerRef}
        variant="default"
        size="small"
        onClick={() => setOpen(true)}
        leadingVisual={() => <Pencil className="h-3.5 w-3.5" />}
      >
        Edit
      </Button>

      {open && (
      <Dialog
        returnFocusRef={triggerRef}
        onClose={handleClose}
        title="Edit project"
      >
        <div className="p-4">
          <form id="edit-project-form" onSubmit={handleSave} className="flex flex-col gap-4">
            <FormControl required>
              <FormControl.Label>Name</FormControl.Label>
              <TextInput
                block
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                rows={3}
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
              form="edit-project-form"
              variant="primary"
              disabled={saving || !name.trim()}
            >
              {saving ? <Spinner size="small" /> : "Save"}
            </Button>
          </div>
        </Dialog.Footer>
      </Dialog>
      )}
    </>
  );
}
