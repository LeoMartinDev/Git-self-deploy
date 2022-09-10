import { createWriteStream } from "fs";
import { join, resolve } from "path";
import { pipeline } from "stream";
import { DeployRequest, RepositoryService } from "./RepositoryService.js";

const dataDirectory = "/opt/git-live-deploy/data";

export function createDeployService(repositoryService: RepositoryService) {
  return {
    async deploy(request: DeployRequest) {
      const payload = await repositoryService.extractWebhookCallbackPayload({
        body: request.body,
        rawBody: request.rawBody,
        headers: request.headers,
      });

      const readable =
        await repositoryService.downloadRepositoryArchiveAtCommit(
          payload.commitId
        );

      const writable = createWriteStream(
        resolve(
          dataDirectory,
          join(repositoryService.projectId, payload.commitId)
        )
      );

      await pipeline(readable, writable);
    },
  };
}

export type CreateDeployService = typeof createDeployService;

export type DeployService = ReturnType<typeof createDeployService>;
