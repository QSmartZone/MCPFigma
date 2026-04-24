import { z } from "zod";
import { getFigmaClient } from "../figma/client.js";
import { parseFigmaLink } from "../security/validator.js";
import { getRateLimiter } from "../security/rateLimiter.js";

const GetFileComponentsSchema = z.object({
  link: z.string().describe("Figma file link or file ID"),
});

async function handleGetFileComponents(params: z.infer<typeof GetFileComponentsSchema>) {
  getRateLimiter().checkLimit("get_file_components");
  const { fileId } = parseFigmaLink(params.link);
  const client = getFigmaClient();
  const [components, componentSets] = await Promise.all([
    client.getFileComponents(fileId),
    client.getFileComponentSets(fileId),
  ]);

  const compMeta = (components as Record<string, unknown>).meta as Record<string, unknown>;
  const setMeta = (componentSets as Record<string, unknown>).meta as Record<string, unknown>;

  return [
    {
      type: "text" as const,
      text: JSON.stringify(
        {
          fileId,
          componentCount: (compMeta?.components as unknown[])?.length ?? 0,
          componentSetCount: (setMeta?.component_sets as unknown[])?.length ?? 0,
          components: compMeta?.components,
          componentSets: setMeta?.component_sets,
        },
        null,
        2
      ),
    },
  ];
}

export const getFileComponentsTool = {
  name: "get_file_components",
  description: "Get all components and component sets defined in a Figma file.",
  schema: GetFileComponentsSchema,
  handler: handleGetFileComponents,
};
