import React from "react";
import ReactDOM from "react-dom";
import { tagReactInstance } from "../../shared/scope-probe";
import App from "./App";
import { CONTAINER_SHARE_SCOPE } from "./remotes/registry";
import "../../shared/styles/base.css";

// Tag the React instance the container resolved BEFORE any remote is loaded, so
// remotes can report whether the share scope handed them this same instance.
tagReactInstance(React, CONTAINER_SHARE_SCOPE);

const target = document.getElementById("root");
target.innerHTML = "";
ReactDOM.render(
  React.createElement(App),
  target
);
