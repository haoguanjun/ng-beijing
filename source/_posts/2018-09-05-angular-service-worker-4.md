---
title: Angular Service Worker - 4: 产品中的 Service Worker
date: 2018-09-05
categories: angular
tags: [angular, PWA]
---
Service workers 强化了传统的 Web 部署模型，赋予应用程序与本机安装的代码同等的可靠性和性能的用户体验。
从最简单的来说，service worker 是运行在 Web 浏览器中用来管理应用程序缓存的一段脚本。
<!-- more -->

## Angular Service Worker - 4: 产品中的 Service Worker

本节是关于 Angular service  worker 的部署和产品支持。它说明了 Angular service worker 是如何配合大型产品环境，多种条件下的 service worker 的行为，以及可用的资源和故障安全。

### Service worker 和应用资源的缓存

从概念上讲，您可以把 Angular  service worker 想象成一个前向缓存或者一个安装在用户浏览器端的 CDN 。service worker 的工作是满足 Angular 应用程序对于本地缓存的资源或者数据的请求。而不需要网络等待。类似于任何缓存，它也有内容过期和更新的规则。

#### 应用版本

在 Angular service worker 的语境中，“版本” 是表示特定 Angular 应用构建的资源集。每当一个新的应用构建被部署，service worker 将该构建看作一个新版本的应用程序。甚至在只有单个文件被更新的时候也是如此。在任何给定的时间，service worker 在它的缓存中可能拥有该应用程序的多个版本，它可能同时使用它们。更多信息，请参考 App tabs 一节。

为了保持应用的完整性，Angular service worker 将所有文件一起看作一个版本。同一版本中的文件通常包括 HTML、JS 以及 CSS 文件。将文件分组本质上是为了完整性，因为 HTML、JS 和 CSS 经常引用其它并依赖特定内容。例如，`index.html` 文件可能拥有一个 `<script>` 标记，其引用了 `bundle.js` ，它可能调用了其中名为 `startApp()` 的函数。任何时候在 `index.html` 被使用的时候，相关的 `bundle.js` 必须一起被使用。例如，假设 `startApp()` 函数在两个文件中被重新命名为 `runApp()` ，在这种情况下，它就不会被旧的 `index.html` 所使用，对于新的块来说，它应该调用 `startApp()`。

在延迟加载的情况下，文件完整性尤其重要。JS 的块可能引用了许多延迟加载块，延迟加载块的文件名对于应用的特定构建来说是唯一的。如果一个运行中的应用在版本 x 的时候试图延迟加载块，但是服务器的版本已经更新到了 x+1，延迟加载操作可能失败。

应用程序的版本标识来自所有资源的内容，其中任何之一发生变化版本都将变化。在实践中，版本由 `ngsw.json` 的内容决定，包括所有已知内容的哈希。如果任何缓存的文件发生变化，在 `ngsw.json` 中文件的哈希将会变化，导致 Angular service worker 将文件的活动集作为新的版本。

使用 Angular service worker 的版本行为，应用程序服务器可以确保 Angular 应用总是拥有一致的文件集。

#### 更新检测

在任何用户打开或者刷新应用程序的时候，Angular service worker 通过检查 `ngsw.json` 清单来发现应用更新。如果发现了更新，就会自动下载并缓存，在下次应用加载的时候将被使用。

#### 资源的一致性

长期缓存的一个副作用是无效资源。在正常的 HTTP 缓存中，硬刷新或者缓存过期限制了缓存无效文件的副作用。service worker 忽略这些约束，有效长时间缓存整个应用，因此，service  worker 必须获取正确的内容。

为了确认资源完整性，Angular service worker 验证它拥有哈希值的所有资源的哈希。特别是 CLI 应用，在 `dist` 中的所有内容被用户的 `src/ngsw-config.json` 配置文件所覆盖。

如果特定文件验证失败，Angular service worker 将试图使用 `cache-busting` URL 参数重新获取内容来消除浏览器或者中间缓存的影响。如果内容仍然无效，service  worker 认为应用的版本整体无效，并停止使用该应用。如果需要，service  worker 进入安全模式，请求重新回到网络上，如果服务无效、损坏或过时的内容的风险很高, 则选择不使用其缓存。

