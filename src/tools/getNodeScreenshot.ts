import { z } from "zod";
import { getFigmaClient } from "../figma/client.js";
import { parseFigmaLink } from "../security/validator.js";

const GetNodeScreenshotSchema = z.object({
  link: z.string().describe("Figma node link or file ID"),
  scale: z
    .number()
    .optional()
    .default(2)
    .describe("Image scale (default: 2 = 2x)"),
  format: z
    .enum(["png", "svg", "jpg"])
    .optional()
    .default("png")
    .describe("Image format"),
});

async function handleGetNodeScreenshot(params: z.infer<typeof GetNodeScreenshotSchema>) {
const { fileId, nodeId } = parseFigmaLink(params.link);
  if (!nodeId) throw new Error("node-id is required for screenshot");

  const client = getFigmaClient();
  const result = await client.getNodeImages(fileId, [nodeId], params.format ?? "png", params.scale ?? 2);
  const images = (result as Record<string, unknown>).images as Record<string, string>;
  const url = images?.[nodeId.replace(/-/g, ":")] ?? images?.[nodeId];

  return [
    {
      type: "text" as const,
      text: JSON.stringify({ fileId, nodeId, screenshotUrl: url, allImages: images }, null, 2),
    },
  ];
}

export const getNodeScreenshotTool = {
  name: "get_node_screenshot",
  description: "Get a rendered screenshot URL for a Figma node.",
  schema: GetNodeScreenshotSchema,
  handler: handleGetNodeScreenshot,
};
