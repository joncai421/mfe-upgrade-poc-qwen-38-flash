import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "../../shared/styles/base.css";

const target = document.getElementById("root");
target.innerHTML = "";
ReactDOM.render(
  React.createElement(App),
  target
);
