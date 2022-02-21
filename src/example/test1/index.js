import { h, createApp } from "../../../lib/mini-vue.esm.js";

const App = {
  setup() {},
  render() {
    return h("div", { class: "aaa" }, "hello mini-vue3");
  },
};
debugger;
createApp(App).mount(document.getElementById("app"));