哈希有多种因素不一致：

* 在源服务器和最终用户之间缓存层可能会提供陈旧的内容。
* 非原子部署可能导致 Angular service  worker 具有部分更新内容的可见性。
* 构建过程中的错误可能导致资源的更新，但 ngsw. json 没有被更新。反过来也可能会导致更新的 ngsw. json, 但没有更新的资源。

#### 未哈希的内容

在 ngsw.json 清单中, 唯一具有哈希值的资源是在生成清单时在该区目录中存在的资源。其他资源 (尤其是从 CDN 中加载的) 的内容在生成时未知, 或者更新的频率比应用程序部署的频率更高。

如果 Angular service  worker 没有哈希值来校验给定的资源。它仍然缓存其内容，但是它通过使用 “在重新验证时过时” 的策略来考虑 HTTP 缓存头. 即, 当缓存资源的 HTTP 缓存标头指示资源已过期时，Angular service worker 继续使用其内容，并在后台视图刷新资源。这样, 断开的未散列资源就不会留在缓存中超过其配置的生存期。

#### App 面板

如果一个应用程序的版本的资源在没有警告的情况下突然变化, 它可能会有问题。有关此类问题的说明, 请参阅上文的 "版本" 部分。

Angular service worker 提供一个保证：运行中的应用将继续运行相同的版本。如果应用的其它实例在浏览器的新的 Tab 中打开，则使用最新的版本。结果就是，新的 Tab 上可能运行应用的另外一个版本。

要点是该保证优先于普通的 Web 部署模型。没有 service worker，就不能保证运行中的应用通过初始代码延迟加载的代码是相同的版本。

有几个有限的原因, 为什么 Angular service worker 可能会改变运行的应用程序的版本。其中一些是错误条件:

* 由于哈希失败, 当前版本变得无效。
* 不相关的错误导致服务工作人员进入安全模式;即暂时停用。

Angular service worker 知道在任何给定时刻正在使用哪些版本, 并且在没有 tab 使用的情况下清理版本。

其它 Angular service worker 可能在运行中改变版本的原因是普通事件：

* 页面重新加载
* 页面通过 `SwUpdate` 服务请求更新立即激活

#### Service worker 更新

Angular service worker 是一小段运行在浏览器的脚本。随着时间推移，service worker 也将随着 bug 修复和功能改进被更新。

Angular service worker 加载于应用首次打开的时候，以及一段时间不活动后被访问时。如果 service worker 变化了，service worker 将在后台更新。

多数对于 Angular service worker 的更新对于应用是透明的，原有的缓存仍然有效，内容仍然正常使用。但是，偶然的补丁或者 Angular service worker 的新特性要求原有缓存失效。在这种情况下，应用将从网络透明刷新。

### 调试 Angular service worker 

偶然情况下，可能需要在运行状态下检查 Angular service worker 来调查问题，或者确认它如设计的工作。浏览器提供了内建的工具来调试 Service worker ，Angular service worker 也本身也包含了有用的调试特性。

#### 定位和分析调试信息

Angular service worker 在 `ngsw/` 虚拟目录下暴露了调试信息。当前，暴露的单一 URL 为 `ngsw/state`。下面是调试信息的示例。

```
NGSW Debug Info:
 
Driver state: NORMAL ((nominal))
Latest manifest hash: eea7f5f464f90789b621170af5a569d6be077e5c
Last update check: never
 
=== Version eea7f5f464f90789b621170af5a569d6be077e5c ===
 
Clients: 7b79a015-69af-4d3d-9ae6-95ba90c79486, 5bc08295-aaf2-42f3-a4cc-9e4ef9100f65
 
=== Idle Task Queue ===
Last update tick: 1s496u
Last update run: never
Task queue:
 * init post-load (update, cleanup)
 
Debug log:
```

#### 驱动器状态

第一行是驱动请状态

```
Driver state: NORMAL ((nominal))
```

`NORMAL` 表示 service worker 工作正常，没有在降级状态。

有两个可能的降级状态:

- `EXISTING_CLIENTS_ONLY`: service worker 没有应用已知最新班版本的干净副本。旧的缓存版本被安全使用，所以现有面板将从缓存运行， 但是新的应用负载将从网络上提供。
- `SAFE_MODE`:  service worker 不能保证安全使用缓存数据。不管是未预期的异常，还是所有缓存的版本失效。所有流量将从网络服务，尽可能少使用 service worker 代码。

