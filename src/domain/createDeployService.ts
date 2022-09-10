import { join, resolve } from "path";
import { pipeline } from "stream/promises";
import { homedir } from "os";
import mkdirp from "mkdirp";
import tar from "tar";

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

      await pipeline(
        readable,
        tar.extract({
          cwd: downloadDirectoryPath,
        })
      );

      // find deploy.sh file recursively
      // execute it relatively to the directory where it was found
    },
  };
}

export type CreateDeployService = typeof createDeployService;

export type DeployService = ReturnType<typeof createDeployService>;
