import {
  reactive,
  readonly,
  isReadonly,
  isReactive,
  isProxy,
  shallowReactive,
  shallowReadonly,
} from "../reactive";
describe("reactive", () => {
  it("happy path", () => {
    const obj = {
      age: 18,
    };
    const proxyObj: any = reactive(obj);
    expect(obj).not.toBe(proxyObj);
    proxyObj.age++;
    expect(proxyObj.age).toBe(19);
    expect(obj.age).toBe(19);
    expect(isReactive(proxyObj)).toBe(true);
  });
});

describe("redonly", () => {
  it("happy path", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const reactiveOri = reactive(original);
    const shallowOri = shallowReactive(original);
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);
    expect(wrapped.foo).toBe(1);
    expect(isReadonly(original)).toBe(false);
    expect(isReadonly(wrapped)).toBe(true);
    expect(isProxy(wrapped)).toBe(true);
    expect(isProxy(original)).toBe(false);
    expect(isReactive(reactiveOri.bar)).toBe(true);
    expect(isReactive(shallowOri.bar)).toBe(false);
  });

  it("warn when call set", () => {
    console.warn = jest.fn();

    const user = readonly({
      age: 10,
    });

    user.age = 11;

    expect(console.warn).toBeCalled();
    expect(isReadonly(user)).toBe(true);
  });

  it("nested readonly", () => {
    const obj = readonly({
      foo: {
        age: 10,
      },
    });
    expect(isReadonly(obj.foo)).toBe(true);
  });

  it("shallowReadonly", () => {
    const obj = shallowReadonly({
      foo: {
        age: 10,
      },
    });
    expect(isReadonly(obj)).toBe(true);
    expect(isReadonly(obj.foo)).toBe(false);
  });
});
