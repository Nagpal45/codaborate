'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import useproject from "@/hooks/useProject";
import { Code } from "lucide-react";
import { useState } from "react";
import { askQuestion } from "./action";
import { readStreamableValue } from "ai/rsc";
import MDEditor from '@uiw/react-md-editor';
import CodeReferences from "./codeReferences";
import { api } from "@/trpc/react";
import { toast } from "sonner";

const AskQuestionCard = () => {
    const {project} = useproject();
    const [question, setQuestion] = useState('');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [filesReferences, setFilesReferences] = useState<{fileName:string; sourceCode:string; summary:string}[]>([]);
    const [answer, setAnswer] = useState('');
    const saveAnswer = api.project.saveAnswer.useMutation();

    const onSubmit = async(e: React.FormEvent) => {
        setAnswer('');
        setFilesReferences([]);
        e.preventDefault();
        if(!project?.id) return;
        setLoading(true);
        
        const {output, filesReferences} = await askQuestion(question, project.id);
        setOpen(true);
        setFilesReferences(filesReferences);

        for await (const delta of readStreamableValue(output)) {
            if(delta){
                setAnswer(ans => ans + delta);
            }
        }

        setLoading(false);
    }

    return (
        <>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[80vw] max-h-[90vh] overflow-y-scroll">
            <DialogHeader><div className="flex items-center gap-2">
                <DialogTitle>
                    <Code width={40} height={40} />
                </DialogTitle>
                <Button disabled={saveAnswer.isPending}  variant="outline" onClick={() => {saveAnswer.mutate({projectId: project!.id, question, answer, filesReferences},{
                    onSuccess: () => {
                        toast.success('Answer saved!');
                    },
                    onError: (err) => {
                        toast.error('Failed to save answer');
                    }
                })}}>
                    Save Answer
                </Button>
            </div>
            </DialogHeader>
            <MDEditor.Markdown source={answer} className="max-w-[70vw] h-full  overflow-y-scroll" style={{
                background: 'white',
                color: 'black',
                //hide scrollbar
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
            }} />
            <div className="h-4"></div>
            <CodeReferences fileReferences={filesReferences} />
            <Button type = "button" onClick={() => setOpen(false)}>
                Close
            </Button>
            </DialogContent>
        </Dialog>
        <Card className="relative col-span-3">
            <CardHeader>
                <CardTitle>Ask a question</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit}>
                    <Textarea placeholder="Which file should I edit to change the home page?" value={question} onChange={(e) => setQuestion(e.target.value)}/>
                    <div className="h-4"></div>
                    <Button type="submit" disabled={loading}>
                        Ask Codabot!
                    </Button>
                </form>
            </CardContent>
        </Card>
        </>
    )
}

export default AskQuestionCard;