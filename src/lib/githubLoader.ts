import {GithubRepoLoader} from '@langchain/community/document_loaders/web/github';
import { Document } from '@langchain/core/documents';
import { generateEmbedding, summariseCode } from './gemini';

export const loadGithubRepo = async (githubUrl: string, githubToken: string) => {
    const loader = new GithubRepoLoader(githubUrl, {
        accessToken: githubToken || '',
        branch: 'main',
        ignoreFiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'],
        recursive: true,
        unknown:'warn',
        maxConcurrency: 5,
    });

    const docs = await loader.load();
    return docs;
};

const generateEmbeddings = async (docs: Document[]) => {
    return await Promise.all(docs.map(async doc => {
        const summary = await summariseCode(doc)
        const embedding = generateEmbedding(summary);
        return {
            summary, embedding,
            sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
            fileName: doc.metadata.source,
        }
    }))
};