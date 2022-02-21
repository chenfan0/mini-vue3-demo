const isObject = (value) => {
    return value !== null && typeof value === "object";
};

const targetMap = new WeakMap();
let activeEffect;
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.active = true;
        this.deps = [];
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        activeEffect = this;
        // return this._fn();
        shouldTrack = true;
        const res = this._fn();
        shouldTrack = false;
        return res;
    }
    stop() {
        if (this.active) {
            this.deps.forEach((dep) => {
                if (dep.has(this)) {
                    dep.delete(this);
                }
            });
            // 清空数组
            this.deps.length = 0;
            this.active = false;
            this.onStop && this.onStop();
        }
    }
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    Object.assign(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function track(target, key) {
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffect(dep);
}
function trackEffect(dep) {
    if (activeEffect) {
        dep.add(activeEffect);
        activeEffect.deps.push(dep);
    }
}
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    const dep = depsMap.get(key);
    if (!dep)
        return;
    triggerEffect(dep);
}
function triggerEffect(dep) {
    for (const effect of dep) {
        // 在后面的实现中，被收集的依赖会有run方法，在该方法中会执行真正需要执行的函数
        if (typeof effect.scheduler === "function") {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

class ComputedRefImpl {
    constructor(getter, setter) {
        this._dirty = true;
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
function computed(getter) {
    let set, get;
    if (isObject(getter)) {
        set = getter.set;
        get = getter.get;
    }
    else {
        get = getter;
    }
    return new ComputedRefImpl(get, set);
}

function createGetter(isReadonly = false, isShallow = false) {
    return function get(target, key, receiver) {
        const res = Reflect.get(target, key, receiver);
        if (key === "__v_isReadonly" /* IS_READONLY */) {
            return isReadonly;
        }
        if (key === "__v_isReactive" /* IS_REACTIVE */) {
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
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target) {
        console.warn(`${target} is a readonly can not be set`);
        return true;
    },
};
const shallowReactiveHandlers = {
    get: shallowReactiveGet,
    set,
};
const shallowReadonlyHandlers = Object.assign({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function createReactiveObj(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.error(`${raw} must be a object`);
    }
    return new Proxy(raw, baseHandlers);
}
function reactive(raw) {
    return createReactiveObj(raw, mutableHandlers);
}
function shallowReactive(raw) {
    return createReactiveObj(raw, shallowReactiveHandlers);
}
function readonly(raw) {
    return createReactiveObj(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObj(raw, shallowReadonlyHandlers);
}
function isReadonly(value) {
    return !!value["__v_isReadonly" /* IS_READONLY */];
}
function isReactive(value) {
    return !!value["__v_isReactive" /* IS_REACTIVE */];
}
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}

class RefImplement {
    constructor(value) {
        this.__v_isRef = true;
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
        if (isChange(this.rawValue, newValue))
            return;
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
function ref(value) {
    return new RefImplement(value);
}
function isRef(value) {
    if (!value)
        return false;
    return !!value.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objWithRefs) {
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

function createVNode(type, props = {}, children = []) {
    const vnode = {
        type,
        props,
        children,
        el: null,
    };
    return vnode;
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        isMounted: false,
    };
    return component;
}
function setupComponent(instance) {
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

// import { effect } from "../reactivity/effect";
function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    if (isObject(vnode.type)) {
        processComponent(vnode, container);
    }
    else {
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
    }
    else if (Array.isArray(children)) {
        mountChildren(vnode, el);
    }
    container.appendChild(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach((child) => {
        patch(child, container);
    });
}

function createApp(rootComponent) {
    return {
        mount(container) {
            const vnode = createVNode(rootComponent);
            render(vnode, container);
        },
    };
}

function h(type, props = {}, children = []) {
    return createVNode(type, props, children);
}

export { computed, createApp, effect, h, isProxy, isReactive, isReadonly, isRef, proxyRefs, reactive, readonly, ref, shallowReactive, shallowReadonly, unRef };
