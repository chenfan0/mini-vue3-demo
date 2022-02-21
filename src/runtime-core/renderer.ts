// import { effect } from "../reactivity/effect";
import { isObject } from "../shared/index";
import { createComponentInstance, setupComponent } from "./components";

export function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode, container) {
  if (isObject(vnode.type)) {
    processComponent(vnode, container);
  } else {
    processElement(vnode, container);
  }
}

function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function mountComponent(initialVNode, container) {
  const instance = createComponentInstance(initialVNode);

  //
  setupComponent(instance);
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance, container) {
  const { isMounted } = instance;
  if (!isMounted) {
    // 挂载
    const subTree = (instance.subTree = instance.render());
    patch(subTree, container);
    instance.isMounted = true;
  } else {
    // TODO 更新
  }
}

function processElement(vnode, container) {
  mountElement(vnode, container);
}

function mountElement(vnode, container) {
  const { type, props, children } = vnode;

  // 创建节点
  const el = (vnode.el = document.createElement(type));

  // 处理props
  for (const key in props) {
    el.setAttribute(key, props[key]);
  }

  // 处理children
  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    mountChildren(vnode, el);
  }
  container.appendChild(el);
}

function mountChildren(vnode, container) {
  vnode.children.forEach((child) => {
    patch(child, container);
  });
}
