// Central remote configuration. Remote URLs themselves are injected at build
// time from .env (see webpack.config.js); this registry maps stable metadata.
export const REMOTE_APPS = [
  {
    id: "mfeApp1",
    label: "App 1 — Counter",
    path: "/app1",
    load: () => import("mfeApp1/App"),
    testId: "remote-mfe-app-1",
  },
  {
    id: "mfeApp2",
    label: "App 2 — Profile",
    path: "/app2",
    load: () => import("mfeApp2/App"),
    testId: "remote-mfe-app-2",
  },
  {
    id: "mfeApp3",
    label: "App 3 — Reports",
    path: "/app3",
    load: () => import("mfeApp3/App"),
    testId: "remote-mfe-app-3",
  },
];
