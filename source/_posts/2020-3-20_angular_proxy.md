---
title: 分析变更检测代价     
date: 2020-03-20
categories: angular
---
说明如何配置代理服务器调用后端 API
<!-- more -->


## Angular - 如何代理后端服务器

> 说明如何配置代理服务器调用后端 API

在 Angular 应用中，我们经常在开发阶段就需要访问后端服务器，本文将介绍所有涉及的场景。

* 什么是代理
* 示例应用
* proxy.config.json 
* 使用 Angular CLI 设置 proxy
* 通过其它方式配置
* 重写 path URL
* 多个应用入口访问同一个 API 端点
* 多个应用入口访问多个断点
* 总结

### 1. 什么时候会需要代理？

通常，Angular 是运行在浏览器上的单页应用，需要通过后端 API 的支持，而后端的 API 服务器又可以分为已经支持 CORS 跨域访问的 API 和不支持 CORS 跨域访问的 API 两大类。而 Angular 本身也需要 Host 在某个 Web 服务器上，Angular 本身的 Web 服务器可能与 API 服务器在同一个域中，更有可能的不在同一个域中。例如，在开发模式下，默认是运行在本地的 `localhost:4200` 上。

对于已经支持 CORS 跨域访问的 API 而言，不管 Angular 本身运行在同域环境下，还是非同域环境下，由于 API 已经支持了跨域 CORS，那么，它总是可访问的。对于这样的 API 来说，就不需要使用代理来访问了。

而对于不支持跨域 CORS 访问的 API 而言，如果 Angular 本身与 API 不在同一个域中，是不能访问的。典型的就是开发环境下，Angular CLI 默认使用了 `localhost:4200` 来提供的开发支持。代理就是专门解决这种问题的。

在这种情况下，Angular 要想访问 API 就必须解决跨域问题，解决的方式就是让 Angular 与 API 服务器工作在同域环境下，这样就规避了 CORS 跨域问题。

可是，API 本身并没有与 Angular 同域，那么，我们可以创建一个与 Angular 同域的 API 服务器，但是，它只是代理 Angular 对 API 的访问，在收到对 API 的请求之后，将请求转发到实际的 API 服务器上，由实际的 API 服务器进行处理，处理的结果返回之后，这个代理再将结果传送回 Angular 应用。由于它只是在 Angular 与实际的 API 服务器之间进行代理的处理，所以，我们称为代理服务器。代理服务器又是如何解决跨域问题的呢？很简单，跨域问题是 Web 环境下的问题。而代理服务器是一个本地应用，不是 Web 应用，自然就没有跨域问题。

所以，代理是对于不支持 CORS 的 API 开发环境的。而且，这个代理服务器一定是运行在与 Angular 同样的域中的。

那么，我们如何得到这个代理服务器呢？

很简单，Angular CLI 已经提供了内置的代理服务器支持。

### 2. 什么是代理

简单来说，代理或者代理服务器就是你的应用和互联网之间的网关。它是客户端与服务器之间的中间服务器，将客户端的请求传递给请求的资源。

在 Angular 中，我们通常在开发环境下使用代理。在开发模式下，Angular 使用 webpack 的 dev server 来提供服务，如下图所示，app 运行在端口 4200 上，而后端服务器运行在端口 3700 上。我们就希望所有以 **/api** 开头的同域的 API 请求被代理服务器重定向到后端服务器，而返回的结果最后被返回相同的端口。

下面，我们将看到如何达到这样的目的，以及其它相关的问题。

