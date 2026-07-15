/**
 * export_tokens handler — exports variables and paint styles as JSON or CSS tokens.
 */

import { Handler } from "../../dispatcher";
import { serializeVariableValue } from "../../serialize";

export const handleExportTokens: Handler = async (params: any) => {
  const format = params.format || "json";
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const paintStyles = await figma.getLocalPaintStylesAsync();

  // CSS format
  if (format === "css") {
    const lines: string[] = [":root {"];

    // Add variables as CSS custom properties
    for (const coll of collections) {
      const firstMode = coll.modes[0];
      if (!firstMode) continue;

      for (const varId of coll.variableIds) {
        const variable = await figma.variables.getVariableByIdAsync(varId);
        if (!variable) continue;

        const val = variable.valuesByMode[firstMode.modeId];
        const cssName = `--${variable.name
          .toLowerCase()
          .replace(/[/\s]+/g, "-")
          .replace(/[^a-z0-9-]/g, "")}`;

        let cssValue: string | null = null;

        if (
          variable.resolvedType === "COLOR" &&
          val &&
          typeof val === "object" &&
          "r" in val
        ) {
          const c = val as any;
          const r = Math.round(c.r * 255);
          const g = Math.round(c.g * 255);
          const b = Math.round(c.b * 255);
          cssValue =
            (c.a ?? 1) < 1
              ? `rgba(${r}, ${g}, ${b}, ${(c.a ?? 1).toFixed(2)})`
              : `rgb(${r}, ${g}, ${b})`;
        } else if (
          variable.resolvedType === "FLOAT" ||
          variable.resolvedType === "STRING" ||
          variable.resolvedType === "BOOLEAN"
        ) {
          cssValue = String(val);
        }

        if (cssValue !== null) {
          lines.push(`  ${cssName}: ${cssValue};`);
        }
      }
    }

    // Add paint styles as CSS custom properties
    for (const style of paintStyles) {
      if (style.paints.length === 1 && style.paints[0].type === "SOLID") {
        const paint = style.paints[0] as any;
        const cssName = `--${style.name
          .toLowerCase()
          .replace(/[/\s]+/g, "-")
          .replace(/[^a-z0-9-]/g, "")}`;
        const r = Math.round(paint.color.r * 255);
        const g = Math.round(paint.color.g * 255);
        const b = Math.round(paint.color.b * 255);
        const a = paint.opacity ?? 1;
        const cssValue =
          a < 1
            ? `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`
            : `rgb(${r}, ${g}, ${b})`;
        lines.push(`  ${cssName}: ${cssValue};`);
      }
    }

    lines.push("}");
    return { css: lines.join("\n") };
  }

  // JSON format (default)
  const tokens: any = {};

  // Add variables
  for (const coll of collections) {
    const collTokens: any = {};

    for (const varId of coll.variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(varId);
      if (!variable) continue;

      const modeValues: any = {};
      for (const mode of coll.modes) {
        modeValues[mode.name] = serializeVariableValue(
          variable.valuesByMode[mode.modeId],
        );
      }

      const parts = variable.name.split("/");
      let obj = collTokens;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = {
        type: variable.resolvedType,
        value: modeValues,
      };
    }

    tokens[coll.name] = collTokens;
  }

  // Add paint styles
  const styleTokens: any = {};
  for (const style of paintStyles) {
    if (style.paints.length === 1 && style.paints[0].type === "SOLID") {
      const paint = style.paints[0] as any;
      const r = Math.round(paint.color.r * 255)
        .toString(16)
        .padStart(2, "0");
      const g = Math.round(paint.color.g * 255)
        .toString(16)
        .padStart(2, "0");
      const b = Math.round(paint.color.b * 255)
        .toString(16)
        .padStart(2, "0");

      const parts = style.name.split("/");
      let obj = styleTokens;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = { type: "COLOR", value: `#${r}${g}${b}` };
    }
  }

  if (Object.keys(styleTokens).length > 0) {
    tokens["_styles"] = { paint: styleTokens };
  }

  return { tokens };
};
