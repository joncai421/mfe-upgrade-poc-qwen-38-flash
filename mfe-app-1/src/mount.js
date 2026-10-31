import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { createMountContract } from "../../shared/mount-contract";
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

const contract = createMountContract(React, ReactDOM, renderRoot);

// This module is what the container receives from `import("mfeApp1/App")`.
export const mount = contract.mount;
export const unmount = contract.unmount;
export default contract;
