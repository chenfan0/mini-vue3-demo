import { isObject } from "../shared";
import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";

function createGetter(isReadonly = false, isShallow = false) {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver);

    if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    }

    if (!isReadonly) {
      track(target, key);
    }

    if (isObject(res) && !isShallow) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    return res;
  };
}

function createSetter(isReadonly = false) {
  return function set(target, key, newValue, receiver) {
    const res = Reflect.set(target, key, newValue, receiver);
    if (!isReadonly) {
      trigger(target, key);
    }
    return res;
  };
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReactiveGet = createGetter(false, true);
const shallowReadonlyGet = createGetter(true, true);

export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target) {
    console.warn(`${target} is a readonly can not be set`);
    return true;
  },
};

export const shallowReactiveHandlers = {
  get: shallowReactiveGet,
  set,
};

export const shallowReadonlyHandlers = Object.assign({}, readonlyHandlers, {
  get: shallowReadonlyGet,
});
