export type BaseProject = {
  id: string;
  provider: string;
};

export type GithubProject = BaseProject & {
  provider: "github";
  githubToken: string;
  repoOwner: string;
  repoName: string;
};

export type Project = GithubProject;

export type ProjectRepository = {
  getProjectById: (projectId: string) => Promise<Project | undefined>;
  getAllProjects: () => Promise<Project[]>;
};
