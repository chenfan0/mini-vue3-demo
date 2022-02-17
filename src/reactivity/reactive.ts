import { isObject } from "../shared";
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReactiveHandlers,
  shallowReadonlyHandlers,
} from "./baseHandlers";

export const enum ReactiveFlags {
  IS_READONLY = "__v_isReadonly",
  IS_REACTIVE = "__v_isReactive",
}

function createReactiveObj(raw, baseHandlers) {
  if (!isObject(raw)) {
    console.error(`${raw} must be a object`);
  }
  return new Proxy(raw, baseHandlers);
}

export function reactive(raw) {
  return createReactiveObj(raw, mutableHandlers);
}

export function shallowReactive(raw) {
  return createReactiveObj(raw, shallowReactiveHandlers);
}

export function readonly(raw) {
  return createReactiveObj(raw, readonlyHandlers);
}

export function shallowReadonly(raw) {
  return createReactiveObj(raw, shallowReadonlyHandlers);
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}
