import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { identify } from "../../shared/runtime-identity";
import "../../shared/styles/base.css";

const target = document.getElementById("root");
target.innerHTML = "";
ReactDOM.render(
  React.createElement(App),
  target
);

// The container consumes the default share scope exactly like the remotes do, so it
// joins the page-wide runtime census at boot. Version/identity evidence then does not
// depend on the diagnostics page having been opened.
identify(React, "react", "containerApp");
identify(ReactDOM, "react-dom", "containerApp");
