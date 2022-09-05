import { FastifyInstance } from "fastify";

export default function routes(fastify: FastifyInstance) {
  fastify.route<{
    Params: {
      provider: string;
      projectId: string;
    },
  }>({
    method: "POST",
    url: "/:provider/:projectId",
    schema: {
      params: {
        type: "object",
        properties: {
          provider: { type: "string" },
          projectId: { type: "string" },
        },
        required: ["provider", "projectId"],
      },
    },
    handler: async (request, reply) => {
      const { provider, projectId } = request.params;

      if (provider === "github") {
        const payload = await githubService.extractWebhookCallbackPayload({
          body: request.body,
          rawBody: request.rawBody,
          headers: request.headers,
        });
  
        // fastify.log.info("Received push event from GitHub", payload);
  
        // const writeStream = fs.createWriteStream(`${payload.commitId}.zip`);
  
        // const readStream = await githubService.downloadRepositoryArchiveAtCommit(
        //   payload.commitId
        // );
  
        // readStream.pipe(writeStream);
      },
    },
  });
}
