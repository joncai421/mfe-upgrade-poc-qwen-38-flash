import React from "react";
import ReactDOM from "react-dom";
import { REMOTE_APPS } from "../remotes/registry";
import { identify, summarizePageRuntimes } from "../../../shared/runtime-identity";

/**
 * Runtime diagnostics: loads each remote through the real Module Federation
 * runtime, mounts it into a disposable DOM node, reads getRuntimeInfo() and
 * immediately unmounts. This reports the ACTUAL React runtime each remote
 * resolves at execution time — not package.json metadata.
 *
 * Under Option C every build shares ONE "default" scope holding two React
 * generations, so a version number alone is not enough: a silent local fallback
 * would still print "16.14.0". Each row therefore also carries the IDENTITY of
 * the module object that was resolved (see shared/runtime-identity.js), and the
 * summary below the table shows how many distinct React instances the page is
 * actually running and which applications share each one.
 *
 * All four builds mount all three remotes concurrently here, which is also the
 * harshest share-scope initialization order the container can produce.
 */
export default class Diagnostics extends React.Component {
  state = { rows: [], probing: true, self: null, summary: null };
  probeNodes = [];
  mountedHandles = [];

  componentDidMount() {
    // The container is a consumer of the shared scope too: register its own
    // resolved modules so the page-wide instance count includes it.
    this.setState({
      self: {
        react: identify(React, "react", "containerApp"),
        reactDom: identify(ReactDOM, "react-dom", "containerApp"),
      },
    });
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
              reactIdentity: info.identity && info.identity.react,
              reactDomIdentity: info.identity && info.identity.reactDom,
            };
          })
          .catch((err) => ({
            id: remote.id,
            label: remote.label,
            reactVersion: `error: ${err.message}`,
            reactDomVersion: "-",
            renderer: "-",
            shareScope: "-",
            reactIdentity: null,
            reactDomIdentity: null,
          }))
      )
    )
      .then((rows) => this.setState({ rows, probing: false, summary: summarizePageRuntimes() }))
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("diagnostics probe failed", err);
        this.setState({ rows: [], probing: false, summary: summarizePageRuntimes() });
      });
  }

  renderSelfRow() {
    const { self } = this.state;
    const reactIdentity = self && self.react;
    return (
      <tr
        className="border-b"
        data-testid="runtime-containerApp"
        data-react-version={React.version}
        data-react-dom-version={ReactDOM.version}
        data-share-scope="default"
        data-renderer="legacy (ReactDOM.render)"
        data-react-instance={reactIdentity ? reactIdentity.id : "pending"}
      >
        <td className="py-2">Container (this application)</td>
        <td className="py-2">{React.version}</td>
        <td className="py-2">{ReactDOM.version}</td>
        <td className="py-2">legacy</td>
        <td className="py-2">default</td>
        <td className="py-2">{reactIdentity ? reactIdentity.id : "-"}</td>
      </tr>
    );
  }

  renderSummary() {
    const { summary } = this.state;
    if (!summary) {
      return null;
    }
    return (
      <div
        className="mt-4 text-xs text-gray-700"
        data-testid="page-runtime-summary"
        data-distinct-react-versions={summary.distinctReactVersions.join(",")}
        data-react-instance-count={summary.reactInstances.length}
        data-react-dom-instance-count={summary.reactDomInstances.length}
        data-share-scope={summary.scopeName}
      >
        <h3 className="app-subheading mb-2">Page-wide React instances (default share scope)</h3>
        <ul className="space-y-1">
          {summary.reactInstances.map((instance) => (
            <li key={instance.id} data-testid={`react-instance-${instance.id}`}>
              <span className="font-mono">{instance.id}</span> — react@{instance.version} shared by{" "}
              {instance.consumers.join(", ") || "nobody yet"}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  render() {
    const { rows, probing } = this.state;
    return (
      <div className="app-card" data-testid="diagnostics">
        <h2 className="app-heading">Runtime Diagnostics</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Application</th>
              <th className="py-2">React</th>
              <th className="py-2">React DOM</th>
              <th className="py-2">Renderer</th>
              <th className="py-2">Share scope</th>
              <th className="py-2">React instance</th>
            </tr>
          </thead>
          <tbody>
            {this.renderSelfRow()}
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
                    data-share-scope={row.shareScope}
                    data-renderer={row.renderer}
                    data-react-instance={row.reactIdentity ? row.reactIdentity.id : "-"}
                    data-react-instance-consumers={
                      row.reactIdentity ? row.reactIdentity.consumers.join(",") : "-"
                    }
                  >
                    <td className="py-2">{row.label}</td>
                    <td className="py-2">{row.reactVersion}</td>
                    <td className="py-2">{row.reactDomVersion}</td>
                    <td className="py-2">{row.renderer}</td>
                    <td className="py-2">{row.shareScope}</td>
                    <td className="py-2">{row.reactIdentity ? row.reactIdentity.id : "-"}</td>
                  </tr>
                ))}
          </tbody>
        </table>
        {this.renderSummary()}
      </div>
    );
  }
}
