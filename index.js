import { createGithubService } from './createGithubService.js';

await createGithubService({
  port: 3000,
});

console.info('Started');
