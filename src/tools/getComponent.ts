import { z } from "zod";
import { getFigmaClient } from "../figma/client.js";
import { getRateLimiter } from "../security/rateLimiter.js";

const GetComponentSchema = z.object({
  component_key: z.string().describe("Component key from Figma"),
});

async function handleGetComponent(params: z.infer<typeof GetComponentSchema>) {
  getRateLimiter().checkLimit("get_component");
  const client = getFigmaClient();
  const data = await client.getComponent(params.component_key);

  return [
    {
      type: "text" as const,
      text: JSON.stringify(data, null, 2),
    },
  ];
}

export const getComponentTool = {
  name: "get_component",
  description: "Get detailed info about a specific component by its key.",
  schema: GetComponentSchema,
  handler: handleGetComponent,
};
