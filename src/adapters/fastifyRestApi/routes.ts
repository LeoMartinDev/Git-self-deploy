import { FastifyInstance } from "fastify";
import { CreateDeployService } from "../../domain/createDeployService";
import { RepositoryServicesStore } from "../createRepositoryServicesStore";

export default async function routes(
  fastify: FastifyInstance,
  {
    createDeployService,
    repositoryServicesStore,
  }: {
    createDeployService: CreateDeployService;
    repositoryServicesStore: RepositoryServicesStore;
  }
) {
  await fastify.register(import("fastify-raw-body"), {
    field: "rawBody",
    global: false,
    runFirst: true,
    encoding: false,
    routes: ["/deploy/:projectId"],
  });

  fastify.route<{
    Params: {
      projectId: string;
    };
    Headers: Record<string, string>;
  }>({
    method: "POST",
    url: "/deploy/:projectId",
    schema: {
      params: {
        type: "object",
        properties: {
          projectId: { type: "string" },
        },
        required: ["projectId"],
      },
      headers: {
        type: "object",
      },
    },
    handler: async (request, reply) => {
      const { projectId } = request.params;

      const repositoryService = await repositoryServicesStore.findById(
        projectId
      );

      if (!repositoryService) {
        reply.status(404).send({ error: "Project not found" });
        return;
      }

      const deployService = await createDeployService(repositoryService);

      await deployService.deploy({
        body: request.body,
        rawBody: request.rawBody as Buffer,
        headers: request.headers,
      });
    },
  });
}
