---
title: 静默刷新 - 当使用简化模式时刷新访问令牌     
date: 2020-01-03
categories: 
    - oidc-client.js
    - angular
---
通过静默刷新，可以在不使用刷新令牌的情况下，支持简化模式的客户端刷新访问令牌。
<!-- more -->

# 静默刷新 - 当使用简化模式时刷新访问令牌

**在使用简化模式的时候，不能请求或者使用刷新令牌 (refresh token)。** 这是因为客户端不能被明确或者安全地被认证，进而不能被信任使用如此敏感的令牌。这也适用于没有能力保存密钥或者使用安全的后端通道请求的公共客户端。如果用于此类客户端的刷新令牌被窃取，那么盗窃者将可以使用它来获取该用户的访问令牌，而不需要其它信息或者询问。

当使用允许在浏览器上的客户端应用的时候，OpenID Connect 的简化模式被设计用于此场景，我们期望在应用程序中使用用户信息，他们可能会切换到其它页签，甚至是浏览器之外的其它应用程序中，但是，该登录 Session 需要仍然保持。这意味着，如果访问令牌过期了，应用程序需要被授予另外一个。我们也不期望客户端的应用程序需要执行任何类型的后台任何，或者长期执行的处理。

但是，怎么实现呢？例如，用户正在应用程序中填写表单，但是访问令牌过期了呢？没准有的庞大的表单需要花费 3 个小时才能完成，或者用户只是去拿了一杯咖啡或者茶呢。默认的行为是在访问资源的时候返回的 401 未授权错误后，你使用的 OpenID Connect 中间件把你带到你的 OpenID 提供者来获取另一个新的访问令牌，然后，返回你原来使用的页面。这也意味着正在填写的表单可能重新变成空白，所有的数据都丢失了。

所以，你需要创建一个在将用户重新定向到 OpenID 提供者之前，保存数据的机制。但是，先发制人是不是更好？如前所述，刷新令牌不是此时的选项，但是，还有另外一种机制我们可以使用，通常称为：静默刷新。

## 静默刷新

静默刷新假设仍然登录到 OpenID 提供者的用户，自动发出一个新的 OpenID Connect 授权请求，并接收新的访问令牌。它可以在后台进行而不会中断用户体验。

请求通常通过 `iframe` 来实现，该请求非常微小而几乎不被用户所感知。该请求类似于应用程序在用户初始认证时的请求，但是做了一点微调。

最主要的是，我们将在 OpenID Connect 的授权请求中使用 `prompt` 参数。该参数用于给 OpenID 提供者提供一个关于请求如何处理的提示。使用值 `none` ，我们告诉提供者，它不需要显示任何验证或者提醒页面。如果用户仍然被 OpenID Provider 所认证，通常用户在 OpenID Provider 的网站上已经得到了一个认证的 Cookie，那么，提供者可以直接成功，并返回新的访问令牌，跟正常时候相同。但是，如果用户已经不再有效，或者需要通过某种方式与提供者交互，提供者将直接返回错误。

所以，静默刷新的基本方式如下所示：

1. 触发静默刷新 (通过访问令牌的有效时间触发，或者访问受保护资源时返回的 401 )
2. 打开一个 `iframe`
3. 发出包含一个 `prompt` 的值为 `none` 的 OpenID Connect 授权请求
4. 收到响应内容
    1. 如果收到访问令牌，更新会话
    2. 否则，终止会话，并重定向到 OpenID 提供的主界面

### 1. 使用 Angular CLI 和 oidc-client 实现静默刷新

