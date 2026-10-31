// Central remote configuration. Remote URLs themselves are injected at build
// time from .env (see webpack.config.js); this registry maps stable metadata.
//
// Option B metadata:
//   shareScope    — the Module Federation scope the host initialises for that
//                   remote (must match container-app/webpack.config.js).
//   expectedReact — what the diagnostics view documents as the expected runtime;
//                   the actual version always comes from getRuntimeInfo() at
//                   runtime, never from this field.
export const CONTAINER_SHARE_SCOPE = "react16";

export const REMOTE_APPS = [
  {
    id: "mfeApp1",
    label: "App 1 — Counter",
    path: "/app1",
    load: () => import("mfeApp1/App"),
    testId: "remote-mfe-app-1",
    shareScope: "react19",
    expectedReact: "19.3.1",
  },
  {
    id: "mfeApp2",
    label: "App 2 — Profile",
    path: "/app2",
    load: () => import("mfeApp2/App"),
    testId: "remote-mfe-app-2",
    shareScope: "react16",
    expectedReact: "16.14.0",
  },
  {
    id: "mfeApp3",
    label: "App 3 — Reports",
    path: "/app3",
    load: () => import("mfeApp3/App"),
    testId: "remote-mfe-app-3",
    shareScope: "react16",
    expectedReact: "16.14.0",
  },
];
