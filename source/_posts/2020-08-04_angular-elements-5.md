---
title: Angular Elements Part V：CLI 中构建 Angular Elements 的选项     
date: 2020-08-04
categories: angular
---
构建中问题的处理。
<!-- more -->

# Angular Elements Part V: CLI 中构建 Angular Elements 的选项



### 初始化

这里使用的示例是第一篇 介绍 Angular Elements 中 dashboard tile 组件的变体。

可以在这里找到它，其中包含了一个带有两个项目的工作空间。其中一个称为 `dashboard-tile` 暴露一个简单的 dashboard tile 来作为外部组件。

![](https://www.angulararchitects.io/wp-content/uploads/2017/09/build-02.png)

后面的代码非常简单：

```typescript
@Component({
  // selector: 'app-external-dashboard-tile',
  templateUrl: './external-dashboard-tile.component.html',
  styleUrls: ['./external-dashboard-tile.component.css']
})
export class ExternalDashboardTileComponent implements OnInit {

  @Input() src: number = 1;

  a: number;
  b: number;
  c: number;

  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.http.get('/assets/stats-${this.src}.json').subscribe(
      data => {
        this.a = data['a'];
        this.b = data['b'];
        this.c = data['c'];
      }
    );
  }

  more() {
    this.src++;
    if (this.src > 3) {
      this.src = 1;
    }
    this.load();
  }

}
```

为了将该 component 在 Angular 应用启动的时候，成为 Custom Elemets，对应的代码在 `AppModule` 的 `ngDoBootstrap()` 方法中。

```typescript
@NgModule({
   imports: [
      HttpClientModule,
      BrowserModule
   ],
   declarations: [
      ExternalDashboardTileComponent
   ],
   bootstrap: [],
   entryComponents: [
      ExternalDashboardTileComponent
   ]
})
export class AppModule { 
    constructor(private injector: Injector) {
    }

    ngDoBootstrap() {
        const externalTileCE = createCustomElement(ExternalDashboardTileComponent, { injector: this.injector });
        customElements.define('external-dashboard-tile', externalTileCE);
    }

}
```

这里的 `ngDoBootstrap` 是必须的，因为应用程序中没有 bootstrap 组件。这是因为我不希望启动一个普通的 Angular Component，只是希望注册 custom elements.

理论上，你应该可以直接在 `index.html` 中调用该 web componet，

```html
<external-dashboard-tile src="1"></external-dashboard-tile>
```

但是，实际上你会得到下面的异常。

> 构建 HTMLElement 失败，请使用 new 操作符，DOM 对象的构造器不能作为函数调用。

![](https://www.angulararchitects.io/wp-content/uploads/2017/09/build-01.png)

当使用 EcmaScript 5 作为编译目标，以支持老的类似 IE11 的浏览器的时候，就会遇到。这是因为 Custom Elements 被用于 EcmaScript 2015 和以上版本。

因此，我们需要对新的需要 EcmaScript 2015_ 的浏览器，和旧的如 IE11 的浏览器进行  polyfill 

> 差异加载在 Angular CLI 8 中引入，支持同时创建 EcmaScript 5 和 EmcaScript 2015 包。本文的后面，我会详细说明。

### Polyfills

为了支持老的浏览器，我决定使用 `@webcomponents/webcomponets.js` 包，为了加载它们，我在 `angular.json` 文件中作为脚本注册：

```json
[...],
"scripts": [
  {
    "bundleName": "polyfill-webcomp-es5",
    "input": "node_modules/@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js"
  },
  {
    "bundleName": "polyfill-webcomp",
    "input": "node_modules/@webcomponents/webcomponentsjs/bundles/webcomponents-sd-ce-pf.js"
  }
],
[...]
```

如果你只需要编译到 `es2015+`，可以忽略第一段脚本

在构建的时候，这导致两个包：`polyfill-webcomp-es5.js` 和 `polyfill-webcom`

### 自动添加 Polyfills

为了自动化笨重的添加 polyfill 任务。我编写了一个 schematic，这是社区项目 `ngx-build-plus` 的一部分，为了安装它，使用 `ng add`

```bash
ng add ngx-build-plus --project dashboard-tile 
```

然后，你可以

```bash
ng g ngx-build-plus:wc-polyfill --project dashboard-tile my
```

请注意，如果你需要在你的 Angular 项目中的组件里使用 Custom Elements，你需要在你的项目中引用 `CUSTOM_ELEMENTS_SCHEMA` ，

```typescript
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

在项目启动之后，`npm start`，在浏览器中，你应该可以看到如下内容：

![](https://www.angulararchitects.io/wp-content/uploads/2017/09/build-02.png)

### 差分加载





### 构建

现在，我们对 Web Component 项目使用 `ng build` 创建包。

```bash
ng build --prod
```

这会生成多个包

![](https://www.angulararchitects.io/wp-content/uploads/2019/11/build-09.png)

对于常规的 SPA 应用是没有问题的。但对于简单的 Web compoent 太多了，在我们的场景下，生成单个的自包含的包更好。

前面提到的项目 `ngx-build-plus` 提供了一个简单的方法，使用参数 `--single-bundle` 开关。

```bash
ng build --prod --single-bundle
```

在使用这种方式运行之后，我们得到单个的称为 `main` 的包，而不再是 `main`、`vendor` 和 `runtime` 三个包。

![](https://www.angulararchitects.io/wp-content/uploads/2019/11/build-08.png)

最新版本的 `ngx-build-plus` 仍然生成 `polyfills`，`styles` 和 `scripts` 。这可以便于测试。但是，你通常不会使用这些文件，因为消费的应用程序非常可能已经有了自己版本的脚本。

> 对于 `--single-bundle` 的另一种方式，有时候你会看到复制 4 个包到一个文件。不幸的是，如果你有多于一个的元包的话是不行的。原因是 webpack 会暴露一个全局变量，当被分别编译的时候，使用多个话它会被覆盖掉，

当你查看包的尺寸的时候，你会立即注意到它远大于单个简单的 Web Component。这是因为它包含了 Angular、RxJS 和其它的库，至少此时它还没有被摇树。更糟糕的是，如果你分别编译多个包，每个都会有这些库的复制品。

![](https://www.angulararchitects.io/wp-content/uploads/2017/09/build-duplication.png)

这就是为什么需要 ivy 的原因。

### Ivy

从 Angular 9 开始，我们将得到新的默认的 Ivy 编译器。它支持深度摇树，并将 UI 部分的组件编译为更接近 DOM 的代码。由于这个原因，典型的 Web Component 将得益于 ivy，最终的包也将不再特别需要 Angular。

在最好的情况下，两个分别生成的使用 Angular Elements 的包如下所示：

![](https://www.angulararchitects.io/wp-content/uploads/2017/09/build-04a.png)

它们仅仅包含自己的 Web Components 代码，以及非常微少的 Angular 运行时，注意，在最好的情况下。

但是，Ivy 有许多潜在，我们不应该期待像 Minko Gechev 的奇迹，它作为 Angular 团队的一员，在 Twitter 上告诉我们：

> Ivy 将在 Angular 中启用新的特性。它将逐步到来，它可能减少你的应用的尺寸，但是不要期望奇迹。它不能将你的 JS 消失掉。我强烈建议不要等待 Ivy，相反，

特别是，如果我们的组件在 UI 代码之后包含需许多库，Ivy 将不能帮助太多。或者这么说，它不能将包里使用的部分，比如 @angular/forms 或者 @angular/common/http 消失掉。

因此，我们非常需要找到一种方式来共享这些独立构建的包的依赖部分。这导致下一节我们介绍的内容

### 共享库

为了共享类似 @angular/common/http 这样的库，它被用于我们前面介绍的 Angular Elements。我们应该将它加载到站点的全局范围，然后在我们的 Web Components 之间共享。

![](https://www.angulararchitects.io/wp-content/uploads/2017/09/build-05.png)

这是多年前常用的方式。想想使用 jQuery 的时候，我们需要加载 jQuery 和 jQuery UI 一次，然后，我们的 jQuery 控件库引用它们。

但是，Angular 项目通常构建到多个包中，它们之间互相清楚，但是并不容易访问其中的代码。

为解决这个问题，Angular 的 Rob Wormald 带来了一个有趣的想法：调整构建过程，以便生成的包使用共享的库而不是其自身的一部分，加载到全局范围。为了使得这成为可能，我们需要找到一个方式来处理 Angular 和他的依赖。

幸运的是，Angular 包的格式规定将 Angular 库作为 UMD 包，对于 Angular 本身，它们注册为 `window.ng.core`，`window.ng.common` 等等。

这引入多个手动步骤，我将它们自动化为另一个 schematic

```bash
ng g ngx-build-plus:externals --project dashboard-tile
```

为了编译任何东西，使用由 `ngx-build-plus` 生成的 npm 脚本

```bash
npm run build:dashboard-tile:externals
```

然后，你可以切换到 `dist` 文件夹，尝试你的方案

```bash
npm i -g live-server
cd dist
cd dashboard-tile
live-server
```

### 内幕

现在，我们讨论到底发生了什么。我们执行的 Schematic ，创建了一个部分的 webpack 配置，它定义了共享库可以在浏览器对象 `window`的那个部分找到。

```typescript
const webpack = require('webpack');

module.exports = {
    "externals": {
        "rxjs": "rxjs",
        "@angular/core": "ng.core",
        "@angular/common": "ng.common",
        "@angular/common/http": "ng.common.http",
        "@angular/platform-browser": "ng.platformBrowser",
        "@angular/platform-browser-dynamic": "ng.platformBrowserDynamic",
        "@angular/compiler": "ng.compiler",
        "@angular/elements": "ng.elements",

        // Uncomment and add to scripts in angular.json if needed
        // "@angular/router": "ng.router",
        // "@angular/forms": "ng.forms"
    }
}
```

编译的时候，CLI **不会** 在你的包中包含这些依赖内容。相反，仅仅使用引用，例如到 `window.ng.core` 或者 `winodw.ng.common`。

为了将 Angular 和 RxJS 加载到 window 对象，在 `angular.json` 中，该 Schematic 还在 `scripts` 中引用各自的 UMD 包。

```json
"scripts": [
  [...]
  "node_modules/rxjs/bundles/rxjs.umd.js",
  "node_modules/@angular/core/bundles/core.umd.js",
  "node_modules/@angular/common/bundles/common.umd.js",
  "node_modules/@angular/common/bundles/common-http.umd.js",
  "node_modules/@angular/compiler/bundles/compiler.umd.js",
  "node_modules/@angular/elements/bundles/elements.umd.js",
  "node_modules/@angular/platform-browser/bundles/platform-browser.umd.js",
  "node_modules/@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js"
]
```

### 结论

有多种策略可以构建 Web Componets ，与通常的 Angular SPA 不同，如果你的项目主要包含 UI 代码，Ivy 将会在缩减包的尺寸作出许多工作，另外，它还改进了摇树。

对于共享外部的库，社区项目 `ngx-build-plus` 提供帮助，还可以创建单个的包，它还帮助对于遗留的浏览器安装 polyfill

另外，差异加载确保只有浏览器需要的 polyfill ，它使得现代浏览器得到更小和更加优化的 EcmaScript 2015+ 包。



### Reference

* https://www.angulararchitects.io/aktuelles/your-options-for-building-angular-elements/
* https://morioh.com/p/7c76e4d4829f
* https://www.toptal.com/front-end/micro-frontends-strengths-benefits
* 
