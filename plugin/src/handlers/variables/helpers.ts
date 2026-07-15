/**
 * Shared helper functions for variables handlers.
 */

/**
 * Parse variable value based on type.
 * Converts string color to RGBA, parses floats, booleans, and strings.
 */
export function parseVariableValue(type: string, value: any): any {
  if (type === "COLOR") {
    if (typeof value === "string") {
      // Parse hex color
      const hex = value.replace("#", "");
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      const a = hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      return { r, g, b, a };
    }
    return value;
  }

  if (type === "FLOAT") {
    return typeof value === "number" ? value : parseFloat(String(value));
  }

  if (type === "BOOLEAN") {
    return value === true || value === "true";
  }

  return String(value);
}
