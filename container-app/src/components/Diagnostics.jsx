import React from "react";
import ReactDOM from "react-dom";
import { REMOTE_APPS, CONTAINER_SHARE_SCOPE } from "../remotes/registry";
import { sharesContainerRuntime } from "../utils/runtimeProbe";
import { readReactInstanceTag } from "../../../shared/scope-probe";

/**
 * Runtime diagnostics: loads each remote through the real Module Federation
 * runtime, mounts it into a disposable DOM node, reads getRuntimeInfo() and
 * immediately unmounts. This reports the ACTUAL React runtime each remote
 * resolves at execution time — not package.json metadata.
 *
 * On the Option B branch the probe also surfaces which rendering API and which
 * share scope each application reports, so "React 16 and React 19 really are two
 * separate runtimes on this page" is verifiable in the browser.
 */
export default class Diagnostics extends React.Component {
  state = { rows: [], probing: true };
  probeNodes = [];
  mountedHandles = [];

  componentDidMount() {
    this.probeAll();
  }

  componentWillUnmount() {
    this.mountedHandles.forEach((handle) => {
      try {
        handle.unmount();
      } catch (err) {
        /* ignore probe teardown errors */
      }
    });
    this.probeNodes.forEach((node) => node.remove());
  }

  probeAll() {
    Promise.all(
      REMOTE_APPS.map((remote) =>
        remote
          .load()
          .then((mod) => {
            const node = document.createElement("div");
            node.style.display = "none";
            document.body.appendChild(node);
            this.probeNodes.push(node);
            const handle = mod.mount(node, { origin: "diagnostics-probe" });
            this.mountedHandles.push(handle);
            const info = handle.getRuntimeInfo ? handle.getRuntimeInfo() : {};
            return {
              id: remote.id,
              label: remote.label,
              reactVersion: info.reactVersion || "unknown",
              reactDomVersion: info.reactDomVersion || "unknown",
              renderer: info.renderer || "unknown",
              shareScope: info.shareScope || "unknown",
              sharesRuntime: sharesContainerRuntime(info),
              expectedReact: remote.expectedReact,
            };
          })
          .catch((err) => ({
            id: remote.id,
            label: remote.label,
            reactVersion: `error: ${err.message}`,
            reactDomVersion: "-",
            renderer: "-",
            shareScope: remote.shareScope,
            sharesRuntime: "unknown",
            expectedReact: remote.expectedReact,
          }))
      )
    )
      .then((rows) => this.setState({ rows, probing: false }))
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("diagnostics probe failed", err);
        this.setState({ rows: [], probing: false });
      });
  }

  render() {
    const { rows, probing } = this.state;
    return (
      <div className="app-card" data-testid="diagnostics">
        <h2 className="app-heading">Runtime Diagnostics</h2>
        <p className="text-xs text-gray-600 mb-3">
          Versions below are read from the React / React DOM modules each application is
          actually executing with (Option B keeps them in separate share scopes), not from
          package.json.
        </p>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Application</th>
              <th className="py-2">React</th>
              <th className="py-2">React DOM</th>
              <th className="py-2">Rendering API</th>
              <th className="py-2">Share scope</th>
              <th className="py-2">Container React instance</th>
            </tr>
          </thead>
          <tbody>
            <tr
              className="border-b"
              data-testid="runtime-containerApp"
              data-react-version={React.version}
              data-react-dom-version={ReactDOM.version}
              data-renderer="react-dom:render"
              data-share-scope={CONTAINER_SHARE_SCOPE}
              data-self-tagged={readReactInstanceTag(React) ? "yes" : "no"}
            >
              <td className="py-2">Container (this application)</td>
              <td className="py-2">{React.version}</td>
              <td className="py-2">{ReactDOM.version}</td>
              <td className="py-2">react-dom:render</td>
              <td className="py-2">{CONTAINER_SHARE_SCOPE}</td>
              <td className="py-2">n/a (this is the container)</td>
            </tr>
            {probing
              ? (
                  <tr>
                    <td className="py-2 text-gray-500" colSpan={6}>
                      Probing remotes…
                    </td>
                  </tr>
                )
              : rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b"
                    data-testid={`runtime-${row.id}`}
                    data-react-version={row.reactVersion}
                    data-react-dom-version={row.reactDomVersion}
                    data-renderer={row.renderer}
                    data-share-scope={row.shareScope}
                    data-shares-container-runtime={row.sharesRuntime}
                    data-expected-react={row.expectedReact}
                  >
                    <td className="py-2">{row.label}</td>
                    <td className="py-2">{row.reactVersion}</td>
                    <td className="py-2">{row.reactDomVersion}</td>
                    <td className="py-2">{row.renderer}</td>
                    <td className="py-2">{row.shareScope}</td>
                    <td className="py-2">{row.sharesRuntime}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    );
  }
}
