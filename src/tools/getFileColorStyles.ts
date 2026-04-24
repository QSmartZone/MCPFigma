import { z } from "zod";
import { getFigmaClient } from "../figma/client.js";
import { parseFigmaLink } from "../security/validator.js";

const GetFileColorStylesSchema = z.object({
  link: z.string().describe("Figma file link or file ID"),
});

async function handleGetFileColorStyles(params: z.infer<typeof GetFileColorStylesSchema>) {
const { fileId } = parseFigmaLink(params.link);
  const client = getFigmaClient();
  const data = await client.getFileStyles(fileId);
  const meta = (data as Record<string, unknown>).meta as Record<string, unknown>;
  const styles = ((meta?.styles as Record<string, unknown>[]) ?? []).filter(
    (s) => s.style_type === "FILL"
  );

  return [
    {
      type: "text" as const,
      text: JSON.stringify(
        { fileId, colorStyleCount: styles.length, colorStyles: styles },
        null,
        2
      ),
    },
  ];
}

export const getFileColorStylesTool = {
  name: "get_file_color_styles",
  description: "Get all color styles (design tokens/swatches) defined in a Figma file.",
  schema: GetFileColorStylesSchema,
  handler: handleGetFileColorStyles,
};
