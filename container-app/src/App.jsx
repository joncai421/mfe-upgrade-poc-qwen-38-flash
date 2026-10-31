import React from "react";
import { Router, Switch, Route } from "react-router-dom";
import { createMemoryHistory } from "history";
import Navigation from "./components/Navigation";
import RemoteSection from "./components/RemoteSection";
import Diagnostics from "./components/Diagnostics";
import { REMOTE_APPS } from "./remotes/registry";

// Memory history keeps the container independent of any remote's routing and
// lets the container bundle run inside jsdom (integration tests) without URL support.
const history = createMemoryHistory();

export default function App() {
  return (
    <Router history={history}>
      <div className="min-h-screen flex flex-col">
        <header className="bg-gray-800 text-white" data-testid="app-shell">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold">MFE Container — React 16 Baseline</h1>
            <span
              className="text-xs bg-gray-700 rounded px-2 py-1"
              data-testid="container-react-version"
            >
              React {React.version}
            </span>
          </div>
          <Navigation />
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
          <Switch>
            {REMOTE_APPS.map((remote) => (
              <Route key={remote.id} path={remote.path}>
                <RemoteSection remote={remote} />
              </Route>
            ))}
            <Route path="/diagnostics">
              <Diagnostics />
            </Route>
            <Route path="/">
              <RemoteSection remote={REMOTE_APPS[0]} />
            </Route>
          </Switch>
        </main>
        <footer className="text-center text-xs text-gray-500 py-3">
          Module Federation baseline — container mounts remotes through the mount/unmount
          contract, never through shared React trees.
        </footer>
      </div>
    </Router>
  );
}
