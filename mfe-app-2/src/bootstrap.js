import { mount } from "./mount";

const target = document.getElementById("root");
if (target) {
  target.innerHTML = "";
  mount(target, { origin: "standalone" });
}
