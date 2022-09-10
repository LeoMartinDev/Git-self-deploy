import { createWriteStream } from "fs";
import { join, resolve } from "path";
import { pipeline } from "stream";
import { promisify } from "util";
import { homedir } from "os";
import mkdirp from "mkdirp";

import { DeployRequest, RepositoryService } from "./RepositoryService.js";

const dataDirectory = join(homedir(), "/git-live-deploy/data");

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

      const downloadDirectoryPath = resolve(
        dataDirectory,
        repositoryService.projectId
      );

      await mkdirp(downloadDirectoryPath);

      const writable = createWriteStream(
        join(downloadDirectoryPath, `${payload.commitId}.tar`)
      );

      await promisify(pipeline)(readable, writable);
    },
  };
}

export type CreateDeployService = typeof createDeployService;

export type DeployService = ReturnType<typeof createDeployService>;
