/**
 * Share-scope probe — runtime diagnostics support (PRD 5.5 / 7.4).
 *
 * `shared` configuration alone does not prove that two applications really run
 * the SAME React instance, so the container tags the React module object it
 * resolved with a one-shot token. Every remote then reports the tag it can read
 * back from the React module IT resolved:
 *
 *   - same token  -> the shared scope handed out the container's instance
 *   - no tag      -> a different instance (a different share scope / version)
 *
 * Only plain strings cross the application boundary, so this respects the
 * "never pass React objects between applications" constraint (PRD 2.2). Each
 * bundle contains its own copy of this module; the React module object is the
 * single shared channel, which is exactly what makes it an identity test.
 */
var PROBE_KEY = "__mfeScopeProbe";
var PROBE_TOKEN = "probe-" + Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);

/** Writes the tag if the resolved React instance has not been tagged yet. */
function tagReactInstance(React, shareScope) {
  try {
    if (React && !React[PROBE_KEY]) {
      React[PROBE_KEY] = { shareScope: shareScope, token: PROBE_TOKEN };
    }
  } catch (err) {
    // Non-writable module object: probing degrades to "unknown", never breaks a build.
  }
  return PROBE_TOKEN;
}

/** Reads back the tag of the React instance this module's app is using. */
function readReactInstanceTag(React) {
  try {
    var tag = React && React[PROBE_KEY];
    return tag ? { shareScope: tag.shareScope, token: tag.token } : null;
  } catch (err) {
    return null;
  }
}

/** Token this bundle would have written (the container uses it to compare). */
function getProbeToken() {
  return PROBE_TOKEN;
}

module.exports = { tagReactInstance, readReactInstanceTag, getProbeToken };
