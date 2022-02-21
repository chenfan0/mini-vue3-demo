export function createVNode(type, props: any = {}, children: any = []) {
  const vnode = {
    type,
    props,
    children,
    el: null,
  };
  return vnode;
}
