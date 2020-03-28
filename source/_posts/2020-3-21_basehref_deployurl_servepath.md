---
title: baseHref, deploy-url  与 servePath    
date: 2018-08-27
categories: angular
---
Angular CLI VS提供了 3 个关于发布有关的路径，它们有什么用，在什么场景下面使用呢？
<!-- more -->
## baseHref, deploy-url  与 servePath

Angular CLI VS提供了 3 个关于发布有关的路径，它们有什么用，在什么场景下面使用呢？

1. 先说 `baseHref`。

默认情况下，CLI 会将应用发布到 `/` 之下，但是，有的时候，在实际发布的时候，应用可能将被部署到 /news 之下，这样的话，所有涉及的超级链接将会变化，我们希望在本地调试的时候，就使用与生产环境下相同的导航路径。就可以使用这个 `baseHref` 参数了。

```base
ng serve --baseHref=news
```

这样，在本地访问应用的时候，即使你在地址栏输入的是 `http://localhost:4200/` ，也会被自动重定向到 `http://localhost:4200/news` 之下。所有的导航链接都增加了 `/news` 这一部分。如果检查页面源码的话，会看到增加了一个页面标头 `base` 来设置这个值。

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Appui</title>
  <base href="news">
```

2. **deploy-url** 

在使用了 `baseHref` 之后，你很可能发现，你只能访问到应用的首页 HTML 内容，但是各种静态的资源都访问不到了，检查网络通讯，你会发现一堆的 404 错误。

注意现在的资源访问路径中，都会增加了 `/news` 这个开头部分。这个路径是虚拟的，你的资源并不在这个路径之下，所以访问失败了。

还有一种情况是，在应用部署之后，资源并不与你的应用部署在一起，而是部署在不同的目录中。

可以通过对于资源指定专用的访问路径来解决。

例如，对于我们这种情况来说，可以使用如下命令。这样所有资源的访问都将位于 `/news` 之下来。

```base
ng serve --baseHref=news --deploy-url=news/
```

3. servePath

很多情况下，我们是将应用和资源打包一起发布到一个特定的目录下，而不是 `/` 目录下，这样的话，我们就需要同时设置上面两个路径，对于这种情况，使用 `servePaht` 就更方便一点，它相当于同时设置了上面两个路径。

所以，我们可以直接使用下面的命令，在开发环境下，将应用和资源发布到 `/news` 中。

```bash
ng serve --servePath=news
```


参考资料

* https://angular.io/cli/serve
*  https://blog.ninja-squad.com/2017/09/14/angular-cli-1.4/




