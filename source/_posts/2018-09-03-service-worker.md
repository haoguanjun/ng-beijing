---
title: Angular Service Worker (1) 介绍 Angular Service Worker 
date: 2018-09-03
categories: angular
tags: [angular, PWA]
---
Service workers 强化了传统的 Web 部署模型，赋予应用程序与本机安装的代码同等的可靠性和性能的用户体验。
从最简单的来说，service worker 是运行在 Web 浏览器中用来管理应用程序缓存的一段脚本。
<!-- more -->

## Angular Service Worker #1: 介绍 Angular Service Worker 

Service workers 强化了传统的 Web 部署模型，赋予应用程序与本机安装的代码同等的可靠性和性能的用户体验。

从最简单的来说，service worker 是运行在 Web 浏览器中用来管理应用程序缓存的一段脚本。

Service worker 的功能是网络代理。其拦截所有由应用程序发出的 HTTP 请求，并选择如何响应。例如，它可以查询本地的缓存，如果缓存存在的话，则传送缓存的响应。代理并不仅限于编程中的 API 请求，例如 fetch，也包括在 HTML 中引用的资源，甚至是初始的 `index.html` 页面。基于 Service worker 的缓存完全可编程，并且不依赖与服务器端特别的缓存头。

与其它由应用程序管理的脚本不同，例如 Angular 的应用包，service worker 在用户关闭 tab 之后仍然保留。在浏览器再次加载应用程序的时候，service worker 首先加载，介入加载应用程序对资源的所有请求。如果 service worker 被设计于此，它可以***完全处理加载应用程序的要求，而不需要网络***。

即使对于快速可靠的网络，往返的延迟也会在加载应用程序的时候导致显著的延迟时间。使用 service worker 来减少对于网络的依赖可以显著增强用户的体验。

### Angular 中的 Service workers 

Angular 应用程序作为单页应用，可以从 service workder 的优势中占据有利的位置。从 `5.0.0` 开始，Angular 提供了带有 service worker 的实现。Angular 开发者可以从 service worker 中获得优势，从它提供的可靠性和性能增强中获益，而不需要基于底层的 API 编码。

Angular 的 service worker 被设计为优化基于慢速或者不可靠网络连接的使用应用程序的用户体验，同时尽量减少服务过期的风险。

Angular service worker 的优势遵循如下设计目标：

* 如同安装本地应用程序一样缓存应用程序。应用程序作为一个单位进行缓存，所有文件一起更新。
* 运行中的应用程序持续运行所有文件的同一版本。它不会突然启动从新的版本中收到的缓存文件，该文件可能是不兼容的。
* 当用户刷新应用程序的时候，他们看到最新缓存的完整版本。新的 Tab 会加载最新缓存的代码。
* 更新在后台进行，在更新发布之后相当快进行。上一版本的应用程序一直被使用，直到新的更新被安装并就绪。
* service worker 尽可能节省带宽，只有变化的资源被下载。

为了支持这些行为，Angular service worker 从服务器加载一个 *manifest* 文件。该清单文件描述缓存的资源，包含每一文件内容的 hash 值。当应用程序的更新被部署的时候，清单文件的内容也会被更新，通知 service worker 有一个新版本的应用程序应当被下载并缓存。该清单文件由 CLI 生成，它是名为 `ngsw-config.json` 的配置文件。

安装 Angular service worker 如同包含 NgModule 一样简单。另外需要在浏览器注册 Angular service worker，这也导致有一些与 service worker 交互的注入服务可用，可以用来控制 service worker。例如，应用程序可以请求在新的更新出现时获得提示，或者应用程序可以请求 service worker 检查服务器是否有更新可用。

### 先决条件

应用程序必须运行在支持 service worker 的浏览器中。当前，最新版本的 Chrome 和 Firefox 都提供支持。要了解其它浏览器对 service worker 的支持，请查阅  [Can I Use](http://caniuse.com/#feat=serviceworkers) 页面。

```
注：Edge 从版本 17 开始也提供了支持，实际上，目前只有 IE 和 Opera Mini 没有提供支持。
```
