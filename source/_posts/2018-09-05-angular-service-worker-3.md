---
title: Angular Service Worker (3) Service Worker 通讯
date: 2018-09-03
categories: angular
tags: [angular, PWA]
---
Service workers 强化了传统的 Web 部署模型，赋予应用程序与本机安装的代码同等的可靠性和性能的用户体验。
从最简单的来说，service worker 是运行在 Web 浏览器中用来管理应用程序缓存的一段脚本。
<!-- more -->

## Angular Service Worker #3: Service Worker 通讯 
将 `ServiceWorkerModule` 导入 `AppModule` 不仅仅是注册 service worker。它还提供了一些服务，您可以用来与 service worker 交互并控制应用程序的缓存。

### SwUpdate 服务

在 service worker 发现您的应用有更新可用，或者它激活了此更新的时候 - 这意味着它将该更新的内容用于您的应用程序， `SwUpdate` 服务使你可以得到事件通知。

 `SwUpdate` 支持四种操作：

* 获取更新_可用_通知。如果页面刷新，新版本的应用将被加载。
* 获取更新_激活_通知，在新版本应用立即开始服务的时候。
* 请求 service worker 检查新的更新
* 请求 service worker 在当前 Tab 激活最新版本应用

#### 可用和激活的更新

两个更新事件，`availabled` 和 `activated`，`SwUpdate` 的 `Observable` 属性：

```typescript
@Injectable()
export class LogUpdateService {

  constructor(updates: SwUpdate) {
    updates.available.subscribe(event => {
      console.log('current version is', event.current);
      console.log('available version is', event.available);
    });
    updates.activated.subscribe(event => {
      console.log('old version was', event.previous);
      console.log('new version is', event.current);
    });
  }
}
```

您可以使用这些事件来提醒用户等待的更新，或者在代码已经过期的时候，刷新页面。

#### 检查更新

可以请求 service  worker 检查是否有更新已经部署在服务器上。如果您的站点频繁更新，或者希望更新被调度的时候，您可以选择这样做。

使用 `CheckForUpdate()` 方法：

```typescript
import { interval } from 'rxjs';

@Injectable()
export class CheckForUpdateService {

  constructor(updates: SwUpdate) {
    interval(6 * 60 * 60).subscribe(() => updates.checkForUpdate());
  }
}
```

该方法返回一个标识更新检测已经成功完成的 `Promise` 。它不表示作为检查的结果，是否发现了更新。即使发现了，service worker 必须要成功下载变化的文件，而这可能会失败。如果成功了，`available` 事件将提示新版本的应用可用。

#### 强制更新激活

如果当前 Tab 的应用程序需要立即更新的最新版本，可以使用 `activateUpdate()` 方法来完成。

```typescript
@Injectable()
export class PromptUpdateService {

  constructor(updates: SwUpdate) {
    updates.available.subscribe(event => {
      if (promptUser(event)) {
        updates.activateUpdate().then(() => document.location.reload());
      }
    });
  }
}
```

这样做会打断当前正在运行程序的延迟加载，特别是如果延迟加载的块使用带有哈希的文件名，它会在每个版本变化。