这里我们使用 [oidc-client-js 库](https://github.com/IdentityModel/oidc-client-js) 来提供对 OpenID Connect 的支持，还有其它的 OpenID Connect 库可用于 Angular，但是 oidc-client-js 是纯的 JavaScript 库，可用于任何的 JS 框架中，即使你不使用 Angular，下面的代码也一样可以使用。

第一件事，需要更新在 `Auth 服务` 中的 `UsermanagerSettings` 。

```typescript
export function getClientSettings(): UserManagerSettings {
  return {
    // existing settings
    automaticSilentRenew: true,
    silent_redirect_uri: 'http://localhost:4200/silent-refresh.html'
  };
}
```

我们将 `automaticSilentRenew`  设置为 `true` 来启用自动静默更新。这会在访问令牌将要过期的时候，触发静默更新事件，它会在用户的当前页面中的 `iframe` 中触发静默刷新请求。

静默刷新请求会使用一个单独的重定向地址 URI。这样可以使得我们对于静默刷新和用户交互有不同的处理逻辑。你也可以使用现有的重定向端点。

在这里，我直接使用了一个静态的 html 页面地址。我们可以使用 Angular 管理的页面来加载，但是，我需希望加载当前应用的另外一个实例到 iframe 中。通过这种方式，我们可以保持处理轻量且高效。

> 在 `iframe` 的中页面实际上是另外一个页面，或者是另外一个应用实例。
>
> oidc-client.js 内部基于页面通讯，实现了 iframe 与主页面之间的通讯机制。所以，在主页面中的访问令牌将要到期的时候，将会向 `iframe` 发出通知，而在 `iframe` 中从服务器获取到新的访问令牌之后，也可以直接通知主页面来更新当前使用的访问令牌。

> 不要忘了将添加该路由作为授权的重定向地址添加到你的 OpenID 提供者中。
>
> 例如，在 IdentityServer4 中的 `ClientRedirectUris` 表中。

 ### 2. silent-refresh.html

我将这个页面保存到 Angular 项目中的 /static/ 文件夹中，名为 `silent-refresh.html`页面的内容如下：

```html
<head>
    <title></title>
</head>
<body>
<script src="oidc-client.min.js"></script>
<script>
    new UserManager().signinSilentCallback()
        .catch((err) => {
            console.log(err);
        });
</script>
</body>
```

由于是独立的页面，所以，需要自己添加 `oidc-client.min.js` 的引用，并处理静默更新的回调。

这里，我们加载一个简单的页面，它直接调用 `UserManager` 的 `signinSilentCallback` 方法。

> 基于可能从不同的位置来加载 `oidc-client.min.js` (dist 或者 lib)，可能需要将 `UserManager` 修改为 `Oidc.UserManager`。

由于需要将这个静态页面和 `oidc-client.min.js` 复制到发布目录中，我们需要更新 `angular.json` 文件，分别将这个静态网页和脚本复制到发布目录中。

```json
{
    "apps": [{
        "assets": [
              {
                "glob": "**/*",
                "input": "client-side/static",
                "output": "/"
              },
              {
                "glob": "oidc-client.min.js",
                "input": "node_modules/oidc-client/dist",
                "output": "/"
              }
            ],
    }]
}
```

由于复制了 `oidc-client.min.js` 静态文件，我们可以很容易在 Angular 之外访问它。

就是这些了。在下次访问令牌将要过期的时候，在你的网络监控中，你将会看到授权请求，后面跟着 `silent-refresh` 页面的加载。

![](https://www.scottbrady91.com/img/oidc/silentrefresh.png)

 如果你想证明它确实可以工作，可以将访问令牌的生命周期设置为 60 秒，然后可以看到疯狂的网络流量。

### 3. 处理错误

通过 `silentRenewError ` 仍然可以处理在自动刷新令牌过程中的错误，不管是超时，还是接收到错误的响应。

可以如下订阅事件。

```javascript
this.manager. events.addSilentRenewError(function(){
      // custom logic here
});
```



### See also

* [Silent Refresh - Refreshing Access Tokens when using the Implicit Flow](https://www.scottbrady91.com/OpenID-Connect/Silent-Refresh-Refreshing-Access-Tokens-when-using-the-Implicit-Flow)
* [Getting Started with OAuth 2.0 Pluralsight Course](https://www.pluralsight.com/courses/oauth-2-getting-started)
