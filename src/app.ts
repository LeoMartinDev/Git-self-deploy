import { createFastifyServer } from "./adapters/fastifyRestApi/createFastifyServer.js";

export async function createApp() {
  const server = await createFastifyServer();

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
