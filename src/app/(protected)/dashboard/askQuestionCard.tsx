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

const AskQuestionCard = () => {
    const {project} = useproject();
    const [question, setQuestion] = useState('');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [filesReferences, setFilesReferences] = useState<{fileName:string; sourceCode:string; summary:string}[]>([]);
    const [answer, setAnswer] = useState('');

    const onSubmit = async(e: React.FormEvent) => {
        e.preventDefault();
        if(!project?.id) return;
        setLoading(true);
        setOpen(true);

        const {output, filesReferences} = await askQuestion(question, project.id);
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
            <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    <Code width={40} height={40} />
                </DialogTitle>
            </DialogHeader>
            {answer}
            <h1>File references</h1>
            {filesReferences.map((file, i) => {
                return <span key={i}>{file.fileName}</span>
            })}
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
                    <Button>
                        Ask Codabot!
                    </Button>
                </form>
            </CardContent>
        </Card>
        </>
    )
}

export default AskQuestionCard;