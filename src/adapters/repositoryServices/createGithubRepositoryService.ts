import { fetch, Headers, FormData, RequestInit } from "undici";
import { URL } from "url";
import crypto from "crypto";
import { Readable } from "stream";
import {
  ExtractWebhookCallbackRequest,
  RepositoryService,
} from "../../domain/RepositoryService";

const GITHUB_API_BASE_URL = "https://api.github.com";

function createGithubClient(githubToken: string) {
  return async (
    args: RequestInit & { path: string; responseType?: "stream" }
  ) => {
    const headers = new Headers({
      Accept: "application/vnd.github+json",
      ...args.headers,
    });

    if (githubToken) {
      headers.append("Authorization", `Bearer ${githubToken}`);
    }

    const response = await fetch(new URL(args.path, GITHUB_API_BASE_URL), {
      ...args,
      headers,
    });

    if (!response.body) {
      return;
    }

    if (args.responseType === "stream") {
      return Readable.fromWeb(response.body);
    }

    const data = await response.text();

    try {
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  };
}

async function subscribeToGithubRepositoryPushEvents(
  githubClient: ReturnType<typeof createGithubClient>,
  repoOwner: string,
  repoName: string,
  callbackUrl: string
) {
  const secret = crypto.randomBytes(20).toString("hex");
  const body = new FormData();

  body.append("hub.mode", "subscribe");
  body.append(
    "hub.topic",
    `https://github.com/${repoOwner}/${repoName}/events/push`
  );
  body.append("hub.callback", callbackUrl);
  body.append("hub.secret", secret);

  await githubClient({
    method: "POST",
    path: "hub",
    body,
  });

  return secret;
}

export async function createGithubRepositoryService({
  callbackUrl,
  githubToken,
  repoOwner,
  repoName,
  projectId,
}: {
  callbackUrl: string;
  githubToken: string;
  repoOwner: string;
  repoName: string;
  projectId: string;
}): Promise<RepositoryService> {
  const githubClient = await createGithubClient(githubToken);

  const secret = await subscribeToGithubRepositoryPushEvents(
    githubClient,
    repoOwner,
    repoName,
    callbackUrl
  );

  function validateSignature(
    rawBody: Buffer | undefined,
    headers: Record<string, string> | undefined
  ) {
    if (!headers) {
      return false;
    }

    const signature = headers["x-hub-signature-256"];

    if (!signature) {
      return false;
    }

    const hmac = crypto
      .createHmac("sha256", secret)
      .update((rawBody || "").toString(), "utf-8");

    const expected = `sha256=${hmac.digest("hex")}`;

    if (
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return false;
    }

    return true;
  }

  return {
    type: "github",
    projectId,
    extractWebhookCallbackPayload: async ({
      body,
      rawBody,
      headers,
    }: ExtractWebhookCallbackRequest) => {
      if (!body || (body.zen && body.hook_id)) {
        throw new Error("Received ping from GitHub");
      }

      const isSignatureValid = validateSignature(rawBody, headers);

      if (!isSignatureValid) {
        throw new Error("Invalid signature");
      }

      if (
        !body.ref ||
        !body.head_commit?.id ||
        !body.head_commit?.message ||
        !body.head_commit?.author?.username ||
        !body.head_commit?.timestamp
      ) {
        throw new Error("Invalid payload");
      }

      return {
        ref: body.ref,
        commitId: body.head_commit.id,
        commitMessage: body.head_commit.message,
        commitAuthor: body.head_commit.author.username,
        timestamp: body.head_commit.timestamp,
      };
    },
    downloadRepositoryArchiveAtCommit: async (commitId) => {
      const response = await githubClient({
        method: "GET",
        path: `repos/${repoOwner}/${repoName}/zipball/${commitId}`,
        redirect: "follow",
        responseType: "stream",
      });

      return response;
    },
  };
}
