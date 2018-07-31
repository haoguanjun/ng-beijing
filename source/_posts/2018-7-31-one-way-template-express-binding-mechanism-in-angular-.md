---
title: Angular 中单向绑定表达式绑定机制      
date: 2018-07-31
categories: angular
---
Angular 中的关键特性是 DOM 更新、模板和属性绑定。然而，后两个是 DOM 更新的子集。父子通讯是任何 js 框架的基础原则，Angular 比其他任何框架都漂亮地处理了这个问题。
<!-- more -->

### Data Binding
Data Binding 是保持组件的变量与 UI 同步的机制。   
在 Angular 中，有两种类型的数据绑定：

* 单向数据绑定
* 双向数据绑定

#### 单向数据绑定
单向数据绑定更新 HTML 模板中的模板。更新流是非双向的。   
```typescript
import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  template: `
  <div>
    <p>
➥      { { title } } works!!
➥      <app-todo [item]='title'></app-todo>
    </p>
  </div>
  `,
  style: []
})
export class AppComponent {
  title = 'app';
  changeTitle() {
      this.title = 'Angular app'
  }
}
``````
类中的变量 title 绑定到模板中。Angular 在应用运行时，使用文本 app 替换绑定。如果 title 的由函数 changeTilte() 修改，DOM 就会更新以反映新的值。不管什么时候，只要数据绑定的类变量发生了变化，模板都会更新以包含新值。这里的数据绑定处理是单向的。   
同时，单向数据绑定可以使用 { }, 或者 [ ] 或者 * 来完成。

#### 双向数据绑定

双向数据绑定中，类变量和模板双方保持同步。它使用 [()] 来完成。   
模板可以被改变值，通常是在 input 元素中，而数据绑定类的属性可以被来自模板的值更新。模板和类绑定彼此，任何一方的修改都会更新到双方。   
例如：   
```typescript
import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  template: `
  <div>
    <p>
➥      <input [(ngModel)]="msg" />
        <b> { { msg } } </b>
    </p>
  </div>
  `,
  style: []
})
export class AppComponent {
  msg = 'My Message'
  changeMsg() {
    this.msg = 'Message Changed'
  }
}
``````
双向绑定多用于表单中的 input 元素。用户的输入被 DOM 捕获，并保存到前面所使用的类属性中。   
在上面的例子中，我们将 input 元素绑定到 msg 属性，该属性可以被读或者写。初始时，msg 属性的值是 My Message，当我们输入时，比如说输入了 Not My Message 到输入框中，msg 属性的值将会被更新为 Not My Message，模板也同样被更新为同样的 Not My Message。   
模板的 HTML 和组件类都可以改变数据绑定变量的值。
* 在输入框中的值发生变化时，更新从模板到类中
* 在绑定属性发生变化的时候，更新从类到模板中，然后，模板的 HTML 也发生了变化。
在 Angular 中，数据绑定是非常强大和有用的特性，本文我们将展示单向数据绑定 { { } } 是如何工作的。

### 示例

我将演练一个示例，首先创建一个最小 Angular 项目：   
   ng new test-app --minimal
