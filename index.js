import fastify from 'fastify';
import { URL } from 'url';
import createLocalTunnel from 'localtunnel';
import fs from 'fs';

import { createGithubRepositoryService } from './createGithubRepositoryService.js';

const PORT = 3000;

const getWebhookCallbackUrl = (localtunnel, provider) => {
  return new URL(provider, localtunnel.url).toString();
};

const server = fastify();

await server.register(import('fastify-raw-body'), {
  field: 'rawBody', // change the default request.rawBody property name
  global: false,
  runFirst: true,
  routes: ['/:provider']
});

await server.register(import('@fastify/cors'), {
  origin: '*',
});

const localtunnel = await createLocalTunnel({ port: PORT, subdomain: 'git-live-deploy-aaaa' });
console.info(`Created local tunnel available at ${localtunnel.url}`);

const githubService = await createGithubRepositoryService({
  callbackUrl: getWebhookCallbackUrl(localtunnel, '/github'),
  githubToken: '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',
  repoOwner: 'LeoMartinDev',
  repoName: 'dummy_repo'
});

server.post('/:provider', async (request, reply) => {
  const { provider } = request.params;
  console.info('Received webhook from', provider);

  if (provider === 'github') {
    const payload = await githubService.extractWebhookCallbackPayload({ body: request.body, rawBody: request.rawBody, headers: request.headers });

    console.info('Received payload from GitHub', payload);

    const writeStream = fs.createWriteStream(`${payload.commitId}.zip`);

    const readStream = await githubService.downloadRepositoryArchiveAtCommit(payload.commitId);

    readStream.pipe(writeStream);
  }
});

await server.listen({ port: PORT });




console.info('Started');
