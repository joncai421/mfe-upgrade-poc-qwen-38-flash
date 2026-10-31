import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createMountContract } from "../../shared/mount-contract";
import { makeStore } from "./redux/store";
import App from "./App";
import "../../shared/styles/base.css";

function renderRoot(props) {
  const store = makeStore();
  return (
    <Provider store={store}>
      <App {...props} />
    </Provider>
  );
}

const contract = createMountContract(React, ReactDOM, renderRoot, { appName: "mfeApp2" });

export const mount = contract.mount;
export const unmount = contract.unmount;
export default contract;