编辑 src/app/app.component.ts 到如下所示：
```typescript
import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  template: `
  <div>
    <p>
      { {title} } works!!
    </p>
  </div>
  `,
  style: []
})
export class AppComponent {
  title = 'app';
  changeTitle() {
      this.title = 'Angular app'
  }
}
``````
这和前面的示例是一样的。title 属性绑定到模板 HTML 中。   
模板的标记描述了 DOM 的结构，Angular 并不会这样执行我们的组件。

Components/Modules/Directives/Pipes 在浏览器执行之前，首先编译为 JavaScript。 
对于每个我们的 Component，Angular 编译器生成一个 Factory，Factory 用于实例化 View，其用于创建组件视图。
我们的 AppComponent 生成类似如下的 Factory:
```javascript
function View_AppComponent_0(_l) {
    return i0.ɵvid(0, [
        (_l()(), i0.ɵted(-1, null, ["\n    "])), 
        (_l()(), i0.ɵeld(1, 0, null, null, 4, "div", [], null, null, null, null, null)), 
        (_l()(), i0.ɵted(-1, null, ["\n      "])), 
        (_l()(), i0.ɵeld(3, 0, null, null, 1, "p", [], null, null, null, null, null)), 
        (_l()(), i0.ɵted(4, null, ["\n        ", " works!!\n      "])), 
        (_l()(), i0.ɵted(-1, null, ["\n    "])), 
        (_l()(), i0.ɵted(-1, null, ["    \n  "]))
        ], null, function(_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.title;
        _ck(_v, 4, 0, currVal_0);
    });
}
``````
这些代码将用于生成 AppComponent 的 HTML。注意看，它描述了模板中的 HTML 结构，将被用于构建组件的视图。   
在核心函数中，Angular 令人迷惑。注意到 e 表示方法，这些方法是 Angular 的 API，这些方法是其全名的简写。
evid 表示 viewDef 函数，viewDef 函数生成组件的视图定义。视图定义包含一个 NodeDef 的数组，用于创建和追加元素或者文本到 DOM 中。
```typescript
export interface ViewDefinition {
  ...
  nodes: NodeDef[],
  ...
}
``````
而函数 eted 和 eeld 表示 textDef 和 elementDef 函数，textDef 用来创建文本节点，而 elementDef 用来创建元素节点，下面让我们深入这些函数。

#### eted => textDef

如前所述，它用来生成 text 定义，其用于创建 DOM 中的文本节点。在浏览器中，文本节点用于追加文本到元素中。
```javascript
const text = document.createTextNode('Yes')
document.getElementById('myText').appendChild(text)
``````
该函数有一系列参数：
```typescript
export function textDef(
    checkIndex: number, ngContentIndex: number | null, staticText: string[]): NodeDef {...}
``````
*checkIndex*: 文本在当前数组中的索引位置。通常设置为 -1， 对于数据绑定的文本，实际的索引将会设置为在数组中的当前位置，所以变更检测器将会知道在何处添加最终的文本 。   
*staticText*: 在数组中保存文本。   
所以，对于在模板中定义的任何文本节点，都有一个 textDef 函数对应。它将返回一个 flags 属性设置为 TypeText 的 NodeDef 对象。
```javascript
{
    ...
    checkIndex,
    flags: NodeFlags.TypeText,
    ngContentIndex,
    bindings,
    bindingFlags: BindingFlags.TypeProperty,
    text: {prefix: staticText[0]}
}
``````
在 Angular 开始通过 createViewNodes 创建视图节点的时候，这很有用，因为它告诉了每个 NodeDef 的类型
```javascript
function createViewNodes(view: ViewData) {
...
  for (let i = 0; i < def.nodes.length; i++) {
...
    switch (nodeDef.flags & NodeFlags.Types) {
      case NodeFlags.TypeElement:
        ...
        break;
      case NodeFlags.TypeText:
        nodeData = createText(view, renderHost, nodeDef) as any;
        break;
      case NodeFlags.TypeClassProvider:
      case NodeFlags.TypeFactoryProvider:
      case NodeFlags.TypeUseExistingProvider:
      case NodeFlags.TypeValueProvider: {
        ...
        break;
      }
      case NodeFlags.TypePipe: {
      ...
      case NodeFlags.TypeDirective: {
      ...
      }
      case NodeFlags.TypePureArray:
      case NodeFlags.TypePureObject:
      case NodeFlags.TypePurePipe:
        ...
        break;
      case NodeFlags.TypeContentQuery:
      case NodeFlags.TypeViewQuery:
        ...
        break;
      case NodeFlags.TypeNgContent:
        ...
        break;
    }
    ...
  }
``````

#### eeld => elementDef

它生成模板中任何 HTML 元素的一个元素定义。

   `<div><div>`
   
将被编译为
```javascript
(_l()(), i0.ɵeld(1, 0, null, null, 4, "div", [], null, null, null, null, null)),
``````
该语句创建一个 NodeDef 对象，其 flags 属性设置为 TypeElement，NodeDef 是用来告诉 Angular 如何创建特定节点的对象。   
由于 flags 设置为 TypeElement，Angular 知道如何使用 createElement 创建一个 HTML 元素，并添加到 DOM 中。

```typescript
export function createViewNodes(...) {
...
    switch (nodeDef.flags & NodeFlags.Types) {
      case NodeFlags.TypeElement:
        const el = createElement(view, renderHost, nodeDef) as any;
...
``````

elementDef 也有一系列参数来创建 NodeDef:
```javascript
export function elementDef(
    checkIndex: number, flags: NodeFlags,
    matchedQueriesDsl: null | [string | number, QueryValueType][], ngContentIndex: null | number,
    childCount: number, namespaceAndName: string | null, fixedAttrs: null | [string, string][] = [],
    bindings?: null | [BindingFlags, string, string | SecurityContext | null][],
    outputs?: null | ([string, string])[], handleEvent?: null | ElementHandleEventFn,
    componentView?: null | ViewDefinitionFactory,
    componentRendererType?: RendererType2 | null): NodeDef {
...}
``````
*checkIndex*: 元素在 NodeDef 数组中的位置   
*flags*: 节点类型   
*childCount*: 子节点数量   
*namespaceAndName*: 元素名称   
**fixedAttrs**: 定义在元素上的 attribute 
**outputs**: 定义在元素上的事件   
**handleEvent**: 事件监听器   
**componentView**: 在元素是一个组件时使用   

