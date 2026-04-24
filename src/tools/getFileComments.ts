import { z } from "zod";
import { getFigmaClient } from "../figma/client.js";
import { parseFigmaLink } from "../security/validator.js";
import { getRateLimiter } from "../security/rateLimiter.js";

const GetFileCommentsSchema = z.object({
  link: z.string().describe("Figma file link or file ID"),
});

async function handleGetFileComments(params: z.infer<typeof GetFileCommentsSchema>) {
  getRateLimiter().checkLimit("get_file_comments");
  const { fileId } = parseFigmaLink(params.link);
  const client = getFigmaClient();
  const data = await client.getFileComments(fileId);

  return [
    {
      type: "text" as const,
      text: JSON.stringify({ fileId, comments: data }, null, 2),
    },
  ];
}

export const getFileCommentsTool = {
  name: "get_file_comments",
  description: "Get all comments on a Figma file.",
  schema: GetFileCommentsSchema,
  handler: handleGetFileComments,
};
