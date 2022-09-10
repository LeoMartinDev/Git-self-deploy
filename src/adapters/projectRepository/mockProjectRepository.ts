import { Project } from "../ProjectRepository";

export async function createMockProjectRepository() {
  const projects: Project[] = [
    {
      id: "1",
      provider: "github",
      githubToken: process.env.GITHUB_API_TOKEN!,
      repoOwner: "LeoMartinDev",
      repoName: "dummy_repo",
    },
  ];

  return {
    async getProjectById(projectId: string) {
      return projects.find((project: any) => project.id === projectId);
    },
    async getAllProjects() {
      return projects;
    },
  };
}
