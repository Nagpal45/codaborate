import { processMeeting } from "@/lib/assemblyai";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodyParser = z.object({
    meetingAudioURL: z.string(),
    projectId: z.string(),
    meetingId: z.string(),
})

export const maxDuration = 300;

export const POST = async (req: NextRequest) => {
    const {userId} = await auth();
    if(!userId) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    try{
        const body = await req.json();
        const {meetingAudioURL, meetingId} = bodyParser.parse(body);
        const summaries = await processMeeting(meetingAudioURL);
        await db.issue.createMany({
            data: summaries.map((summary) => ({
                start: summary.start,
                end: summary.end,
                gist: summary.gist,
                headline: summary.headline,
                summary: summary.summary,
                meetingId,
            })),
        });
        await db.meeting.update({
            where: {
                id: meetingId,
            },
            data: {
                status: "COMPLETED",
                name: summaries[0]!.headline,
            },
        });
        return NextResponse.json({message: "Meeting processed successfully"}, {status: 200});
    }catch(error) {
        console.error(error);
        return NextResponse.json({error: "Internal Server Error"}, {status: 500});
    }
};