#### evid => viewDef
Angular 对于模板中的每个节点生成等价的 JavaScript 代码，比如我们的绑定：

   { {title} } works!!
   
将被编译为：
 
   (_l()(), i0.ɵted(4, null, ["\n        ", " works!!\n      "]))
   
每当一个文本成为绑定值，它将生成一个代码 eted ，与没有文本绑定时相反。
首先，checkIndex 拥有节点的正确索引，没有绑定时为 -1. 这样文本就是前一个元素的子节点。   
其次，ngContentIndex 被设置为 -1。   
最后一个参数 staticText 设置为解析得到的字符串数组 staticText: string[], 如果文本节点没有绑定，比如：

   ...
   template:`App works !!`
   ...

将被解析为一个完整的数组：

   i0.ɵted(4, null, ["\n App works !!\n      "])
   
如果文本节点是绑定的，文本将被打破到每个绑定中：
```html
<h1>Hello { {name} } and another { {prop} }</h1>
["Hello "," and another "]
<p>Hi { {name} }, you are welcome</p>
["Hi ",", you are welcome"]
``````
将被 textDef 用于生成绑定：
```javascript
const bindings: BindingDef[] = new Array(staticText.length - 1);
  for (let i = 1; i < staticText.length; i++) {
    bindings[i - 1] = {
      flags: BindingFlags.TypeProperty,
      name: null,
      ns: null,
      nonMinifiedName: null,
      securityContext: null,
      suffix: staticText[i],
    };
  }
``````
使用绑定数组，Angular 将使用插入来追加绑定 suffix 到最终值。
```javascript
function _addInterpolationPart(value: any, binding: BindingDef): string {
  const valueStr = value != null ? value.toString() : '';
  return valueStr + binding.suffix;
}
``````

### DOM 更新

在上面我们看到了一系列的 Angular 表示对象，现在，我们展示在 DOM 初始化时和变更检测调用时如何更新 DOM。   
在前面，我们的绑定：
   
   { {title} } works!!

被如下执行：

   textDef(4, null, [" \n "," works!!"])

在应用初始加载时，数组的第一个索引 0 被追加到 DOM 中。   
首先，textDef 函数生成一个 NodeDef 对象，传递 staticText 数组的第一个索引到 text.prefix，数组中剩下的部分保存到 bindings 属性中。
```javascript
{
  ...
  flags: NodeFlags.TypeElement,
  bindings: [
    {
      ...
      suffix: " works!!"
    }
  ],
  checkIndex: 4,
  text: {
    prefix: " \n "
  }
}
``````
下面是 textDef 函数在其 NodeDef 数组中生成和传递给 viewDef 的内容。
```javascript
viewDef(null, [
  ...
  {
    ...
    flags: NodeFlags.TypeElement,
    bindings: [
      {
        ...
        suffix: " works!!"
      }
    ],
    checkIndex: 4,
    text: {
      prefix: " \n "
    }
  }  
], ...)
``````
所以，在 Angular 初始调用 entryComponent 的 create 方法。
```typescript
bootstrap<C>(componentOrFactory: ComponentFactory<C>|Type<C>, rootSelectorOrNode?: string|any):
      ComponentRef<C> {
...
    const compRef = componentFactory.create(Injector.NULL, [], selectorOrNode, ngModule);
...
}
``````
一系列函数被调用，最终在 createViewNodes 函数。这里 NodeDef 数组是一个 for 循环，基于节点的 NodeFlags 处理每个节点。
文本节点从 NodeDef 的 text.prefix 属性创建：
```javascript
export function createText(view: ViewData, renderHost: any, def: NodeDef): TextData {
  let renderNode: any;
  const renderer = view.renderer;
  renderNode = renderer.createText(def.text !.prefix);
  const parentEl = getParentRenderElement(view, renderHost, def);
  if (parentEl) {
    renderer.appendChild(parentEl, renderNode);
  }
  return {renderText: renderNode};
}
``````
在 create 方法执行之后，在 ApplicationRef 中的tick 方法被调用：
```javascript
private _loadComponent(componentRef: ComponentRef<any>): void {
    this.attachView(componentRef.hostView);
    this.tick();
    this.components.push(componentRef);
    // Get the listeners lazily to prevent DI cycles.
    const listeners =
        this._injector.get(APP_BOOTSTRAP_LISTENER, []).concat(this._bootstrapListeners);
    listeners.forEach((listener) => listener(componentRef));
  }
