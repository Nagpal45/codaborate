import { db } from "@/server/db";
import { Octokit } from "octokit";
import axios from "axios";
import { summariseCommit } from "./gemini";

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

type Response = {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitDate: string;
};

const fetchGithubProjectUrl = async (projectId: string) => {
  const project = await db.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      githubUrl: true,
    },
  });
  return { project, githubUrl: project?.githubUrl };
};

export const getCommitHashes = async (
  githubUrl: string,
): Promise<Response[]> => {
  const [owner, repo] = githubUrl.split("/").slice(-2);
  
  if (!owner || !repo) {
    throw new Error("Invalid github url");
  }
  
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
  });
  const sortedCommits = data.sort(
    (a: any, b: any) =>
      new Date(b.commit.author.date).getTime() -
    new Date(a.commit.author.date).getTime(),
  ) as any;
  
  return sortedCommits.slice(0, 10).map((commit: any) => {
    return {
      commitHash: commit.sha as string,
      commitMessage: commit.commit.message ?? "",
      commitAuthorName: commit.commit?.author?.name ?? "",
      commitAuthorAvatar: commit?.author?.avatar_url ?? "",
      commitDate: commit.commit?.author?.date ?? "",
    };
  });
};

const filterUnprocessedCommits = async (
  projectId: string,
  commitHashes: Response[],
) => {
  const processedCommits = await db.commit.findMany({
    where: {
      projectId,
    },
  });

  const unprocessedCommits = commitHashes.filter(
    (commit) =>
      !processedCommits.some((c: any) => c.commitHash === commit.commitHash),
  );

  return unprocessedCommits;
};

const summariseCommits = async (githubUrl: string, commitHash: string) => {
  const { data } = await axios.get(`${githubUrl}/commit/${commitHash}.diff`, {
    headers: {
      Accept: "application/vnd.github.v3.diff",
    },
  });
  return (await summariseCommit(data)) || "";
};

export const pollCommits = async (projectId: string) => {
  const { project, githubUrl } = await fetchGithubProjectUrl(projectId);

  if (!project || !githubUrl) {
    throw new Error("Project not found or no github url found");
  }

  const commitHashes = await getCommitHashes(githubUrl);

  const unprocesesedCommits = await filterUnprocessedCommits(
    projectId,
    commitHashes,
  );

  const summaryResponses = await Promise.allSettled(
    unprocesesedCommits.map((commit) => {
      return summariseCommits(githubUrl, commit.commitHash);
    }),
  );

  const summaries = summaryResponses.map((response) => {
    if (response.status === "fulfilled") {
      return response.value;
    }
    return "";
  });

  const commits = await db.commit.createMany({
    data: summaries.map((summary, index) => {
      return {
        projectId,
        commitHash: unprocesesedCommits[index]!.commitHash,
        commitMessage: unprocesesedCommits[index]!.commitMessage,
        commitAuthorName: unprocesesedCommits[index]!.commitAuthorName,
        commitAuthorAvatar: unprocesesedCommits[index]!.commitAuthorAvatar,
        commitDate: unprocesesedCommits[index]!.commitDate,
        summary,
      }
    }),
  });

  return commits;
};