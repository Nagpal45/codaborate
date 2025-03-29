"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Presentation, Upload } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadFile } from "@/lib/supabase";
import { api } from "@/trpc/react";
import useproject from "@/hooks/useProject";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const MeetingCard = () => {
    const {project} = useproject();
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const uploadMeeting = api.project.uploadMeeting.useMutation();

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a"],
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024,
    onDrop: async (acceptedFiles) => {
        if(!project) return;
      setIsUploading(true);
      const file = acceptedFiles[0];
      if(!file) return;
      const downloadURL = await uploadFile(file as File) as string;

      uploadMeeting.mutate({
        projectId: project?.id,
        meetingAudioURL: downloadURL,
        name: file.name,
      },{
        onSuccess: () => {
            toast.success("Meeting uploaded successfully!");
            router.push(`/meetings`)
        },
        onError: (error) => {
          console.error("Error uploading meeting:", error);
        },
      })
      setIsUploading(false);
    },
  });


  return (
    <Card
      className="col-span-2 flex flex-col items-center justify-center p-10"
      {...getRootProps()}
    >
      {!isUploading && (
        <>
          <Presentation className="h-10 w-10 animate-bounce" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            Create a new meeting
          </h3>
          <p className="mt-1 text-center text-sm text-gray-500">
            Analyse your meeting with codameet
            <br />
            Powered by AI.
          </p>
          <div className="mt-6">
            <Button disabled={isUploading}>
              <Upload className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Upload Meeting
              <input className="hidden" {...getInputProps()} />
            </Button>
          </div>
        </>
      )}
      {isUploading && (
        <div className="">
          <p className="text-center text-sm text-gray-500">
            Uploading your meeting...
          </p>
        </div>
      )}
    </Card>
  );
};

export default MeetingCard;