``````
以执行变更检测周期
```javascript
tick(): void {
   if (this._runningTick) {
     throw new Error('ApplicationRef.tick is called recursively');
   }
   const scope = ApplicationRef._tickScope();
   try {
     this._runningTick = true;
     this._views.forEach((view) => view.detectChanges());
     if (this._enforceNoNewChanges) {
       this._views.forEach((view) => view.checkNoChanges());
     }
   } catch (e) {
     // Attention: Don't rethrow as it could cancel subscriptions to Observables!
     this._zone.runOutsideAngular(() => this._exceptionHandler.handleError(e));
   } finally {
     this._runningTick = false;
     wtfLeave(scope);
   }
 }
``````
我们的视图被推入一个数组，Angular 遍历它们以执行变更检测。你可以看到,detectChange 方法被调用了。这开发了变更检测周期。
```javascript
detectChanges(): void {
      ...
      Services.checkAndUpdateView(this._view);
      ...
}
``````
checkAndUpdateView 调用一系列函数来更新视图指令
```javascript
export function checkAndUpdateView(view: ViewData) {
...
  Services.updateRenderer(view, CheckType.CheckAndUpdate);
  execComponentViewsAction(view, ViewAction.CheckAndUpdate);
...
}
``````
在这里，updateRenderer 函数在 Services 对象中被调用：
```javascript
updateRenderer: (view: ViewData, checkType: CheckType) => view.def.updateRenderer(
                        checkType === CheckType.CheckAndUpdate ? prodCheckAndUpdateNode :
                                                                 prodCheckNoChangesNode,
                        view),
``````
视图中的updateRenderer  被调用，我们先看一下 viewDef 中的 updateRenderer 参数：
```javascript
function View_AppComponent_0(_l) {
    return i0.ɵvid(0, ..., null, 
    // updateRenderer
    function(_ck, _v) {
        var _co = _v.component;
        var currVal_0 = _co.title;
        // Now, the value of currVal_0 will be `app`
        _ck(_v, 4, 0, currVal_0);
    });
}
``````
我们可以看到 updateRenderer 有两个参数：__ck 和 __V. 它们引用 prod/debug 的 CheckAndUpdateNode 和 ViewData 对象。updateRenderer 主函数从组件类实例的数据绑定属性获取值：
```javascript
var _co = _v.component;
var currVal_0 = _co.title;
``````

对函数 * CheckAndUpdateNode 调用最终到达 checkAndUpdateNode * 基于 NodeFlags 类型执行特定类型处理
```javascript
function checkAndUpdateNode*(view: ViewData, nodeDef: NodeDef, values: any[]): boolean {
  switch (nodeDef.flags & NodeFlags.Types) {
    case NodeFlags.TypeElement:
      return checkAndUpdateElement*(view, nodeDef, values);
    case NodeFlags.TypeText:
      return checkAndUpdateText*(view, nodeDef, values);
    case NodeFlags.TypeDirective:
      return checkAndUpdateDirective*(view, nodeDef, values);
    case NodeFlags.TypePureArray:
    case NodeFlags.TypePureObject:
    case NodeFlags.TypePurePipe:
      return checkAndUpdatePureExpression*(view, nodeDef, values);
    default:
      throw 'unreachable';
  }
}
``````

在我们示例中，checkAndUpdateText * 将被调用，因为我们是一个文本节点，有 Nodeflags.TypeText 标志。
```javascript
export function checkAndUpdateText*(
    view: ViewData, def: NodeDef, v0: any, v1: any, v2: any, v3: any, v4: any, v5: any, v6: any,
    v7: any, v8: any, v9: any): boolean {
  let changed = false;
  const bindings = def.bindings;
  const bindLen = bindings.length;
  if (bindLen > 0 && checkAndUpdateBinding(view, def, 0, v0)) changed = true;
  if (bindLen > 1 && checkAndUpdateBinding(view, def, 1, v1)) ...
  if (bindLen > 9 && checkAndUpdateBinding(view, def, 9, v9)) changed = true;
  if (changed) {
    let value = def.text !.prefix;
    if (bindLen > 0) value += _addInterpolationPart(v0, bindings[0]);
    if (bindLen > 1) value += _addInterpolationPart(v1, bindings[1]);
    ...
    if (bindLen > 9) value += _addInterpolationPart(v9, bindings[9]);
    const renderNode = asTextData(view, def.nodeIndex).renderText;
    view.renderer.setValue(renderNode, value);
  }
  return changed;
}
``````
checkAndUpdateText * 获取 NodeDef 的绑定。记住，在NodeDef 通过 textDef 创建时，staticText 数组保存在 BindingDef 数组中。只是，第一个诉因被渲染在 DOM 上。这里，bindings, 从 updateRenderer 传递的当前值，以及初始渲染文本，通过插入组合到一个字符串中。组合的结果通过 renderer 示例渲染到 DOM 上。

