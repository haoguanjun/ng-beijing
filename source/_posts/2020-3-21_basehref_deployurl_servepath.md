---
title: baseHref, deploy-url  与 servePath    
date: 2020-3-21
categories: angular
---
Angular CLI VS提供了 3 个关于发布有关的路径，它们有什么用，在什么场景下面使用呢？
<!-- more -->
## baseHref, deploy-url  与 servePath

Angular CLI VS提供了 3 个关于发布有关的路径，它们有什么用，在什么场景下面使用呢？

1. 先说 `baseHref`。

在 Angular 应用中，页面中的 href 一般是一个 /，通常，CLI 会将应用发布到 `/` 之下，页面的 `head` 中有如下设置 
```html
<base href="/" >
```
这时候，页面中的相对链接会在此基础上被应用，例如，页面中如果有一个图片的路径是 `assets/angular.png`，那么，实际访问的路径将会是 `/assets/angular.png`。

但是，在实际发布的时候，应用可能将被部署到一个子目录之下，例如  /news 之下，如果页面中的这个 base href 还是 / 的话，页面中的链接就会得到错误的结果。例如，图片路径计算出来还是 `/assets/angular.png` ，由于项目已经部署到子目录 news 之下，图片的实际路径就应该是 `/news/assets/angular.png`。所以，此时页面中的这个 base href 就应该也成为 news/ 才能保证应用正常工作。需要注意的是，这里的 href 路径如果没有主机名的话，就必须以 / 结尾才能生效。

可以不用修改 index.html 页面，而直接使用 CLI 命令来完成这个工作。它会直接修改 index.html 页面中的 base href 设置。

```base
ng serve --baseHref=news
```

在输出中可以看到

```bash
** Angular Live Development Server is listening on localhost:4200, open your browser on http://localhost:4200/news **
```

此时，在地址栏输入的是 `http://localhost:4200/news` 来访问首页，如果查看页面源码的话，可以看到它如下内容：

```html
<html lang="en">
  <head>
     <meta charset="utf-8">
     <title>Hello</title>
     <base href="news/">
  </head>
<body>
  <script src="runtime.js" type="module"></script>
  <script src="polyfills.js" type="module"></script>
  <script src="styles.js" type="module"></script>
  <script src="vendor.js" type="module"></script>
  <script src="main.js" type="module"></script>
</body>
</html>
```

由于页面中已经设置 base href。在访问脚本的时候，所有的导航链接都增加了 `/news` 这一部分。

实际上，你会发现页面相关的脚本等等也都发布到这个 news 子目录下了。

> --baseHref=baseHref	Base url for the application being built.

2. **deployUrl** 

该命令将会把应用部署到指定的目录中，它会修改页面中脚本的路径。但是，不会修改 base href 的设置。所以，页面中的 base href 还是原来的 /。

```bash
** Angular Live Development Server is listening on localhost:4200, open your browser on http://localhost:4200/news **
```

根据 CLI 的输出提示，你可以访问 http://localhost:4200/news 来访问应用，页面中的脚本如下所示：

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Hello</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
  <script src="news/runtime.js" type="module"></script>
  <script src="news/polyfills.js" type="module"></script>
  <script src="news/styles.js" type="module"></script>
  <script src="news/vendor.js" type="module"></script>
  <script src="news/main.js" type="module"></script>
  </body>
</html>

```

由于 base href 没有变化，所以，可能会导致页面中链接发生错误。

在应用部署之后，资源并不与你的应用部署在一起，而是部署在不同的目录中。

可以通过对于资源指定专用的访问路径来解决。

例如，对于我们这种情况来说，可以使用如下命令。这样所有资源的访问都将位于 `/news` 之下来。

```base
ng serve --baseHref=news/ --deploy-url=news/
```

>  --deployUrl=deployUrl		URL where files will be deployed.

3. servePath

它不修改页面内容，仅仅将本地服务器的服务地址从 / 改成了指定的路径。

例如，下面的命令将会使本地开发服务器的服务地址从 / 改变为 /news

```bash
ng serve --servePath=news
```

命令的输出类似前面

```bash
** Angular Live Development Server is listening on localhost:4200, open your browser on http://localhost:4200/news **
```

生成的页面内容没有变化

```html
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Hello</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
<script src="runtime.js" type="module"></script><script src="polyfills.js" type="module"></script><script src="styles.js" type="module"></script><script src="vendor.js" type="module"></script><script src="main.js" type="module"></script></body>
</html>

```

由于路径已经变化了，所以，可以看到首页，但是脚本加载会出错。

使用下面的命令，可以将脚本的路径修改正确。

```bash
ng serve --servePath=news --deployUrl=news
```


> --servePath=servePath	The pathname where the app will be served.

参考资料

* https://angular.io/cli/serve
*  https://blog.ninja-squad.com/2017/09/14/angular-cli-1.4/

