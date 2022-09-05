import fastify from 'fastify';
import { URL } from 'url';
import createLocalTunnel from 'localtunnel';
import fs from 'fs';

import { createGithubRepositoryService } from './createGithubRepositoryService.js';

const PORT = 3000;

const getWebhookCallbackUrl = (localtunnel, provider, projectId) => {
  const url = new URL(`/${provider}/${projectId}`, localtunnel.url);

  return url.toString();
};

const server = fastify({
  logger: {
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname'
          }
        }
        : undefined
  }
});

server.setErrorHandler(function (error, request, reply) {
  this.log.error(error)
  reply.status(409).send({ ok: false });
})

await server.register(import('fastify-raw-body'), {
  field: 'rawBody',
  global: false,
  runFirst: true,
  routes: ['/:provider']
});

await server.register(import('@fastify/cors'), {
  origin: '*',
});

const localtunnel = await createLocalTunnel({ port: PORT, subdomain: 'git-live-deploy-aaaa' });
server.log.info(`Created local tunnel available at ${localtunnel.url}`);

const githubService = await createGithubRepositoryService({
  callbackUrl: getWebhookCallbackUrl(localtunnel, 'github', 'dummy_repo'),
  githubToken: process.env.GITHUB_API_TOKEN,
  repoOwner: 'LeoMartinDev',
  repoName: 'dummy_repo'
});

server.post('/:provider/:projectId', async (request, reply) => {
  const { provider, projectId } = request.params;

  if (!projectId) {
    throw new Error('Missing project id');
  }

  if (provider === 'github') {
    const payload = await githubService.extractWebhookCallbackPayload({ body: request.body, rawBody: request.rawBody, headers: request.headers });

    server.log.info('Received push event from GitHub', payload);

    const writeStream = fs.createWriteStream(`${payload.commitId}.zip`);

    const readStream = await githubService.downloadRepositoryArchiveAtCommit(payload.commitId);

    readStream.pipe(writeStream);
  }
});

await server.listen({ port: PORT });