Ok, 现在，我们知道了 angular 如何表示我们的模板表达式，注意，这是单向数据绑定，也就是说，无论何时，当数据绑定属性变化时，模板将被更新。一系列事情可以导致属性变化：
* Events
* setTimeouts, XHR 等等

它们被 NgZone 所封装，有一个 Angular 封装了 Zone.js。NgZone 添加了一个扩展，由 zone.js 发射的事件可以被订阅，变更检测循环被执行。

在 AppComponent 中，我们有一个方法 changeTitle ，其执行时可以导致 title 属性变更，在属性变更时， { {title} } 将被更新，如何做到呢？

比如说，当按钮点击时，属性被更新，我们更新模板，添加一个按钮，带有 (click) 监听器。
```typescript
import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  template: `
  <div>
    <p>
      { {title} } works!!
    </p>
➥  <button (click)="changeTitle()">ChangeTitle</button>
  </div>
  `,
  style: []
})
export class AppComponent {
  title = 'app';
  changeTitle() {
      this.title = 'Angular app'
  }
}
``````

就这样，如果运行 ng serve 并打开 localhost:4200。点击按钮，将会看到视图从 app works!! 变成了 Angular app works!!

编译之后，按钮元素在 component factory 类似如下形式：
```javascript
function View_AppComponent_0(_l) {
    return i0.ɵvid(0, [
        ...
        (_l()(), i0.ɵeld(3, 0, null, null, 1, "button", [], null, 
            // outputs
            [
                [null, "click"]
            ],
            // handleEvent
            function(_v, en, $event) {
                var ad = true;
                var _co = _v.component;
                if (("click" === en)) {
                    var pd_0 = (_co.changeTitle() !== false);
                    ad = (pd_0 && ad);
                }
                return ad;
            }, null, null)),
            ...
}
``````
outputs 参数标识元素注册的事件。handleEvent 函数调用 changeTitle 方法。
在创建元素节点过程中，DomRenderer 在元素上创建一个 click 监听器，并将其赋予 zone.js 函数。
```javascript
// global shared zoneAwareCallback to handle all event callback with capture = false
var globalZoneAwareCallback = function(event) {...}
``````
在点击按钮元素后，它将被调用。所有的事件都被打了补丁并被 NgZone/Zone.js 所跟踪。该函数抓取事件，并调用一系列函数，最终调用我们的 handleEvent 函数。changetitle 方法将改变 title 属性的值为 Angular app

由于属性发生了变化，模板视图 (这里是 DOM) 被使用新值更新。
记住，前面在启动应用中，Angular 调用了 ApplicationRef 的 tick 方法来触发变更检测。

这里，现在 Angular 需要触发变更检测来使用新值更新 DOM。

在 ApplicationRef 类构造中，它订阅了 onMicrotaskEmpty 事件。
```javascript
this._zone.onMicrotaskEmpty.subscribe(
        {next: () => { this._zone.run(() => { this.tick(); }); }});
``````

你看这里，观察者调用 _ zone 的 run 方法，它在其上下文中调用 tick() 方法。

现在，我们看到 Zone/NgZone 被用于脏检测。在执行 handleEvent 之后，onLeave 函数被调用，它应采用 checkStable 函数
```javascript
function checkStable(zone) {
    if (zone._nesting == 0 && !zone.hasPendingMicrotasks && !zone.isStable) {
        try {
            zone._nesting++;
➥          zone.onMicrotaskEmpty.emit(null);
        } finally {
            zone._nesting--;
            if (!zone.hasPendingMicrotasks) {
                try {
                    zone.runOutsideAngular(function() { return zone.onStable.emit(null); });
                } finally {
                    zone.isStable = true;
                }
            }
        }
    }
}
``````
这里，我们前面注册的观察者被调用了，并且，tick() 方法运行，触发变更检测。
如果你记得，tick() 方法遍历 ViewRef 数组并调用 detectChanges 方法，且 checkAndUpdateView 函数被调用，又执行一次 DOM 更新周期。
好了，我们看到 NgZone/Zone.js 修补了 DOM 事件，Nodejs API 和异步操作，这使得 Angular 可以捕获并执行变更检测。

