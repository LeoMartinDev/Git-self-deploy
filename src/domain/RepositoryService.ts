import { Readable } from "stream";

export type WebhookCallbackPayload = {
  ref: string;
  commitId: string;
  commitMessage: string;
  commitAuthor: string;
  timestamp: number;
};

export type DeployRequest = {
  body: any;
  rawBody: Buffer | undefined;
  headers: Record<string, string> | undefined;
};

export type ExtractWebhookCallbackRequest = DeployRequest;

export type ExtractWebhookCallbackPayload = (
  request: ExtractWebhookCallbackRequest
) => Promise<WebhookCallbackPayload>;

export type DownloadRepositoryArchiveAtCommit = (
  commitId: string
) => Promise<Readable>;

export type RepositoryService = {
  type: string;
  projectId: string;
  extractWebhookCallbackPayload: ExtractWebhookCallbackPayload;
  downloadRepositoryArchiveAtCommit: DownloadRepositoryArchiveAtCommit;
};

export type CreateRepositoryService = (
  provider: string,
  options: any
) => Promise<RepositoryService | undefined>;
