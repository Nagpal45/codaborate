"use client";

import { Button } from "@/components/ui/button";
import useproject from "@/hooks/useProject";
import useRefetch from "@/hooks/useRefetch";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export const ArchiveButton = () => {
  const archiveProject = api.project.archiveProject.useMutation();
  const { projectId } = useproject();
  const refetch = useRefetch();

  return (
    <Button
      onClick={() => {
        const confirm = window.confirm(
          "Are you sure you want to archive this project?",
        );
        if (confirm) {
          archiveProject.mutateAsync(
            { projectId },
            {
              onSuccess: () => {
                toast.success("Project archived successfully");
                refetch();
              },
              onError: (error) => {
                toast.error(error.message);
              },
            },
          );
        }
      }}
      disabled={archiveProject.isPending}
      size="sm"
      variant="destructive"
    >
      Archive
    </Button>
  );
};
