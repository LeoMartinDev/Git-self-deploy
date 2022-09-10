import createLocalTunnel from "localtunnel";
import pino from "pino";
import pinoPretty from "pino-pretty";

import { createRepositoryServicesStore } from "./adapters/createRepositoryServicesStore.js";
import { createFastifyServer } from "./adapters/fastifyRestApi/createFastifyServer.js";
import { createDeployService } from "./domain/createDeployService.js";
import { createMockProjectRepository } from "./adapters/projectRepository/mockProjectRepository.js";

export async function createApp() {
  const logger = pino(
    process.env.NODE_ENV !== "production"
      ? pinoPretty({ translateTime: "HH:MM:ss Z", ignore: "pid,hostname" })
      : undefined
  );

  const localtunnel = await createLocalTunnel({
    port: 3000,
    subdomain: "git-live-deploy-aaaa",
  });

  const getWebhookCallbackUrl = (projectId: string) => {
    const url = new URL(`/deploy/${projectId}`, localtunnel.url);

    return url.toString();
  };

  const projectsRepository = await createMockProjectRepository();

  const repositoryServicesStore = await createRepositoryServicesStore(
    projectsRepository,
    getWebhookCallbackUrl,
    logger
  );

  const server = await createFastifyServer(
    repositoryServicesStore,
    createDeployService
  );

  return {
    start: server.serve,
    stop: server.stop,
  };
}

if (import.meta.url.endsWith(process.argv[1])) {
  createApp()
    .then(({ start }) => {
      return start();
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
