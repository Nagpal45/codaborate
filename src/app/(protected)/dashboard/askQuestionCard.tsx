'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import useproject from "@/hooks/useProject";
import { Code } from "lucide-react";
import { useState } from "react";

const AskQuestionCard = () => {
    const {project} = useproject();
    const [question, setQuestion] = useState('');
    const [open, setOpen] = useState(false);

    const onSubmit = async(e: React.FormEvent) => {
        e.preventDefault();
        setOpen(true);
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