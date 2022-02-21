import { createVNode } from "./vnode";

export function h(type, props: any = {}, children: any = []) {
  return createVNode(type, props, children);
}
