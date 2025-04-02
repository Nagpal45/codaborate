import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { generateEmbedding, summariseCode } from "./gemini";
import { db } from "@/server/db";
import { Octokit } from "octokit";

const getFileCount = async (
  path: string,
  octokit: Octokit,
  githubOwner: string,
  githubRepo: string,
  acc: number = 0,
) => {
  const { data } = await octokit.rest.repos.getContent({
    owner: githubOwner,
    repo: githubRepo,
    path,
  });
  if (!Array.isArray(data) && data.type == "file") {
    return acc + 1;
  }
  if (Array.isArray(data)) {
    let fileCount = 0;
    const directories: string[] = [];
    for (const item of data) {
      if (item.type == "dir") {
        directories.push(item.path);
      } else {
        fileCount++;
      }
    }

    if (directories.length > 0) {
      const directoryCounts = await Promise.all(
        directories.map((directory) =>
          getFileCount(directory, octokit, githubOwner, githubRepo, 0),
        ),
      );
      fileCount += directoryCounts.reduce((acc, count) => acc + count, 0);
    }
    return acc + fileCount;
  }
  return acc;
};

export const checkCredits = async (githubUrl: string, githubToken?: string) => {
  const octokit = new Octokit({ auth: githubToken });
  const githubOwner = githubUrl.split("/")[3];
  const githubRepo = githubUrl.split("/")[4];
  if (!githubOwner || !githubRepo) {
    return 0;
  }

  const fileCount = await getFileCount(
    "", octokit, githubOwner, githubRepo, 0);
    return fileCount;
};

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
        console.error("Error in queue processing:", error);
      }

      // Wait before processing next operation
      await new Promise((resolve) =>
        setTimeout(resolve, this.RATE_LIMIT_DELAY),
      );
      this.processQueue();
    }
  }
}

export const loadGithubRepo = async (
  githubUrl: string,
  githubToken?: string,
) => {
  const branches = ["main", "master"];
  let docs = null;

  for (const branch of branches) {
    try {
      const loader = new GithubRepoLoader(githubUrl, {
        accessToken: githubToken || "",
        branch,
        ignoreFiles: [
          "package-lock.json",
          "yarn.lock",
          "pnpm-lock.yaml",
          "bun.lockb",
        ],
        recursive: true,
        unknown: "warn",
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
    throw new Error("Failed to load repository from main or master branch.");
  }

  return docs;
};

export const indexGithubRepo = async (
  projectId: string,
  githubUrl: string,
  githubToken?: string,
) => {
  const docs = await loadGithubRepo(githubUrl, githubToken);

  const rateLimitQueue = new RateLimitQueue();

  const processingPromises = docs.map(async (doc) => {
    return rateLimitQueue.enqueue(async () => {
      try {
        const summary = await summariseCode(doc);

        const embedding = await generateEmbedding(summary);

        const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
          data: {
            summary: summary,
            sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
            fileName: doc.metadata.source,
            projectId,
          },
        });

        await db.$executeRaw`
          UPDATE "SourceCodeEmbedding"
          SET "summaryEmbedding" = ${embedding}::vector
          WHERE "id" = ${sourceCodeEmbedding.id}
          `;

        // console.log(`Processed: ${doc.metadata.source}`);
      } catch (error) {
        console.error(
          `Error processing document ${doc.metadata.source}:`,
          error,
        );
      }
    });
  });

  await Promise.all(processingPromises);
};
