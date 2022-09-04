import localtunnel from 'localtunnel';
import { fetch, Headers, FormData } from 'undici';
import { URL } from 'url';

const GITHUB_API_BASE_URL = 'https://api.github.com';

// see https://docs.github.com/en/rest/webhooks#pubsubhubbub
async function createLocalTunnel(port) {
  const tunnel = await localtunnel({ port });

  return tunnel;
}

function createGithubClient(githubToken) {
  return async (args) => {
    const headers = new Headers({
      ...args.headers,
    });

    if (githubToken) {
      headers.append('Authorization', `Bearer ${githubToken}`);
    }

    const response = await fetch({
      ...args,
      headers,
      URL: new URL(args.path, GITHUB_API_BASE_URL),
    });

    return response.json();
  };
}

function subscribeToGithubRepositoryPushEvents(
  githubClient,
  repoOwner,
  repoName
) {
  const body = new FormData();

  body.append('hub.mode', 'subscribe');
  body.append(
    'hub.topic',
    `https://github.com/${repoOwner}/${repoName}/events/push`
  );
  body.append('hub.mode', 'subscribe');

  return githubClient({
    method: 'GET',
    path: 'hub',
    body,
  });
}

export async function createGithubService({ port, githubToken }) {
  const localTunnel = await createLocalTunnel(port);

  console.info(`Created local tunnel available at ${localTunnel.url}`);

  const githubClient = await createGithubClient(githubToken);

  localTunnel.on('request', ({ method, path }) => {
    console.log(method, path);
  });

  await subscribeToGithubRepositoryPushEvents(
    githubClient,
    'LeoMartinDev',
    'dummy_repo'
  );
}
