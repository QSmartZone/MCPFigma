/**
 * helpers.ts for prototype handlers — shared reaction utilities.
 */

/**
 * Build a reaction object from an input object.
 * Normalizes actions (single action -> array, missing -> []).
 */
export function buildReaction(r: any): any {
  const actions = r.actions ?? (r.action != null ? [r.action] : []);
  return { trigger: r.trigger ?? null, actions };
}

/**
 * Parse input to an array.
 * If array, return as-is.
 * If string, try JSON.parse; on error return [].
 * Otherwise return [].
 */
export function parseArray(v: any): any[] {
  if (Array.isArray(v)) {
    return v;
  }
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch (e) {
      return [];
    }
  }
  return [];
}

/**
 * Set reactions on a node.
 * Tries async setReactionsAsync first; falls back to sync reactions property.
 */
export async function setReactions(node: any, reactions: any[]): Promise<void> {
  if (typeof node.setReactionsAsync === "function") {
    await node.setReactionsAsync(reactions);
    return;
  }

  try {
    node.reactions = reactions;
  } catch (e) {
    throw new Error(
      `Failed to set reactions: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}
