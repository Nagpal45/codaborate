import {GithubRepoLoader} from '@langchain/community/document_loaders/web/github';
import { Document } from '@langchain/core/documents';
import { generateEmbedding, summariseCode } from './gemini';
import { db } from '@/server/db';

export const loadGithubRepo = async (githubUrl: string, githubToken?: string) => {
    const branches = ['main', 'master'];
    let docs = null;

    for (const branch of branches) {
        try {
            const loader = new GithubRepoLoader(githubUrl, {
                accessToken: githubToken || '',
                branch,
                ignoreFiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'],
                recursive: true,
                unknown: 'warn',
                maxConcurrency: 5,
            });

            docs = await loader.load();
            if (docs) break; 
        } catch (error) {
            console.log(error);
            console.warn(`Failed to load ${branch} branch:`);
        }
    }

    if (!docs) {
        throw new Error('Failed to load repository from main or master branch.');
    }

    return docs;
};


const generateEmbeddings = async (docs: Document[]) => {
    return await Promise.all(docs.map(async doc => {
        const summary = await summariseCode(doc)
        const embedding = await generateEmbedding(summary);
        return {
            summary, embedding,
            sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
            fileName: doc.metadata.source,
        }
    }))
};

export const indexGithubRepo = async (projectId: string, githubUrl: string, githubToken?: string) => {
    const docs = await loadGithubRepo(githubUrl, githubToken);

    const allEmbeddings = await generateEmbeddings(docs);

    await Promise.allSettled(allEmbeddings.map(async (embedding, index) => {
        if(!embedding) return;

        const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
            data: {
                summary: embedding.summary,
                sourceCode: embedding.sourceCode,
                fileName: embedding.fileName,
                projectId,
            }
        })

        

        await db.$executeRaw`
        UPDATE "SourceCodeEmbedding"
        SET "summaryEmbedding" = ${embedding.embedding}::vector
        WHERE "id" = ${sourceCodeEmbedding.id}
        `;
    }));
    return allEmbeddings;
};