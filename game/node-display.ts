import { RESOURCES } from "./resources";
import type { AnyNode } from "./types";

export function requirementText(node: AnyNode): string {
  const requirement = node.requirement;
  if (requirement.type === "none") return "";
  const name = RESOURCES[requirement.resourceId]?.name ?? requirement.resourceId;
  return `Requires ${name}: ${requirement.amount.toLocaleString()}`;
}
