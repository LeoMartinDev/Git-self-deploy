import Fastify from "fastify";

import { CreateDeployService } from "../../domain/createDeployService";
import { RepositoryServicesStore } from "../createRepositoryServicesStore";

export async function createFastifyServer(
  repositoryServicesStore: RepositoryServicesStore,
  createDeployService: CreateDeployService
) {
  const fastify = Fastify({
    logger: {
      transport:
        process.env.NODE_ENV !== "production"
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

  await fastify.register(import("@fastify/cors"), {
    origin: "*",
  });

  await fastify.register(import("./routes.js"), {
    createDeployService,
    repositoryServicesStore,
  });

  return {
    async serve() {
      try {
        const port = process.env.PORT || 3000;
        await (fastify as any).listen({ port });
      } catch (err) {
        fastify.log.error(err);
        process.exit(1);
      }
    },
    async stop() {
      try {
        fastify.log.info(`server successfully closed`);
        await fastify.close();
      } catch (err) {
        fastify.log.error(err);
        process.exit(1);
      }
    },
  };
}
