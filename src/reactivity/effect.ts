const targetMap = new WeakMap();
let activeEffect: ReactiveEffect;
let shouldTrack;

class ReactiveEffect {
  private _fn;
  active = true;
  deps: any[] = [];
  onStop?: () => void;
  constructor(fn, public scheduler) {
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
      this.active = false;
      this.onStop && this.onStop();
    }
  }
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  Object.assign(_effect, options);
  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}

export function track(target, key) {
  if (!shouldTrack) return;
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
  if (activeEffect) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const dep = depsMap.get(key);
  if (!dep) return;

  for (const effect of dep) {
    // 在后面的实现中，被收集的依赖会有run方法，在该方法中会执行真正需要执行的函数
    if (typeof effect.scheduler === "function") {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}
