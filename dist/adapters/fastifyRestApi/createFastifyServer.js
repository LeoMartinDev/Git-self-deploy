import Fastify from "fastify";
// import createLocalTunnel from "localtunnel";
const createLocalTunnel = (args) => ({});
export async function createFastifyServer() {
    const fastify = Fastify({
        logger: {
            transport: process.env.NODE_ENV !== "production"
                ? {
                    target: "pino-pretty",
                    options: {
                        translateTime: "HH:MM:ss Z",
                        ignore: "pid,hostname",
                    },
                }
                : undefined,
        },
    });
    fastify.setErrorHandler(function (error, request, reply) {
        fastify.log.error(error);
        reply.status(409).send({ ok: false });
    });
    await fastify.register(import("fastify-raw-body"), {
        field: "rawBody",
        global: false,
        runFirst: true,
        routes: ["/:provider/:projectId"],
    });
    await fastify.register(import("@fastify/cors"), {
        origin: "*",
    });
    const localtunnel = await createLocalTunnel({
        port: 3000,
        subdomain: "git-live-deploy-aaaa",
    });
    fastify.log.info(`Created local tunnel available at ${localtunnel.url}`);
    return {
        async serve() {
            try {
                const port = process.env.PORT || 3000;
                await fastify.listen({ port });
            }
            catch (err) {
                fastify.log.error(err);
                process.exit(1);
            }
        },
        async stop() {
            try {
                fastify.log.info(`server successfully closed`);
                await fastify.close();
            }
            catch (err) {
                fastify.log.error(err);
                process.exit(1);
            }
        },
    };
}
