import { isObject } from "../shared";
import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
  private _dirty = true;
  private _setter;
  private _effect;
  private _value;
  constructor(getter, setter?) {
    this._setter = setter;
    this._effect = new ReactiveEffect(getter, () => {
      this._dirty = true;
    });
  }
  get value() {
    if (this._dirty) {
      this._value = this._effect.run();
      this._dirty = false;
    }
    return this._value;
  }
  set value(newValue) {
    this._value = newValue;
    if (typeof this._setter === "function") {
      this._setter(newValue);
    }
  }
}

export function computed(getter) {
  let set, get;
  if (isObject(getter)) {
    set = getter.set;
    get = getter.get;
  } else {
    get = getter;
  }
  return new ComputedRefImpl(get, set);
}
