import { isObject } from "../shared";
import { reactive } from "./reactive";
import { trackEffect, triggerEffect, isTracking } from "./effect";

class RefImplement {
  private _value;
  private deps;
  private rawValue;
  public __v_isRef = true;
  constructor(value) {
    this.rawValue = value;
    this._value = conver(value);
    this.deps = new Set();
  }
  get value() {
    if (isTracking()) {
      trackEffect(this.deps);
    }
    return this._value;
  }

  set value(newValue) {
    if (isChange(this.rawValue, newValue)) return;
    this.rawValue = newValue;
    this._value = conver(newValue);
    triggerEffect(this.deps);
  }
}

function isChange(rawValue, newValue) {
  return rawValue === newValue;
}

function conver(value) {
  return isObject(value) ? reactive(value) : value;
}

export function ref(value) {
  return new RefImplement(value);
}

export function isRef(value) {
  if (!value) return false;
  return !!value.__v_isRef;
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(objWithRefs) {
  return new Proxy(objWithRefs, {
    get(target, key, receiver) {
      return unRef(Reflect.get(target, key, receiver));
    },
    set(target, key, newValue, receiver) {
      if (isRef(target[key]) && !isRef(newValue)) {
        return Reflect.set(target, key, ref(newValue), receiver);
      }
      return Reflect.set(target, key, newValue, receiver);
    },
  });
}