在两种情况下， 圆括号中声明提供导致 service worker 进入降级状态的错误。

#### 最后清单散列

```
Latest manifest hash: eea7f5f464f90789b621170af5a569d6be077e5c
```

service worker 知道的最新版本应用的 SHA1 散列值。

#### 最后更新检测

```
Last update check: never
```

这表示 service  workder 上次检查应用程序的新版本或更新的时间。never  指示 service worker 从未检查过更新。

在此示例调试文件中, 当前更新检查已经安排, 如下一节所述。

#### 版本

```
=== Version eea7f5f464f90789b621170af5a569d6be077e5c ===
 
Clients: 7b79a015-69af-4d3d-9ae6-95ba90c79486, 5bc08295-aaf2-42f3-a4cc-9e4ef9100f65
```

在此示例中，service worker 有一个版本的应用程序缓存, 并用于服务两个不同的选项卡。请注意, 此版本哈希是上面列出的  "最新清单哈希 "。两个客户端都在最新版本中。每个客户机的 ID 都由浏览器中的客户端 API 列出。

#### 空闲任务队列

```
=== Idle Task Queue ===
Last update tick: 1s496u
Last update run: never
Task queue:
 * init post-load (update, cleanup)
```

空闲任务队列是 service worker 后台中发生的所有挂起任务的队列。如果队列中有任何任务, 则会列出它们的说明。在此示例中, 服务工作人员有一个这样的计划任务, 一个初始化操作, 涉及更新检查和清理陈旧的缓存。

Last update tick/run 提供的时间是与空闲队列相关的特定事件发生的。 "Last update run " 计数器显示上次实际执行空闲任务的时间。 "Last update tick " 显示自上次事件之后的时间, 队列可能在其中处理。

#### Debug 日志

```
Debug log:
```

service worker 中出现的错误将记录在此。

### 开发者工具

浏览器 (如 Chrome) 提供开发人员工具来与 service worker 进行交互。在使用得当时, 这些工具可能会很强大, 但是有几件事情需要牢记。

* 使用开发人员工具时，service worker 将保持在后台运行, 永不重新启动。这可能导致开发工具打开的行为与用户可能遇到的行为不同。

* 如果您在缓存存储查看器中查找, 则缓存经常过期。右键单击缓存存储标题并刷新缓存。

![](http://images.cnblogs.com/cnblogs_com/haogj/242334/o_service-worker-tab.png)

在 service worker 窗格中停止和启动服务工作人员会触发检查更新。

### Service worker 安全

与任何复杂系统一样, bug 或损坏的配置都可能导致 Angular service worker 以不可预知的方式行动。虽然它的设计试图尽量减少此类问题的影响, 但在管理员需要快速停用 service worker 的情况下，Angular service worker包含了若干故障保护机制。

#### 故障保险
要停用 service worker ，请删除或重命名 `ngsw-config. json` 文件。当 service worker 对 `ngsw.json` 的请求返回 404 后, service  worker 就会删除其所有缓存和反注销自身，本质上是自毁的。

#### 安全 Worker

`safety-worker.js` 是包含在 `@angular/service-worker` NPM 包中的一小段脚本，当加载的时候，会将自己从浏览器注销。此脚本可以作为最后的手段, 以摆脱已安装在客户端页上的不再需要的 service worker。

请注意, 不能直接注册此 service worker, 因为具有缓存状态的旧客户端可能看不到新的 `index.html`，将安装不同的 worker 脚本。相反, 你必须在您试图注销的服务工作脚本的 URL 上，使用 `safety-worker.js`。必须持续这样做, 直到您确定所有用户都成功地注销了旧的 worker。对于大多数网站, 这意味着您应该永远在老 service worker URL 上使用安全的 worker 。

该脚本既可用于停用 @angular/service-worker，也可以用于在您的站点上以前使用过的任何其他 service worker 。

## See Also

* [Angular service worker introduction](https://angular.io/guide/service-worker-intro)
* [Service worker configuration](https://angular.io/guide/service-worker-config)
