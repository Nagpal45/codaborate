'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useproject from "@/hooks/useProject";
import { useState } from "react";
import { toast } from "sonner";

const InviteButton = () => {
  const { projectId } = useproject();
  const [open, setOpen] = useState(false);
  const inviteLink =
  typeof window !== "undefined"
    ? `${window.location.origin}/join/${projectId}`
    : "";

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Members</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500">
          Ask them to copy and paste this link
        </p>
        <Input
          readOnly
          className="mt-4"
          onClick={() => {
            navigator.clipboard.writeText(
              inviteLink,
            );
            toast.success("Link copied to clipboard!");
          }}
          value={inviteLink}  
        />
      </DialogContent>
    </Dialog>
    <Button size='sm' onClick={() => setOpen(true)}>Invite</Button>
    </>
  );
};

export default InviteButton;
