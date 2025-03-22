import { db } from "@/server/db";
import { Octokit } from "octokit";

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const githubUrl = "https://github.com/InfinitIQ-Tech/mcp-jira";

type Response = {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitDate: string;
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
  const sortedCommits = data.sort((a:any, b:any) => 
    new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()) as any;

  return sortedCommits.slice(0,10).map((commit: any) => {
    return {
      commitHash: commit.sha as string,
      commitMessage: commit.commit.message ?? "",
      commitAuthorName: commit.commit?.author?.name ?? "",
      commitAuthorAvatar: commit?.author?.avatar_url ?? "",
      commitDate: commit.commit?.author?.date ?? "",
    };
  });
};
  
export const pollCommits = async (projectId: string) => {
    const {project, githubUrl} = await fetchGithubProjectUrl(projectId);

    if (!project || !githubUrl) {
        throw new Error("Project not found or no github url found");
    }

    const commitHashes = await getCommitHashes(githubUrl);

    const unprocesesedCommits = await filterUnprocessedCommits(projectId, commitHashes);
};

const summariseCommits = async (githubUrl: string, commitHash: string) => {

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
    return {project, githubUrl: project?.githubUrl};
};

const filterUnprocessedCommits = async (projectId: string, commitHashes: Response[]) => {
    const processedCommits = await db.commit.findMany({
        where: {
            projectId,
        },
    });

    const unprocessedCommits = commitHashes.filter((commit) => !processedCommits.some((c : any) => c.commitHash === commit.commitHash));

    return unprocessedCommits;
};


