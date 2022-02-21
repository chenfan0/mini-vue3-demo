import { createVNode } from "./vnode";
import { render } from "./renderer";

export function createApp(rootComponent) {
  return {
    mount(container) {
      const vnode = createVNode(rootComponent);
      render(vnode, container);
    },
  };
}
