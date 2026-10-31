import React from "react";
import ReactDOM from "react-dom";
import { REMOTE_APPS } from "../remotes/registry";

/**
 * Runtime diagnostics: loads each remote through the real Module Federation
 * runtime, mounts it into a disposable DOM node, reads getRuntimeInfo() and
 * immediately unmounts. This reports the ACTUAL React runtime each remote
 * resolves at execution time — not package.json metadata.
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
            };
          })
          .catch((err) => ({
            id: remote.id,
            label: remote.label,
            reactVersion: `error: ${err.message}`,
            reactDomVersion: "-",
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
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Application</th>
              <th className="py-2">React</th>
              <th className="py-2">React DOM</th>
            </tr>
          </thead>
          <tbody>
            <tr
              className="border-b"
              data-testid="runtime-containerApp"
              data-react-version={React.version}
              data-react-dom-version={ReactDOM.version}
            >
              <td className="py-2">Container (this application)</td>
              <td className="py-2">{React.version}</td>
              <td className="py-2">{ReactDOM.version}</td>
            </tr>
            {probing
              ? (
                  <tr>
                    <td className="py-2 text-gray-500" colSpan={3}>
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
                  >
                    <td className="py-2">{row.label}</td>
                    <td className="py-2">{row.reactVersion}</td>
                    <td className="py-2">{row.reactDomVersion}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    );
  }
}
