import { isObject } from "../shared/index";

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    isMounted: false,
  };

  return component;
}

export function setupComponent(instance) {
  // initProps
  // initSlots
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  const component = instance.type;

  const { setup } = component;

  if (setup) {
    const setupResult = setup();
    handleSetupResult(instance, setupResult);
  }
}

// 对传入的setupResult进行类型判断，然后做相应的处理
function handleSetupResult(instance, setupResult) {
  if (isObject(setupResult)) {
    instance.setupResult = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  const component = instance.type;

  // 确保instance上有render函数
  if (component.render) {
    instance.render = component.render;
  }
}
