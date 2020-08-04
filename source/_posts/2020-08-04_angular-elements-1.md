---
title: Angular Elements Part I: 使用 Web Components 4 步创建动态 Dashboard    
date: 2020-08-04
categories: angular
---
从 Angular 6 开始，你可以将 Angular Components 暴露为 Web Components ，或者更严谨的，作为术语 Web Components 保护伞下面的自定义元素。
它们可以被用于各种框架，甚至是 VanillaJS。进一步来说，我们可以在运行时很容易地创建它们，因为它们使用浏览器渲染。动态添加新的 Web Components 到页面上，就和创建 DOM 元素一样简单。
<!-- more -->


# Angular Elements Part I: 使用 Web Components 4 步创建动态 Dashboard

本文是 Angular Elements 系列的第 1 篇。

* Angular Elements Part I: 使用 Web Components 4 步创建动态 Dashboard
* Angular Elements Part II: 延迟与外部 Web Conponents
* Angular Elements Part III: Angular Elements 不使用 Zone.js
* Angular Elements Part IV: 在 Angular Elements (>=7) 上使用内容投影
* Angular Elements Part V: 使用 CLI 创建 Angular Elements 的选项

从 Angular 6 开始，你可以将 Angular Components 暴露为 Web Components ，或者更严谨的，作为术语 Web Components 保护伞下面的自定义元素。它们可以被用于各种框架，甚至是 VanillaJS。进一步来说，我们可以在运行时很容易地创建它们，因为它们使用浏览器渲染。动态添加新的 Web Components 到页面上，就和创建 DOM 元素一样简单。

现在，我将使用这个思想来创建动态 Dashboard.

![](https://i.imgur.com/7wp1Hs5.png)

[源码](https://github.com/manfredsteyer/angular-elements-dashboard)可以在我的 GitHub 仓库中获得。该示例也使用了 [Angular 培训](https://www.angulararchitects.io/schulung/angular-advanced)的企业架构。

### 第 1 步：安装 Angular Elements 和 Polyfills

对于 Angular Elements 通过 npm 安装一点都不奇怪。另外，我还需要安装 @webcomponents/custom-elements，它提供对 IE11 的支持。

```bash
npm i @angular/elements --save
npm i @webcomponents/custom-elements --save
```

然后，在文件 `polyfills.ts` 的最后，添加导入。

```typescript
import '@webcomponents/custom-elements/custom-elements.min';
```

另外需要添加引用的文件是 `angular.json`

```json
"scripts": [
  "node_modules/@webcomponents/custom-elements/src/native-shim.js"
]
```

对于浏览器来说这是需要的，因为 Web Components 定义在 EcmaScript 2015+，当我们的源码为 EcmaScript 5 的时候。

另外，你还可以通过 `ng add` 命令来安装 `@angular/elements` 

```bash
ng add @angular/elements
```

该命令还会下载一个 polyfill 并在 `angular.json` 中引用它。它比第一种方式更好，我在这里使用它，但不支持 IE11

### 第 2 步：创建 Angular Components

对于 Dashboard tile，我期望将它暴露为一个 Web Component，如下所示。

```typescript
@Component({
  // selector: 'app-dashboard-tile',
  templateUrl: './dashboard-tile.component.html',
  styleUrls: ['./dashboard-tile.component.css']
})
export class DashboardTileComponent  {
  @Input() a: number;
  @Input() b: number;
  @Input() c: number;
}
```

这里没有使用选择器，因为 Custom Element 是在注册的时候获得它的。使用这种方式，可以防止命名冲突。

### 第 3 步：将 Angular Componets 作为 Custom Element 注册

为了将 Angular Component 作为 Custom Element 暴露出来，我们需要定义它，并将它放入 module 的 `entryComponents` 中。这是必须要做的，因为 Angular Elements 是在运行时动态创建的。

```typescript
@NgModule({
  […],
  declarations: [
    […]
    DashboardTileComponent
  ],
  entryComponents: [
    DashboardTileComponent
  ]
})
export class DashboardModule { 
  constructor(private injector: Injector) {
    const tileCE = createCustomElement(DashboardTileComponent, { injector: this.injector });
    customElements.define('dashboard-tile', tileCE);
  }
}
```

`createCustomElement` 方法包装了 `DashboardTileComponent`，成为 Web Component，使用 `customElements.define()` 将它注册到浏览器上。

### 第 4 步：使用 Custom Element

现在，我们可以使用 Custom element 就如同内置的 HTML tag 一样

```html
<dashboard-tile a="100" b="50" c="25"></dashboard-tile>
```

在浏览器渲染的时候，Angular 对元素的名称没有感知，为了防止 Angular 抛出异常，可以使用 `CUSTOM_ELEMENTS_SCHEMA`

```typescript
@NgModule({
  […]
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class AppModule {
}
```

我们甚至可以用它动态创建 DOM 节点，这是动态 UI 的一个关键点。

```javascript
const tile = document.createElement('dashboard-tile');
tile.setAttribute('class', 'col-lg-4 col-md-3 col-sm-2');
tile.setAttribute('a', '100');
tile.setAttribute('b', '50');
tile.setAttribute('c', '25');

const content = document.getElementById('content');
content.appendChild(tile);
```

如果你期望确保你的应用也支持其它环境 - 例如服务器端渲染，或者混合应用，你应当使用 `Renderer2` 服务，它对 DOM 操作进行了抽象。




### See also

* https://www.angulararchitects.io/aktuelles/angular-elements-part-i/


