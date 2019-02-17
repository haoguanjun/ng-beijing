---
date: 2018-11-07
title: Angular 是如何使用 NgZone/Zone.js 进行脏检查的？
categories: angular
---
Angular 是如何使用 NgZone/Zone.js 进行脏检查的？
了解何时更新 UI 是 JavaScript 框架必须解决的重要问题之一。
<!-- more -->
# Angular 是如何使用 NgZone/Zone.js 进行脏检查的？

了解何时更新 UI 是 JavaScript 框架必须解决的重要问题之一。

当数据状态发生变化的时候，不同的 JavaScript 框架有着不同的方式来刷新界面。

**React.js** 使用来自 `Component` 类的 `setState()` 方法，来知道在 `state` 对象中的某个属性被更新了。

```javascript
class Component {
    setState(state = {}) {
        // assigns the new state to the state object
        this.state = Object.assign(this.state, state)
        // updates the UI
        this.render()
    }
}
```

**AngularJS** 使用 `scope` 和 `digest()`。Scopes 类似纯 JS 对待，但是拥有一些额外的功能支持它监测数据属性的变化。`$digest` 和 `$watch` 方法被实现用于执行 *digest cycle* 和 *dirty checking*。

在 **Angular** 中，[Zone.js](https://github.com/angular/zone.js/) 被用于当特定异步操作发生的时候，触发变更检测周期。在本文中，我们将深入探索 Zone.js 是如何被 Angular 用于脏检查和执行 UI 更新的。

## 什么是 Zone.js?

在我们演示 Angular 是如何借力 Zone.js 之前，让我们先看一下 Zone.js 是什么，以及 Angular 使用它做什么。

Zone.js 是帮助开发者拦截和保持跟踪异步操作的执行上下文。Zone 适用于在概念上将每个操作与一个 Zone 关联在一起。每个 Zone 可以 `fork` 和创建带有不同上下文的子 zone ，没有限制。在 zone 内部，异步操作通过使用不同的 API 被捕获，所以，开发者可以决定使用拦截做什么。

> 我们开发 Zone.js 作为 Angular 项目的一部分。起初的目标不是控制时间，而是知道何时异步操作完成，以便我们可以执行 Angular 的变更检测和更新视图。
>
> Victor Savkin (Co-founder of Narwhal Technologies (nrwl.io) and member of Angular core team)

### Zone.js API

我们演练一下常用的 Zone.js API

```javascript
interface Zone {
  // The parent Zone.
  parent: Zone|null;
  
  //The Zone name (useful for debugging)
  name: string;
  //Returns a value associated with the `key`.
  get(key: string): any;
  //Used to create a child zone.
  fork(zoneSpec: ZoneSpec): Zone;
  //Wraps a callback function in a new function which will properly restore the current zone upon invocation.
  wrap<F extends Function>(callback: F, source: string): F;
  //Invokes a function in a given zone.
  run<T>(callback: Function, applyThis?: any, applyArgs?: any[], source?: string): T;
   //Invokes a function in a given zone and catches any exceptions.
  runGuarded<T>(callback: Function, applyThis?: any, applyArgs?: any[], source?: string): T;
  //Execute the Task by restoring the [Zone.currentTask] in the Task's zone.
  runTask(task: Task, applyThis?: any, applyArgs?: any): any;
  //Schedule a MicroTask.
  scheduleMicroTask(
      source: string, callback: Function, data?: TaskData,
      customSchedule?: (task: Task) => void): MicroTask;
  //Schedule a MacroTask.
  scheduleMacroTask(
      source: string, callback: Function, data?: TaskData, customSchedule?: (task: Task) => void,
      customCancel?: (task: Task) => void): MacroTask;
  //Schedule an EventTask.
  scheduleEventTask(
      source: string, callback: Function, data?: TaskData, customSchedule?: (task: Task) => void,
      customCancel?: (task: Task) => void): EventTask;
  //Schedule an existing Task.
  scheduleTask<T extends Task>(task: T): T;
  //Allows the zone to intercept canceling of scheduled Task.
  cancelTask(task: Task): any;
}
```

#### parent

每个 zone 有一个父 zone 指向创建当前 zone 的 zone，在每个特定时刻，只有一个 zone 是激活的。

#### name

每个 zone 有一个相关的名字，主要用于调试的目的。

根 zone 的名字是 `<root>`，而 Angular 的 zone 名为 `angular`。

#### fork

`fork()` 用于创建子 zone。它返回一个新的继承自 `parent` 的 zone，fork 新的 zone 支持我们扩展返回的 zone 的行为。

```javascript
const childZone = Zone.current.fork({name: 'child_zone'})
console.log(childZone.name) // child_zone
```

这将创建新的名为 `childZone` 的新的 zone，与源 zone `Zone.current`拥有同样的能力。

子 zone 成为它所创建的 zone 的父 zone。

```javascript
const z = Zone.current
const c1 = z.fork({ name: 'child1' })
console.log(c1.parent.name) // <root>
const c2 = c1.fork({ name: 'child2' })
console.log(c2.parent.name) // child1
```

`fork` 接受 `ZoneSpec` 参数，其定义了子 zone 的规则集。

```javascript
interface ZoneSpec {
  //The name of the zone. Useful when debugging Zones.
  name: string;
   //A set of properties to be associated with Zone. Use   properties?: {[key: string]: any};
  //Allows the interception of zone forking.
  onFork?:
      (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
       zoneSpec: ZoneSpec) => Zone;
  //Allows interception of the wrapping of the callback.
  onIntercept?:
      (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, delegate: Function,
       source: string) => Function;
  //Allows interception of the callback invocation.
  onInvoke?:
      (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, delegate: Function,
       applyThis: any, applyArgs?: any[], source?: string) => any;
  //Allows interception of the error handling.
  onHandleError?:
      (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
       error: any) => boolean;
  //Allows interception of task scheduling.
  onScheduleTask?:
      (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, task: Task) => Task;
  onInvokeTask?:
      (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, task: Task,
       applyThis: any, applyArgs?: any[]) => any;
  //Allows interception of task cancellation.
  onCancelTask?:
      (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, task: Task) => any;
  //Notifies of changes to the task queue empty status.
  onHasTask?:
      (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
       hasTaskState: HasTaskState) => void;
}
```

这提供了一种拦截 zone 事件的机制。

`name`，zone 的名字，`properties` 表示存储在 zone 中的键值集，在异步操作中可以方便地共享数据。

如果你注意到，只有 `name` 和 `properties`  用于区别 zone，其它所有的属性是用于拦截不同事件的函数。

当 `fork` 函数调用的时候， `onFork` 函数将被执行。

```javascript
fork(targetZone: Zone, zoneSpec: ZoneSpec): AmbientZone {
    return this._forkZS ? this._forkZS.onFork!(this._forkDlgt!, this.zone, targetZone, zoneSpec) :
                            new Zone(targetZone, zoneSpec);
}
```

这是 zone 的源码。当 `fork` 方法调用的时候，其检测 ZoneSpec 对象是否被提供了 ( 记住 ZoneSpec 是我们定义捕获 zone 事件钩子的对象 )。如果这样的话，它调用位于 ZoneSpec 参数中的 `onFork` 函数。

```javascript
const z = Zone.current
const parent = new Zone(z, {
    name: 'parentZone',
    onFork: (d, z, tZ, zS) => {
        console.log('onFork called from `' + tZ.name + '` ZoneSpec')
        return d.fork(tZ, zS)
    }
})
const child = parent.fork({
    name: 'childZone'
})
// Outputs
onFork called from `parent` ZoneSpec
```

#### onInvoke

当 zone 被 `run` 的时候被调用。

```javascript
const z = Zone.current
const t = z.fork({
    name: 't',
    onInvoke: (d, z, tZ, zS)=>{
        console.log('onInvoke called from `' + tZ.name + '` ZoneSpec')  
    }
})
t.run(()=>{})
//Outputs
onInvoke called from `t` ZoneSpec
```

其实现如下：

```javascript
public run<T>(
   callback: (...args: any[]) => T, applyThis?: any, applyArgs?: any[], source?: string): T {
      _currentZoneFrame = {parent: _currentZoneFrame, zone: this};
      try {
        return this._zoneDelegate.invoke(this, callback, applyThis, applyArgs, source);
      } finally {
        _currentZoneFrame = _currentZoneFrame.parent!;
      }
    }
```

如果 ZoneSpec 中的定义了 `onInvode` 钩子的话，`_zoneDelegate` 的 `invoke` 方法调用它。

```javascript
invoke(
        targetZone: Zone, callback: Function, applyThis: any, applyArgs?: any[],
        source?: string): any {
    return this._invokeZS ? this._invokeZS.onInvoke!
                              (this._invokeDlgt!, this._invokeCurrZone!, targetZone, callback,
                               applyThis, applyArgs, source) :
                              callback.apply(applyThis, applyArgs);
    }
```

#### onInvokeTask

在传递给 zone 的异步操作被执行的时候，该钩子被调用。

#### onScheduleTask

当回调中的异步操作被执行的时候，该钩子被调用。

`fork` 方法实际上创建一个新的 zone 对象，如下所示：

```javascript
fork(zSpec) {
    return new Zone(zSpec)
}
```

在 `fork` 中，只有 `name` 属性是必须的。所有其他属性都是可选的。

#### run

该方法在特定 zone 中执行函数。

```javascript
function main() {
    setTimeout(() => {}, 10)
}
const childZone = Zone.current.fork({name:'child_zone'});
childZone.run(main);
```

我们这里只传递给 zone.run 一个简单的函数。函数将在当前的 zone 中执行。

我们介绍了在使用 Zone 的时候多数开发相关的 API，其它底层的很少使用的方法我们就不在本文中讨论。

## Ng in NgZone

我们已经学习了 Zone.js 以及其 API 是如何工作的。下一步，我们来看 NgZone 如何包装了 Zone 的功能以实现变更检测。

Angular 使用 Zone.js。但是，Angular 并没有封装整个框架。它仅仅借助于执行上下文来做变更检测和异步时间，以便可以触发 UI 的更新。

> 是的，Zone 和 NgZone 用于自动触发异步操作的变更检测。但是由于变更检测是一个独立的机制，也可以不使用 Zone 和 NgZone 完成
>
> Max NgWizard K

变更检测或者脏检查机制可以不依赖 Ng/Zone 工作，在异步操作执行的时候，Zone 弹出各种拦截事件，异步操作，比如：`setTimeout`，`XHR`，`EventEmitter`，`DOM` 事件等等常用于变更数据的值。

例如：

比如 DOM 事件 `click`，`submit`，`keydown-up`，`focus`，`blur` 等等，开发者经常用来执行数据状态的改变。

```html
<html>
<div>
    <p id="display"></p>
    <button onclick="add()">Add</button>
</div>
<script>
var a = 0, b = 0, results = 0;
const display = document.getElementById('display')
display.innerHTML = results
function add() {
    results = a + b
    display.innerHTML = results
}
</script>
</html>
```

在上面的代码中，我们看到 `onclick` 事件用于计算两个数的和，并显示在 DOM 中。当我们的应用变得更大和更复杂的时候，在每个 DOM 事件中添加渲染的代码变得凌乱，我们的代码变得四分五裂。

由于异步操作的结果总是改变应用状态的数据，Zone.js 在它们被调用的时候钩住并弹出事件。所以，当执行应用的更新方法，在这些事件被捕获的时候，监听这些事件变得非常简单。

捕获变更和更新作为规则被从独立的实体中抽象出来，使得开发者变得容易和简单。所有的 DOM 事件不再需要单独的 UI 更新功能。

`NgZone` 是 Zone.js 的封装，它扩展了 Zone 的概念。

```javascript
export class NgZone {
  readonly hasPendingMicrotasks: boolean = false;
  readonly hasPendingMacrotasks: boolean = false;
  readonly isStable: boolean = true;
  readonly onUnstable: EventEmitter<any> = new EventEmitter(false);
  readonly onMicrotaskEmpty: EventEmitter<any> = new EventEmitter(false);
  readonly onStable: EventEmitter<any> = new EventEmitter(false);
  readonly onError: EventEmitter<any> = new EventEmitter(false);
  constructor({enableLongStackTrace = false})
  static isInAngularZone(): boolean 
  static assertInAngularZone(): void 
  static assertNotInAngularZone(): void 
  run<T>(fn: (...args: any[]) => T, applyThis?: any, applyArgs?: any[]): T 
  runTask<T>(fn: (...args: any[]) => T, applyThis?: any, applyArgs?: any[], name?: string): T 
  runGuarded<T>(fn: (...args: any[]) => T, applyThis?: any, applyArgs?: any[]): T 
  runOutsideAngular<T>(fn: (...args: any[]) => T): T 
}
```

如我们所见，它对不同的事件实现了不同的钩子。

* hasPendingMicrotasks: 如果在队列中存在 microtask 则为 true.
* hasPendingMacrotasks: 如果在队列中存在 macrotask 则为 true.
* isStable: 用于检测在队列中是否存在没有处理的 microtask 和 macrotask .
* onUnstable: 的代码进入 Angular zone 的时候触发.
* onMicrotaskEmpty: 没有 microtask 入队的时候触发.
* onStable: 当 onMicrotaskEmpty 执行，且队列中没有 microtasks 时触发.
* onError: 当异常被捕获的时候触发.

NgZone 实际上封装了 zone，可以实现中看到。

```typescript
class NgZone{
    constructor(_a) {
        ...
        Zone.assertZonePatched();
        var self = ((this));
        self._nesting = 0;
        self._outer = self._inner = Zone.current;
        ...
        forkInnerZoneWithAngularBehavior(self);
    }
}
```

`NgZone` 首先断言 Zone.js 已经打上了补丁，将 this 赋予 self。_inner 属性被创建并赋予当前的 zone，然后，_outer 被创建并赋予了 _inner 的值。

NgZone 使用 _outer 这个 zone 在 angular zone 外执行代码，常用于不希望执行变更检测周期的时候。

zone inner 用于在 angular zone 内执行代码，这也是所有 Angular 代码执行的范围，当异步操作完成，触发变更检测。

`forkInnerZoneWithAngularBehavior` 函数使用传递的 NgZone 实例创建 zone

```javascript
function forkInnerZoneWithAngularBehavior(zone) {
    zone._inner = zone._inner.fork({
        name: 'angular',
        properties: { 'isAngularZone': true },
        onInvokeTask: (delegate, current, target, task,applyThis, applyArgs) => {...},
        onInvoke: (delegate, current, target, callback,
            applyThis, applyArgs, source) => {...},
        onHasTask:
            (delegate, current, target, hasTaskState) => {...},
        onHandleError: (delegate, current, target, error) => {...}
    });
}
```

它从 NgZone 的构造函数中从 `zone._inner` 创建新的 zone。子 zone 被赋予了 `zone._inner`，这样，新创建的 zone 代替了原来的父 zone。

在创建过程中，ZoneSpec 参数对象传递给了 fork 方法，如我们前面所知，它用于设置 name，properties 和 zone 的钩子事件。使用这些事件钩子，我们可以通过 zone 捕获各种事件。

该 zone 的 name 属性被赋予了 angular，它表示我们位于 Angular 的 zone，我们所有的代码运行于其中。properties 对象中的 `isAngularZone` 设置为 `ture`。然后，事件钩子用于在任何事件被捕获的时候，执行变更检测周期。

所以，我们刚刚看到 NgZone 将设置两个 zone：inner 和 outer ，并赋予其实例。

然后，检查 NgZone 中的 `run*` 方法。

```javascript
run(fn, applyThis, applyArgs = []) {
        return (this)._inner.run(fn, applyThis, applyArgs);
    }
```

我们看到它使用前面设置的 inner zone 在 zone 中调用相关函数，除了 `runOutsideAngular` 方法使用 outer zone ，定义于其中的事件不会被调用，它实际上在其它 zone 执行。

```javascript
runOutsideAngular(fn) {
        return (this)._outer.run(fn);
    }
```

为了更好地理解 inner 和 outer zone，我们实现如下：

```javascript
let i = o = Zone.current
i = i.fork({
    name: 'inner_zone',
    onInvoke: () => console.log('inner onInvoke')
})
o.run(() => {})
i.run(() => {})
```

我们做了 NgZone 同样的事情，将当前的 zone 赋予 `i` 和 `o` ，然后从 `i` 创建新的 zone 并赋予子 zone `i` 。现在 `o` 是 `i` 的父 zone。测试一下。

```javascript
let i = o = Zone.current
i = i.fork({
    name: 'inner_zone',
    onInvoke: () => console.log('inner onInvoke')
})
console.log(i.parent === o) // true
```

`i` 中的钩子仅仅在 `i` zone 执行的时候被调用。zone `o` 中的事件钩子不会执行，因为在不同的上下文中。

如果我们仅执行 `o.run(() => {})`， inner 的 onInvoke 将不会被输出. 仅执行 `i.run(() => {})` 将输出 inner 的 onInvoke。

这样，我们看到了在 Angular zone 之外执行代码的实现含义。特别是，`runOutsideAngular` 方法用于在重量级的操作被执行的时候，我们希望避免不断触发变更检测。

### onMicrotaskEmpty

前面我们知道 NgZone 用于知道何时触发变更检测。`onMicrotaskEmpty` 事件用于执行变更检测。如事件名所暗示，在当前栈中没有 microtask 的时候执行其订阅。在其执行的时候，可能入队更多的 microtask，这使得它可能执行多次。

```javascript
this._zone.onMicrotaskEmpty.subscribe(
        {next: () => { this._zone.run(() => { this.tick(); }); }});
```

该事件从 `checkStable()` 函数触发

```javascript
function checkStable(zone) {
    if (zone._nesting == 0 && !zone.hasPendingMicrotasks && !zone.isStable) {
        try {
            zone._nesting++;
➥          zone.onMicrotaskEmpty.emit(null);
        } finally {
            ...
        }
    }
}
```

在上面的代码中，当没有等待的 microtaks ，也没有 microtask 和 macrotask 的时候，执行变更检测。

该函数从前面 Angular zone 创建中提供的事件钩子触发。

* onHasTask
* onInvoke
* onInvokeTask



## See also

* [How Angular uses NgZone/Zone.js for Dirty Checking](https://blog.bitsrc.io/how-angular-uses-ngzone-zone-js-for-dirty-checking-faa12f98cd49)
