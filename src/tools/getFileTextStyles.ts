import { z } from "zod";
import { getCachedFile, getFigmaClient } from "../figma/client.js";
import { parseFigmaLink } from "../security/validator.js";
import { collectTextNodes } from "../utils/designExtractor.js";

const GetFileTextStylesSchema = z.object({
  link: z.string().describe("Figma file link or file ID"),
});

async function handleGetFileTextStyles(params: z.infer<typeof GetFileTextStylesSchema>) {
const { fileId } = parseFigmaLink(params.link);
  const client = getFigmaClient();
  const data = await client.getFileStyles(fileId);
  const meta = (data as Record<string, unknown>).meta as Record<string, unknown>;
  const styles = ((meta?.styles as Record<string, unknown>[]) ?? []).filter(
    (s) => s.style_type === "TEXT"
  );

  const file = await getCachedFile(fileId);
  const doc = file.document as Record<string, unknown>;
  const textSamples = collectTextNodes(doc).slice(0, 50);

  return [
    {
      type: "text" as const,
      text: JSON.stringify(
        { fileId, textStyleCount: styles.length, textStyles: styles, textSamples },
        null,
        2
      ),
    },
  ];
}

export const getFileTextStylesTool = {
  name: "get_file_text_styles",
  description: "Get all text/typography styles defined in a Figma file (font, size, weight, etc.).",
  schema: GetFileTextStylesSchema,
  handler: handleGetFileTextStyles,
};
