"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button, Dialog } from "@primer/react";
import { UploadSession } from "@/components/UploadSession";

interface Props {
  projectId: number;
}

export function NewSessionModal({ projectId }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button
        ref={triggerRef}
        variant="primary"
        onClick={() => setOpen(true)}
        leadingVisual={() => <Plus className="h-4 w-4" />}
      >
        New Session
      </Button>

      {open && (
        <Dialog
          returnFocusRef={triggerRef}
          onClose={() => setOpen(false)}
          title="Add a New Session"
          width="xlarge"
        >
          <Dialog.Body>
            <UploadSession projectId={projectId} onSuccess={() => setOpen(false)} />
          </Dialog.Body>
        </Dialog>
      )}
    </>
  );
}
