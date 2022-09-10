import { readFile } from "fs/promises";

export async function createConfigProjectRepository() {
  const rawConfig = await readFile("/etc/config.json", "utf-8");
  const config = JSON.parse(rawConfig);

  return {
    async getProjectById(projectId: string) {
      return config.projects.find((project: any) => project.id === projectId);
    },
    async getAllProjects() {
      return config.projects;
    },
  };
}
