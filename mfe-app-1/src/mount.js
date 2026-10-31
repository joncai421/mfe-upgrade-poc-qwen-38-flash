import React from "react";
import ReactDOM from "react-dom"; // React 19 renders through react-dom/client; this import is for
// version/identity reporting, and it proves the `react-dom` root and the
// `react-dom/client` subpath negotiate to the same generation.
import * as ReactDOMClient from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { createRootMountContract } from "../../shared/mount-contract";
import { makeStore } from "./redux/store";
import App from "./App";
import "../../shared/styles/base.css";

// Each mount() creates its own Redux store => state is isolated per root,
// satisfying "Redux state remains isolated between independent MFEs".
function renderRoot(props) {
  const store = makeStore();
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={[props.initialPath || "/"]}>
        <App {...props} />
      </MemoryRouter>
    </Provider>
  );
}

// React 19 replacement for ReactDOM.render/unmountComponentAtNode. The public
// mount/unmount surface is identical to the React 16 apps, so the container needs
// no change and no React Bridge is introduced.
const contract = createRootMountContract(React, ReactDOMClient, renderRoot, {
  appName: "mfeApp1",
  reactDomModule: ReactDOM,
});

// This module is what the container receives from `import("mfeApp1/App")`.
export const mount = contract.mount;
export const unmount = contract.unmount;
export default contract;
