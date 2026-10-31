import React from "react";
import { sharesContainerRuntime } from "../utils/runtimeProbe";

/**
 * Mounts a remote micro-frontend through the framework-independent
 * mount/unmount contract (PRD 2.2). The container renders only a plain
 * placeholder <div>; no remote React elements enter the container's own
 * component tree, so different React runtimes can never be mixed in one tree.
 */
export default class RemoteSection extends React.Component {
  state = { status: "loading", error: null, runtimeInfo: null };

  hostRef = React.createRef();
  handle = null;
  cancelled = false;

  componentDidMount() {
    this.loadRemote();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.remote.id !== this.props.remote.id) {
      this.teardown();
      this.loadRemote();
    }
  }

  componentWillUnmount() {
    this.teardown();
  }

  teardown() {
    if (this.handle) {
      try {
        this.handle.unmount();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("remote unmount failed", err);
      }
      this.handle = null;
    }
  }

  loadRemote() {
    const { remote } = this.props;
    this.setState({ status: "loading", error: null, runtimeInfo: null });

    // remote.load() resolves through the Module Federation runtime and
    // returns the remote's { mount, unmount? } contract module.
    remote
      .load()
      .then((mod) => {
        if (this.cancelled) {
          return;
        }
        const element = this.hostRef.current;
        if (!element) {
          return;
        }
        if (typeof mod.mount !== "function") {
          throw new Error(`Remote "${remote.id}" does not implement mount()`);
        }
        this.handle = mod.mount(element, { origin: "container-app" });
        const runtimeInfo = this.handle && this.handle.getRuntimeInfo ? this.handle.getRuntimeInfo() : null;
        this.setState({ status: "mounted", runtimeInfo });
      })
      .catch((err) => {
        if (this.cancelled) {
          return;
        }
        // eslint-disable-next-line no-console
        console.error(`Failed to load remote ${remote.id}`, err);
        this.setState({ status: "error", error: String(err && err.message ? err.message : err) });
      });
  }

  render() {
    const { remote } = this.props;
    const { status, error, runtimeInfo } = this.state;
    const sharesRuntime = sharesContainerRuntime(runtimeInfo);
    return (
      <section data-testid={remote.testId} data-remote-id={remote.id}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-800">{remote.label}</h2>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              status === "mounted"
                ? "bg-green-100 text-green-800"
                : status === "error"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
            data-testid={`status-${remote.id}`}
          >
            {status}
          </span>
        </div>
        {runtimeInfo ? (
          <div
            className="text-xs text-gray-600 mb-3"
            data-testid={`runtime-${remote.id}`}
            data-react-version={runtimeInfo.reactVersion}
            data-react-dom-version={runtimeInfo.reactDomVersion}
            data-renderer={runtimeInfo.renderer}
            data-share-scope={runtimeInfo.shareScope}
            data-shares-container-runtime={sharesRuntime}
          >
            remote runtime: react@{runtimeInfo.reactVersion} react-dom@{runtimeInfo.reactDomVersion}
            {runtimeInfo.shareScope ? ` scope@${runtimeInfo.shareScope}` : ""}
            {sharesRuntime === "yes" ? " (shared with container)" : " (own instance)"}
          </div>
        ) : null}
        {status === "error" ? (
          <div className="app-card border border-red-300 text-red-700" data-testid={`error-${remote.id}`}>
            Remote “{remote.id}” could not be loaded: {error}
          </div>
        ) : null}
        {/* The remote owns everything inside this div, including its unmount. */}
        <div ref={this.hostRef} data-testid={`host-${remote.id}`} />
      </section>
    );
  }
}
