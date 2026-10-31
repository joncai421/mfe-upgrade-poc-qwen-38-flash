import * as React from "react";
import { createRoot, version as reactDomVersion } from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { createMountContract } from "../../shared/mount-contract";
import { makeStore } from "./redux/store";
import App from "./App";
import "../../shared/styles/base.css";

// React 19 removes ReactDOM.render / unmountComponentAtNode, so the concurrent
// root API from react-dom/client is used here. The public mount contract is
// unchanged, so the container code does not need to know this remote upgraded.
//
// Each mount() call creates its own root AND its own Redux store => state is
// isolated per root, and repeated mount/unmount cycles stay clean.
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

// Only `createRoot` is handed to the contract as the rendering binding; the
// react-dom version reported by react-dom/client is passed through meta.
const contract = createMountContract(React, { createRoot }, renderRoot, {
  reactDomVersion,
  shareScope: "react19",
});

// This module is what the container receives from `import("mfeApp1/App")`.
export const mount = contract.mount;
export const unmount = contract.unmount;
export default contract;
