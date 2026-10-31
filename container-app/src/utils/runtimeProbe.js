import { getProbeToken } from "../../../shared/scope-probe";

/**
 * Interprets a remote's reported runtime tag against the token the container
 * wrote on its own React instance (see shared/scope-probe.js).
 *
 * Returns "yes"  — the shared scope handed this remote the container's instance,
 *         "no"   — the remote resolved a different React instance (its own scope),
 *         "unknown" — the remote is older/incompatible with the probe.
 */
export function sharesContainerRuntime(runtimeInfo) {
  if (!runtimeInfo || !Object.prototype.hasOwnProperty.call(runtimeInfo, "runtimeTag")) {
    return "unknown";
  }
  const tag = runtimeInfo.runtimeTag;
  if (!tag || !tag.token) {
    return "no";
  }
  return tag.token === getProbeToken() ? "yes" : "no";
}
