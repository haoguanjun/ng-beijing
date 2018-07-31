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
➥      {{title}} works!!
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
同时，单向数据绑定可以使用 {}, 或者 [] 或者 * 来完成。

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
        <b>{{msg}}</b>
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
在 Angular 中，数据绑定是非常强大和有用的特性，本文我们将展示单向数据绑定 {{}} 是如何工作的。

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
      {{title}} works!!
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















