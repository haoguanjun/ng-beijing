---
title: Angular Service Worker (2) Service worker 入门 
date: 2018-09-03
categories: angular
tags: [angular, PWA]
---
Service workers 强化了传统的 Web 部署模型，赋予应用程序与本机安装的代码同等的可靠性和性能的用户体验。
从最简单的来说，service worker 是运行在 Web 浏览器中用来管理应用程序缓存的一段脚本。
<!-- more -->

## Angular Service Worker (2) Service worker 入门 

该文档说明如何在你的 CLI 项目中启用 Angular service worker。它使用一个简单的应用向您展示 service worker 的操作，演示加载和基本的缓存。

### 先决条件

对下列概念的基本理解：

* Angular service worker introduction
* Angular v6，包括 Angular CLI v6

### 在项目中添加 service worker

为项目设置 Angular service worker，使用 CLI 的命令 `ng add @angular/pwa`，它会通过添加 `service-worker` 包并设置需要的支持文件，来小心配置您的应用程序使用 service worker。

```bash
ng add @angular/pwa --project *project-name*
```

注，这需要在你的项目文件夹内执行。

上边的命令完成下述操作：

* 在项目中添加 @angular/service-worker 包
* 在 CLI 中启用 service worker 的构建支持
* 在 app module 中导入并注册 service worker
* 更新 `index.html`：
  * 包含新添加的 `manifest.json` 链接文件
  * 为 `theme-color` 添加 meta 标签
* 安装图标文件，已支持安装的渐进式 Web 应用 (PWA)
* 创建名为 `ngsw-config.json` 的 service worker 配置文件，它指定缓存的行为和其它设置。

现在，现在构建项目

```bash
ng build --prod
```

注意，这里使用了产品模式，默认设置只有在产品模式，才会启用 service  worker。

该 CLI 项目现在设置了使用 Angular service worker。

### 演练 service worker 之旅

该节使用示例应用演练 service worker。

#### 使用 http-server

由于 `ng serve` 不能与 service worker 协作，你必须使用其它的 HTTP 服务器来本地测试您的应用程序。可以使用任何 HTTP 服务器。下面的示例使用来自 npm 的 [http-server](https://www.npmjs.com/package/http-server) 。为了减少可能的困扰，测试使用特定的端口。

启动 `http-server`，将当前目录改变到你的 Web 文件的目录，并启动 Web 服务器。

```bash
cd dist/*project-name*
http-server -p 8080
```

#### 初始加载

在服务器运行的时候，使用浏览器访问  http://localhost:8080/。您的应用应该正常加载。

提示：在测试 Angular service worker 的时候，最好是在浏览器中使用私有的窗口，以确认 service worker 不会从以前剩余的状态中读取，这会导致意外的行为。

#### 模拟网络故障

模拟网络故障，在 Chrome 中，从您的应用程序中禁用网络交互：

1. 选择 Tools -> Developer Tools
2. 切换到 Network 面板
3. 选中 Offline 框

![](https://angular.io/generated/images/guide/service-worker/offline-checkbox.png)

现在，应用不能访问网络交互。

对于没有使用 Angular service worker 的应用程序，现在刷新将显示 Chrome 的网络断开页面，并提示 "There is no internet connection"。

对带有 Angular service worker 的应用程序，应用程序的行为发生了变化，在刷新的时候，应用程序正常加载。

如果您检查 Network 面板，将会看到 service  worker 的活动。

![](https://angular.io/generated/images/guide/service-worker/sw-active.png)

注意，在 “Size” 栏中，请求的状态是 `(from ServiceWorker)`。这意味着资源没有从网络加载，相反，它们从 service worker 的缓存加载。

#### 什么被缓存了？

注意所有应用程序用来渲染的文件都被缓存了。 为缓存 CLI 使用的特定资源，`ngsw-config.josn` 模板配置缓存：

* index.html
* favicon.ico
* 构建的组件 (js 和 CSS 包)
* 任何 assets 文件夹中的内容

#### 修改应用

现在你见到了 service worker 如何缓存应用程序，下一步理解更新是如何工作的。

1. 如果你在独立窗口中测试，打开第二个 Tab。这将保持独立，在测试中缓存状态将继续。
2. 关闭应用程序的 Tab，但是不要关闭整个窗口。这也会关闭前面的开发者面板。
3. 停掉 `http-server`
4. 然后，修改你的应用并观察 service  worker 安装更新
5. 打开 `src/app/app.component.html` 进行编辑
6. 将文本 `Welcome to {{title}}` 修改为 `欢迎 {{title}}`
7. 构建并重新运行服务

```bash
ng build --prod
cd dist/*project-name*
http-server -p 8080
```

#### 在浏览器中更新应用

现在，观察浏览器和 service worker 如何处理应用程序的更新。

1. 在同一窗口再次打开 http://localhost:8080 ，发生了什么？

   ![](https://angular.io/generated/images/guide/service-worker/welcome-msg-en.png)

   为什么出错了？实际上没有。Angular service worker  在进行处理，使用已经安装的版本工作，甚至在更新已经存在的情况下也是如此。为了加快速度，service worker 不会在应用程序已经缓存的情况下，等待更新检查。

   如果您检查 `http-server` 的日志，你会看到 service worker 请求了 `/ngsw.json`。这就是 service worker 是如何检查更新的。

2. 刷新页面

   ![](https://angular.io/generated/images/guide/service-worker/welcome-msg-fr.png)

   Service worker 在_后台_安装更新后的版本，在下次页面被加载或者重新加载的时候，service worker 切换到最新的版本。
