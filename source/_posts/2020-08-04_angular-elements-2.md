---
title: Angular Elements Part II: 延迟与外部 Web Components     
date: 2020-08-04
categories: angular
---
本文中，我将继续，我将根据需要加载 Web Componets，所以，我演示两种方式：延迟和加载外部的组件。
<!-- more -->

# Angular Elements Part II: 延迟与外部 Web Components

本文是 Angular Elements 系列的第 2 篇。

* Angular Elements Part I: 使用 Web Components 4 步创建动态 Dashboard
* Angular Elements Part II: 延迟与外部 Web Conponents
* Angular Elements Part III: Angular Elements 不使用 Zone.js
* Angular Elements Part IV: 在 Angular Elements (>=7) 上使用内容投影
* Angular Elements Part V: 使用 CLI 创建 Angular Elements 的选项



在本系列的第一篇中，我已经展示了借助于 Angular Elements ，如何动态添加组件到页面中，示例中动态添加 tile 到 dashboard 中。

本文中，我将继续，我将根据需要加载 Web Componets，所以，我演示两种方式：延迟和加载外部的组件。

[整个方案](https://github.com/manfredsteyer/angular-elements-dashboard)可以在我的 GitHub 仓库中找到。

### 延迟加载 vs 加载外部组件

可能你奇怪在两种方式：延迟加载与加载外部组件之间有什么区别？

延迟加载是在编译时处理，与寄宿的应用程序在一起。这使得类似摇树的优化器可以优化，但也限制了你的能力，因为应用程序需要知道所有可能的 Web Components。进一步来说，你必须借助于 Angular 和 CLI 的特性来进行代码分隔和延迟加载。

从另一个角度来说，你还可以将你的 Web Componets 和所有的依赖的库，例如 `@angular/core` 或者 `@angular/elements` 放入一个自包含的包中。然后，可以在你的应用程序中加载该包。这使得包的尺寸变大了，但是提供了更大的灵活性。由于宿主可以动态加载组件而不是在构建时。新的 Ivy 编译器将助于把这些包缩减到最小。另外，我的简单的 CLI 扩展 [ngx-build-plus](https://www.npmjs.com/package/ngx-build-plus) 也可以在不同的包之间共享组件。我将在本系列的最后介绍它。

当然了，我在这里所说的 `加载外部组件` 也是延迟加载。但它不是Angular 所提供的延迟加载，所以使用了这次词。

### 实现延迟加载 (没有路由)

延迟加载已经被使用了，既可以使用底层的 API，也可以使用基于路由的良好抽象，这使得它更容易使用。但是，在我们的示例中，通过路由的方式不能得到好处，因为我们是在需要的时候将 tile 添加到 dashboard 中。

这就是为什么我要借助于 Angular 6 之后 CLI 提供的新特性。使用它，你可以指出在打包中需要拆分出来的 module。然后，你可以使用这里介绍的底层 API 按需加载这些 module。

开始的时候，在 `angular.json` 中引用包含你的 web components 的 module

```json
"lazyModules": [
  "src/app/lazy-dashboard-tile/lazy-dashboard-tile.module"
],
```

下面的列表展示了你如何可以借助 `NgModuleFactoryLoader` 来加载包。

```typescript
@Injectable({
    providedIn: 'root'
})
export class LazyDashboardTileService  {
    constructor(
        private loader: NgModuleFactoryLoader,
        private injector: Injector
    ) {
    }

    private moduleRef: NgModuleRef<any>;

    load(): Promise<void> {

        if (this.moduleRef) {
            return Promise.resolve();
        }

        const path = 'src/app/lazy-dashboard-tile/lazy-dashboard-tile.module#LazyDashboardTileModule'

        return this
            .loader
            .load(path)
            .then(moduleFactory => {
                this.moduleRef = moduleFactory.create(this.injector).instance;
                console.debug('moduleRef', this.moduleRef);
            })
            .catch(err => {
                console.error('error loading module', err); 
            });
    }
}
```

为了简单起见，我没有关注任何可能的竞速条件。使用路由方式，你必须提供两者，模块的文件名。在加载之后，你必须使用 `create` 来实例化它。

然后，你还需要搜索该实例来找到 component，services 等等，但是，这并不容易。好消息是使用 web components 你不需要做这些，它们会直接注册到浏览器上，所有你需要做的就是使用正确的名字来创建 html 元素，例如，下面的列表创建了 `lazy-dashboard-tile` 元素。

```javascript
const tile = document.createElement('lazy-dashboard-tile');
tile.setAttribute('class', 'col-lg-4 col-md-3 col-sm-2');
tile.setAttribute('a', '100');
tile.setAttribute('b', '50');
tile.setAttribute('c', '25');

const content = document.getElementById('content');
content.appendChild(tile);
```

另外，你必须确保在模块加载之后，Web component 已经注册了。因此，你需要在这些需要的代码加入到模块的构造函数中。

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

别忘了将 component 加入到你的 module 中，`declarations` 和 `entryComponents` 数组中。

### 加载外部组件

为了提供外部 Web Component，你需要创建一个新的 Angular 应用，并确保在它启动的时候，Angular Element 被注册，为了这点，我使用 `AppModule` 和 `ngDoBootstrap()` 方法。

```typescript
@NgModule({
   […],
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

请注意该应用没有定义 `bootstrap` 组件。原因是，我不希望在启动的时候加载 Angular Component，而是仅仅注册 Web Component。测试该组件，在 `index.html` 页面中，直接调用该 Web Component。使用 `ng serve` 来启动项目。

```html
<external-dashboard-tile a="50" b="60" c="70">
</external-dashboard-tile>
```

为了发布 Web Component，我们需要一个自包含的包，使它可以被加载到宿主应用程序中。但是，当前版本的 CLI 总是创建多个包，为解决这个问题，我们可以使用 `ngx-build-plus` ，这是 CLI 的一个简单扩展。

```bash
npm i ngx-build-plus --save-dev
```

在安装之后，他会更新你的应用程序的 `angular.json` 配置文件的 `builder` 配置节，将 `builder` 指向 `ngx-build-plus:build`

```json
"builder": "ngx-build-plus:build",
```

现在，你可以使用 `ng build --project ... --single-bundle` 构建你的项目。新的标志 `single-bundle` 由 `ngx-build-plus` 所提供。确保你最终得到一个自包含的主包。另外，你可能得到其它的包，其它的外部脚本或者 polyfillls。但是，任何你需要直接运行的你的 web component 代码和它所依赖的库，都在主包中

在本示例中，我使用在 `package.json` 中的构建任务，将该包复制到宿主的 `assets` 文件夹中。

为了将该 Web Component 加载到宿主应用中，你仅仅需要一些 DOM 操作，创建对应的 `script` 标签。

```javascript
// add script tag
const script = document.createElement('script');
script.src = 'assets/external-dashboard-tile.bundle.js';
document.body.appendChild(script);

// add web component
const tile = document.createElement('dashboard-tile');
tile.setAttribute('class', 'col-lg-4 col-md-3 col-sm-2');
tile.setAttribute('a', '100');
tile.setAttribute('b', '50');
tile.setAttribute('c', '25');

const content = document.getElementById('content');
content.appendChild(tile);
```







### Reference

* https://www.angulararchitects.io/aktuelles/angular-elements-part-ii/


