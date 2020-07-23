---
title: Angular Proxy 配置中的 secure     
date: 2020-07-23
categories: angular
---
原来这个 secure 是做这个用的，如果希望验证站点的 SSL 证书，就设置为 true。
<!-- more -->

# Angular Proxy 配置中的 secure

在使用 Angular 中的代理服务器的时候，遇到这样一个错误：

> (UNABLE_TO_VERIFY_LEAF_SIGNATURE) (https://nodejs.org/api/errors.html#errors_common_system_errors)
> [HPM] Error occurred while trying to proxy request /xxxxxxx from localhost:4200 to https://xxxxxxx (UNABLE_TO_VERI
> FY_LEAF_SIGNATURE) (https://nodejs.org/api/errors.html#errors_common_system_errors)

从错误信息看，是未能成功验证叶签名，我只是使用一个代理，跟签名有什么关系呢？

使用浏览器直接访问这个地址，也是可以直接访问的呀。这是怎么回事？

既然是签名错误，那我不验证站点的证书不就可以吗？

在使用 https 的情况下，如果 API 的站点使用了自签名证书等等不能验证的证书，怎样绕过证书验证呢？要是像 Postman 里面有个是否启用 SSL 证书验证的设置就好了。

访问 https://angular.io/guide/build 没有提到这件事，接着访问里面提供的关于代理设置的链接 https://webpack.js.org/configuration/dev-server/#devserverproxy，也没有说明。

怎么办呢？

Angular 中提供的内置代理服务器，实际上是集成了 [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware#readme) 来提供的，而它又是基于 [node-http-proxy](https://github.com/http-party/node-http-proxy#readme) 来实现的。看看 Angular 里面代理的配置选项就能能看出来它们是一脉相承的。

在  [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware#readme) 的说明中，看到一个关于它的设置：

> **option.secure**: true/false, if you want to verify the SSL Certs

原来这个 secure 是做这个用的，如果希望验证站点的 SSL 证书，就设置为 true。

怪不得在 Angular 的示例配置中，它都配置为了 false，就没有看到设置为 true 的时候。原来不能随便把它设置为 true。有个博客说它表示是否使用了 https ，搞得我把它设置为 true 了。看来根本不是这么回事。

把就可以使用这个 secure 来绕过证书验证。下面是示例的代理配置。注意目标站点的协议虽然是 `https`，但是下面的 `secure` 一定要设置为 false 来避免验证目标网站的证书。

```json
    "/dashboard": {
        "target": "https://xxxxxxxxx/v1/dashboard/",
        "secure": false,
        "logLevel": "debug",
        "changeOrigin": true,
        "pathRewrite": {
            "^/dashboard": ""
          }
    },
```




