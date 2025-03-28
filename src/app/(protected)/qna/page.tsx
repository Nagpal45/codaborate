'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import useproject from "@/hooks/useProject";
import { api } from "@/trpc/react";
import AskQuestionCard from "../dashboard/askQuestionCard";
import { Fragment, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import CodeReferences from "../dashboard/codeReferences";

const QNApage = () => {
  const {projectId} = useproject();
  const {data: questions} = api.project.getQuestions.useQuery({projectId});

  const[quesIdx, setQuesIdx] = useState<number>(0);
  const question = questions?.[quesIdx];

  return (
    <Sheet>
      <AskQuestionCard/>
      <div className="h-4"></div>
      <h1 className="text-xl font-semibold">Saved Questions</h1>
      <div className="h-2"></div>
      <div className="flex flex-col gap-2">
        {questions?.map((question, index) => {
          return (
            <Fragment key={index}>
              <SheetTrigger onClick={() => {
                setQuesIdx(index);
              }
              }>
                <div className="flex items-center gap-4 bg-white rounded-lg p-4 shadow border">
                  <img className="rounded-full" height={30} width={30} src={question.user.imageUrl ?? ""}/>
                  <div className="text-left flex flex-col">
                    <div className="flex items-center gap-2">
                      <p className="text-gray-700 line-clamp-1 text-lg font-medium">{question.question}</p>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {question.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-500 line-clamp-2 text-sm">
                      {question.answer}
                    </p>
                  </div>
                </div>
              </SheetTrigger>
            </Fragment>
          );
        }
        )}
      </div>
      {question && (
        <SheetContent className="sm:max-w-[80vw] overflow-y-scroll">
          <SheetHeader>
            <SheetTitle>
              {question.question}
            </SheetTitle>
            <MDEditor.Markdown source={question.answer} style={{
                background: 'white',
                color: 'black',
                //hide scrollbar
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
            }} />
            <CodeReferences fileReferences={(question.filesReferences ?? []) as any} />
          </SheetHeader>
        </SheetContent>
      )}
    </Sheet>
  );
};

export default QNApage;
