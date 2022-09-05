import { createFastifyServer } from "./adapters/fastifyRestApi/createFastifyServer.js";
export async function createApp() {
    const server = await createFastifyServer();
    return {
        start: server.serve,
        stop: server.stop,
    };
}
if (require.main === module) {
    createApp()
        .then(({ start }) => {
        return start();
    })
        .catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
