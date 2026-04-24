import { z } from "zod";
import { getCachedFile } from "../figma/client.js";
import { parseFigmaLink } from "../security/validator.js";

const GetFileInfoSchema = z.object({
  link: z.string().describe("Figma file link or file ID"),
});

async function handleGetFileInfo(params: z.infer<typeof GetFileInfoSchema>) {
const { fileId } = parseFigmaLink(params.link);
  const file = await getCachedFile(fileId);
  const doc = file.document as Record<string, unknown>;
  const pages = (doc.children as Record<string, unknown>[]).map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    childCount: (p.children as unknown[] | undefined)?.length ?? 0,
  }));

  return [
    {
      type: "text" as const,
      text: JSON.stringify(
        {
          fileId,
          name: file.name,
          lastModified: file.lastModified,
          version: file.version,
          role: file.role,
          editorType: file.editorType,
          thumbnailUrl: file.thumbnailUrl,
          pages,
        },
        null,
        2
      ),
    },
  ];
}

export const getFileInfoTool = {
  name: "get_file_info",
  description: "Get Figma file metadata: name, last modified, version, pages, and thumbnail.",
  schema: GetFileInfoSchema,
  handler: handleGetFileInfo,
};
