import {AssemblyAI} from 'assemblyai';

const client = new AssemblyAI({apiKey: process.env.ASSEMBLYAI_API_KEY!});

export const msToTime = (duration: number) => {
    const seconds = duration / 1000;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}