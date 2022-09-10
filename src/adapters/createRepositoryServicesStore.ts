import { FastifyBaseLogger } from "fastify";
import { RepositoryService } from "../domain/RepositoryService";
import { ProjectRepository } from "./ProjectRepository";

export async function createRepositoryServicesStore(
  projectRepository: ProjectRepository,
  getWebhookCallbackUrl: any,
  logger: FastifyBaseLogger
) {
  const repositoryServicesStore = new Map<string, RepositoryService>();

  const projects = await projectRepository.getAllProjects();

  logger.info(`Found ${projects.length} projects to initialize`);

  for (const { id, provider, ...options } of projects) {
    logger.info(`Initializing project ${id}`);
    if (provider === "github") {
      const repositoryService = await import(
        "./repositoryServices/createGithubRepositoryService.js"
      ).then((module) =>
        module.createGithubRepositoryService({
          callbackUrl: getWebhookCallbackUrl(id),
          projectId: id,
          ...(options as any),
        })
      );

      repositoryServicesStore.set(id, repositoryService);
    }

    logger.info(`Project ${id} initialized`);
  }

  return {
    async findById(projectId: string) {
      const project = await projectRepository.getProjectById(projectId);

      if (!project) {
        return undefined;
      }

      return repositoryServicesStore.get(projectId);
    },
    async findAll() {
      const projects = await projectRepository.getAllProjects();

      return projects.map((project) => repositoryServicesStore.get(project.id));
    },
  };
}

export type RepositoryServicesStore = Awaited<
  ReturnType<typeof createRepositoryServicesStore>
>;