![](https://upload-images.jianshu.io/upload_images/8303589-85a2bb75e9ca7710.png)

### 2. 示例项目

使用下面的命令来准备示例应用，以及准备 Angular CLI 代理的设置。

```bash
//clone the project
git clone https://github.com/bbachi/angular-proxy-example

// install dependencies for node server
npm install

//cd to ui
cd appui

// install app ui dependencies
np install
```

第一个的 `npm install` 是为 API 服务器提供准备，这是一个使用 nodejs 实现的简单的示例 API 服务器，代码就在 `server.js` 文件中。

第二个 `npm install` 是 Angular 应用的准备工作，这个应用位于 `appui` 文件夹中。

一旦你安装完所有的依赖，就可以启动 Angular App 和 nodejs 服务器。

在 `appui` 文件夹中，使用 `npm start` 或者 `ng serve` 启动 Angular App，现在的 Angular App 使用默认端口 4200.

该应用会试图访问 `http://localhost:4200/api/settings` 这个同域的 API，在没有启动代理服务器的情况下，它是不存在的，所以，在页面中看不到 3 个设置项的值，如果你打开开发者工具的话，还可以看到访问 API 的失败信息。

示例使用的 API 运行在另外一个端口 3700 上，对于 Angular 应用来说，就涉及到跨域访问问题。

现在我们回到 `angular-proxy-example` 目录中，也就是 `appui` 的上级目录中，启动示例的 API 服务器。由于已经在 `package.json` 中进行了配置，可以使用 `npm start` 来启动它。

我们使用 `npm start` 来启动服务器，并测试一下服务在端口 3070 的 API，访问 `http://localhost:3070/api/settings` 可以得到如下结果：

```json
{
    "settings": "settings from server",
    "title": "APP_UI",
    "fullName": "Bhargav Bachina",
    "pageWidth": "60%",
    "text": "This settings coming from the server",
    "headerColor": "gray",
    "footerColor": "red"
}
```



### 3. Proxy.config.json

在 Angular 中，可以通过一个代理配置文件来设置代理服务器的工作方式。通常使用的名称是 `proxy.config.json`。

proxy.config.json 提供了如下的设置：

* **target**：这里定义后端服务器的 URL
* **pathRewrite**: 使用这个设置来修改或者重写 URL
* **changeOrigin**：如果后台服务器不是运行在 localhost 上，就需要将此标志设置为 true
* **logLevle**: 如果希望检查代理服务器的配置是否正常功能，此标志需要设置为 `debug`
* **bypass**: 有时候我们希望能够跳过代理服务器，可以通过它定义一个函数。但是这种场景下，我们更应该使用 proxy.config.js 而不是 proxy.config.json

### 4. 使用 Angular CLI 设置代理

现在 App 和 API Server 已经运行在不同的端口上了。我们开始在它们之间设置代理进行通讯。

第一件需要处理的事情就是在 `appui` 目录下面创建  `proxy.config.json` 配置文件，在这里我们定义所有以 `/api` 开头的都通过代理。这样，对于 4200 端口中的  `/api/settings` 访问就可以变成对于 3070 端口的 `/api/settings` 访问，对于 `http://localhost:4200/api/settings` 的访问就会变成对于 `http://localhost:3070/api/settings` 的访问。

```json
{
    "/api/*": {
    "target": "http://localhost:3070",
    "secure": false,
    "logLevel": "debug",
    "changeOrigin": true
  }
}
```

第二件事，让 Angular 知道我们已经有了这个 `proxy.config.json` 。通过在启动应用的参数中添加 `proxy-config` 标志来进行。如下所示。这样一旦启动 Angular，我们就可以看到标志着所有以 `/api` 开头的请求被重定向到了运行在端口 3070 的 nodejs 服务器上。这可以通过修改 `package.json` 文件中的配置来完成。

```json
"scripts": {
  "ng": "ng",
  "start": "ng serve --proxy-config proxy.conf.json",
  "build": "ng build --prod"
```

现在，页面中的设置表格中，应该已经拿到了 API 返回的设置值。

在 Angular 的命令行窗口中，应该可以看到如下的输出内容

```plain
[wdm]: Compiled successfully.
[HPM] GET /api/settings -> http://localhost:3070
```

### 5. 通过其它方式配置

还有一种方式是在 angular.json 中配置代理服务器的配置。

```json
"serve": {
  "builder": "@angular-devkit/build-angular:dev-server",
  "options": {
    "browserTarget": "appui:build",
    "proxyConfig": "proxy.conf.json"
  }
```

这样就可以直接使用 `ng serve` 启动 Angular 应用，而不需要在 `ng serve` 中添加命令行参数了。

在 Angular 命令行中，可以看到如下的输出结果：

```plain
To disable this warning use "ng config -g cli.warnings.versionMismatch false".
** Angular Live Development Server is listening on localhost:4200, open your browser on http://localhost:4200/ **
 10% building 4/4 modules 0 active[HPM] Proxy created: /api  ->  http://localhost:3070
[HPM] Subscribed to http-proxy events:  [ 'error', 'close' ]                           11% building 15/19 modules 4 active ...es\bootstrap\dist\css\bootstrap.min.cssBrowserslist: caniuse-lite is outdated. Please run next command `npm update caniuse-lite browserslist`
Date: 2020-03-28T05:51:03.579Z
Hash: 903edca80f2cde52e110
Time: 9094ms
chunk {es2015-polyfills} es2015-polyfills.js, es2015-polyfills.js.map (es2015-polyfills) 284 kB [initial] [rendered]
chunk {main} main.js, main.js.map (main) 21.5 kB [initial] [rendered]
chunk {polyfills} polyfills.js, polyfills.js.map (polyfills) 236 kB [initial] [rendered]
chunk {runtime} runtime.js, runtime.js.map (runtime) 6.08 kB [entry] [rendered]
chunk {styles} styles.js, styles.js.map (styles) 1.17 MB [initial] [rendered]
chunk {vendor} vendor.js, vendor.js.map (vendor) 3.84 MB [initial] [rendered]
i ｢wdm｣: Compiled successfully.
[HPM] GET /api/settings -> http://localhost:3070
```

总结一下

* 通过在 ng serve 命令中使用 --proxy-config 参数启动
* 通过在 angular.json 项目文件中的 `serve` 配置节中配置

### 6. 重写 URL

除了修改 URL，我们还经常重写后端服务器的路径，可以通过 `pathRewrite` 来实现。

现在让我理解一下这个 `pathRewrite` 设置。例如，假设我们的后端 URL 从 `/api/settings` 变成了 `/api/app/settings` ，在成为生产环境之前，我们希望在开发环境下测试它。我们可以通过下面的 `pathRewrite` 来实现。

```json
{
    "/api/*": {
    "target": "http://localhost:3070",
    "secure": false,
    "logLevel": "debug",
    "changeOrigin": true,
    "pathRewrite": {
      "^/api/settings": "/api/app/settings",
      "^/api": ""
    }
  }
}
```

这是 API 服务器中的代码

```javascript
app.get('/api/app/settings', (req,res) => {
    console.log('--settings---');
    res.json(settings)
})

app.get('/users', (req,res) => {
  console.log('--users---');
  res.json({users:[]})
})
```

这样，我们将 `/api/settings` 重写为了 `/api/app/settings` ，而 `/api/users` 成为了 `/users`。

这是 console 中的输出

```plain
[HPM] Rewriting path from "/api/settings" to "/api/app/settings"
[HPM] GET /api/settings ~> http://localhost:3070
```

### 7. 多个应用实例访问同一个 API 端点

有时候，在我们的应用中我们有多个带有服务的模块。我们可能有一个场景是多个实体或者服务访问相同的 API 端点。

在这种情况下，我们需要定义 `proxy.config.js` 而不是 `proxy.config.json` 。**不要忘了加到 angular.json** 中。

```javascript
const PROXY_CONFIG = [
    {
        context: [
            "/userapi",
            "/settingsapi",
            "/productapi",
        ],
        target: "http://localhost:3070",
        secure: false
    }
]

module.exports = PROXY_CONFIG;
```

`angular.json` 中的配置

```json
"serve": {
  "builder": "@angular-devkit/build-angular:dev-server",
  "options": {
    "browserTarget": "appui:build",
    "proxyConfig": "proxy.conf.js"
  }
```

### 8. 多个实体访问多个不同的端点

我们已经看到了如何定义多个模块访问相同的端点。现在看一看多个模块访问多个端点的场景。

![](https://upload-images.jianshu.io/upload_images/8303589-fd8b3a15b32c763d.png)

例如，我们有 3 个 API 分别运行在端口 3700， 3800，和 3900 上，你的应用需要分别访问它们。

所有需要做的就是添加多个实体到 `proxy.config.json` 中。这里就是用来设置的配置信息，我们需要确保所有的 API 运行在这些端口上并成功通讯。

```json
{
  "/user/*": {
    "target": "http://localhost:3700",
    "secure": false,
    "logLevel": "debug"
  },
  "/product/*": {
    "target": "http://localhost:3800",
    "secure": false,
    "logLevel": "debug"
  },
  "/settings/*": {
    "target": "http://localhost:3900",
    "secure": false,
    "logLevel": "debug"
  }
}
```

### 9. 总结

* 在 Angular 中，代理服务器通常用于在开发环境下，方便 App 与 API 服务器之间通讯。

* 使用代理服务器的场景是 UI 与 API 运行在不同的端口上，涉及到了跨域访问问题。

* `proxy.config.json` 是用来配置后端服务器所有信息的文件



### 参考文献

https://medium.com/bb-tutorials-and-thoughts/angular-how-to-proxy-to-backend-server-6fb37ef0d025


