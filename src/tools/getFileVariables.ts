import { z } from "zod";
import { getFigmaClient } from "../figma/client.js";
import { parseFigmaLink } from "../security/validator.js";
import { getRateLimiter } from "../security/rateLimiter.js";

const GetFileVariablesSchema = z.object({
  link: z.string().describe("Figma file link or file ID"),
});

async function handleGetFileVariables(params: z.infer<typeof GetFileVariablesSchema>) {
  getRateLimiter().checkLimit("get_file_variables");
  const { fileId } = parseFigmaLink(params.link);
  const client = getFigmaClient();
  const data = await client.getFileVariables(fileId);

  return [
    {
      type: "text" as const,
      text: JSON.stringify({ fileId, variables: data }, null, 2),
    },
  ];
}

export const getFileVariablesTool = {
  name: "get_file_variables",
  description: "Get all design variables (tokens) defined in a Figma file (requires Editor access).",
  schema: GetFileVariablesSchema,
  handler: handleGetFileVariables,
};
