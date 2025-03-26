import { GithubRepoLoader } from '@langchain/community/document_loaders/web/github';
import { generateEmbedding, summariseCode } from './gemini';
import { db } from '@/server/db';

class RateLimitQueue {
  private queue: (() => Promise<void>)[] = [];
  private isProcessing = false;
  private readonly RATE_LIMIT_DELAY = 4000;

  enqueue(operation: () => Promise<void>) {
    return new Promise<void>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await operation();
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const operation = this.queue.shift();

    if (operation) {
      try {
        await operation();
      } catch (error) {
        console.error('Error in queue processing:', error);
      }

      // Wait before processing next operation
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY));
      this.processQueue();
    }
  }
}

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

export const indexGithubRepo = async (projectId: string, githubUrl: string, githubToken?: string) => {
    // Load repository documents
    const docs = await loadGithubRepo(githubUrl, githubToken);
  
    // Create rate limit queue
    const rateLimitQueue = new RateLimitQueue();
  
    // Process each document through the queue
    const processingPromises = docs.map(async (doc) => {
      return rateLimitQueue.enqueue(async () => {
        try {
          // Generate summary
          const summary = await summariseCode(doc);
  
          // Generate embedding
          const embedding = await generateEmbedding(summary);
  
          // Create database entry for source code embedding
          const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
            data: {
              summary: summary,
              sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
              fileName: doc.metadata.source,
              projectId,
            }
          });
  
          // Update embedding vector
          await db.$executeRaw`
          UPDATE "SourceCodeEmbedding"
          SET "summaryEmbedding" = ${embedding}::vector
          WHERE "id" = ${sourceCodeEmbedding.id}
          `;
  
          console.log(`Processed: ${doc.metadata.source}`);
        } catch (error) {
          console.error(`Error processing document ${doc.metadata.source}:`, error);
        }
      });
    });
  
    // Wait for all documents to be processed
    await Promise.all(processingPromises);
  };