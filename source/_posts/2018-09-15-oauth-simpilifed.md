---
title: OAuth 2 简述
date: 2018-09-15
categories: oauth
tags: [oauth]
---
许多诸如Facebook、Github、Google之类的服务已经成功的部署了OAuth2服务。

OAuth2 标准把很多具体的实现方式留给了开发人员，但是很多地方有多种可能的实现方式，本文不会尽数各种可能的方案，而是描述适合于大部分场景的一种实现方式。

本文尝试用最简化的方式来描述OAuth2来帮助开发者和服务提供商实现这套协议。
<!-- more -->

许多诸如 Facebook、Github、Google之类的服务已经成功的部署了OAuth2服务。

OAuth2 标准把很多具体的实现方式留给了开发人员，但是很多地方有多种可能的实现方式，本文不会尽数各种可能的方案，而是描述适合于大部分场景的一种实现方式。

本文尝试用最简化的方式来描述OAuth2来帮助开发者和服务提供商实现这套协议。

内容：

- 角色：应用、API、和用户
- 创建应用
- 授权：获取AccessToken
  - 服务器端的应用
  - 浏览器端的应用
  - 移动应用
  - 其它
- 发起已验证的请求
- 和OAuth1.0的区别
  - 身份验证和签名
  - 用户体验和可选的授权流程
  - 可扩展性
- 资源

## 角色

------

### 第三方应用: “客户端”

“客户端” 指的是尝试访问用户账户的应用，它需要用户的允许才能访问。

### API：“资源服务器”

“资源服务器” 指的是用来访问用户信息的API服务器。

### 用户：“资源拥有者”

资源拥有者指的是可以授权给其他访问者权限以访问自己账户的用户。

## 创建一个应用

在开始OAuth之前，需要现在OAuth服务器上注册一个新的应用。注册应用的时候通常需要提供诸如应用名称、网站、Logo等信息。另外还需要注册一个重定向地址(URI)，当用户授权之后用来重定向到自己的应用。

### 重定向地址(URI)

OAuth服务只会把用户重定向到已经注册了的URI，这样可以防止网络攻击。任何HTTP的重定向地址都应该用TLS保护，所以重定向地址必须是基于 “HTTPS” 的，这样可以保证Token在授权过程中不会被拦截。

### ClientId 和 Secret

在注册完应用之后，会得到一对ClientId和Secret。ClientId是可以公开的信息，可以用来创建登陆地址(LoginURL)或者放在网页的js源码中。Secret必须安全保存，如果应用（比如js或者一些原生应用Android、iOS）不能保证Secret的安全，那么不要使用。

## 授权

OAuth2 应用的第一步是从用户那里得到授权。对于基于浏览器或者移动应用来说，通常是通过OAuth服务器提供一个页面给用户来实现。

OAuth2 针对不同的应用场景提供了多种授权类型：

- AuthorizationCode 针对服务器端应用
- Implicit 针对浏览器应用或者移动应用
- Password 针对使用用户名/密码登陆的用户
- ClientCredentials 针对应用本身的访问

下面分别阐述各种场景。

## 服务端应用

服务端应用是最最常见的授权类型。这种类型的应用使用服务器端语言实现并且运行在一台Web服务器上，它的源码都不会对外公开。

### 授权

创建一个一个登陆连接把用户重定向到

```
https://oauth2server.com/auth?response_type=code&
  client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=photos
```

用户接下来会看到授权提示

 

![img](http://upload-images.jianshu.io/upload_images/653561-55862c0980ef7b76.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/700)

web server apps

如果用户点击了 “Allow”，OAuth服务器会把用户再次重定向到之前注册的网址，并附带一个授权码(Code)

```
https://oauth2client.com/cb?code=AUTH_CODE_HERE
```

你的服务器可以通过授权码(Code)来交换token

```
POST https://api.oauth2server.com/token
    grant_type=authorization_code&
    code=AUTH_CODE_HERE&
    redirect_uri=REDIRECT_URI&
    client_id=CLIENT_ID&
    client_secret=CLIENT_SECRET
```

OAuth服务器会返回一个授权访问token

```
{
    "access_token":"RsT5OjbzRn430zqMLgV3Ia"
}
```

或者返回一个错误信息

```
{
    "error":"invalid_request"
}
```

安全：注意OAuth服务器必须要求应用提前注册好重定向地址。

## 浏览器端应用

这类应用从服务器加载了源码之后会运行在浏览器端。因为所有的源码都在浏览器里面，所以他们不能保证Secret的安全，所以Secret不会应用在这种场景。

### 授权

创建一个登陆连接把用户重定向到

```
https://oauth2server.com/auth?response_type=token&
  client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=photos
```

用户看到授权提示

 

![img](http://upload-images.jianshu.io/upload_images/653561-e01259a43d65ed2f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/700)

browser-based app

如果用户点击了 “Allow”，OAuth服务会把用户重定向到你的网址并附带一个AccessToken

```
https://oauth2client.com/cb#token=ACCESS_TOKEN
```

这样就完了，没有其他的步骤了！此时可以用js从url中获取AccessToken(#号后面部分)然后使用token做请求。

如果发生错误，会收到错误码

```
https://oauth2client.com/cb#error=access_denied
```

## 移动应用

和基于浏览器的应用类似，移动应用也不能保护Secret的安全，所以也只能走不要求Secret的授权流程。

### 授权

创建一个登陆按钮，把用户要么引导到一个已经安装了的本地应用要么是OAuth服务器提供的一个网页。在iPhone上，应用可以注册一个自定义的URI，比如："facebook://" ，这个URL可以唤起本地安装的Facebook应用。在Android上，可以注册一个URL匹配规则，如果匹配到了就会唤起已经装了的Android应用。

### iPhone

如果用户的手机上已经安装了Facebook应用，引导他们访问下面的URL：

```
fbauth2://authorize?response_type=token&client_id=CLIENT_ID
  &redirect_uri=REDIRECT_URI&scope=email
```

在这个例子中，你的重定向URL类似于 `fb00000000://authorize`，协议的前段是`fb`接下来是ClientId。这意味着你必须在Facebook上注册你的应用才能回调这个URL。

### Android 和其它

如果用户没有在手机上安装Facebook应用或者对于其它没有安装原生应用的设备。可以通过下面的URL在浏览器中发起授权请求

```
https://facebook.com/dialog/oauth?response_type=token
  &client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=email
```

用户会看到下面的页面

 

![img](http://upload-images.jianshu.io/upload_images/653561-95e2032743aff64a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/306)

browser

在点击 “Okay” 之后，会通过下面的URL把用户重定向到你的应用

```
fb00000000://authorize#token=ACCESS_TOKEN
```

你的移动应用可以从URI中解析出AccessToken，并发起API请求。

## 其他

### Password

OAuth2也提供了 “password” 授权类型，可以使用一对用户名/密码交换一个AccessToken。这种授权类型要求应用收集用户名和密码，所以这类应用必须是OAuth服务提供者自己的应用。比如Twitter的原生应用是使用这种方式来登陆移动或者桌面端应用。

使用“password”授权类型，只需要发起一个简单的POST请求

```
POST https://api.oauth2server.com/token
    grant_type=password&
    username=USERNAME&
    password=PASSWORD&
    client_id=CLIENT_ID
```

服务器会返回一个AccessToken，这和其他的授权类型类似。

考虑到大部分基于这种类型的授权都是移动或者桌面应用不够安全，所以Secret没有使用。

### 应用访问

在某些情况下，应用可能希望去更新自己的信息，比如网址、Logo或者用户资料等。在这种情况下，应用需要从自己的账户中或许数据而不是用户。OAuth服务器通过 “client_credentials” 类型来支持这种访问。

发起 “client_credentials” 请求，可以创建如下的POST请求

```
POST https://api.oauth2server.com/token
    grant_type=client_credentials&
    client_id=CLIENT_ID&
    client_secret=CLIENT_SECRET
```

你会得到一个和前面类似的AccessToken。

## 发起已验证的请求

在已经获得AccessToken的情况下可以发起API请求。可以用curl发起一个简单的请求：

```
curl -H "Authorization: Bearer RsT5OjbzRn430zqMLgV3Ia" \
https://api.oauth2server.com/1/me
```

这样就可以了！但是要注意使用HTTPS，并且永远不要忽略非法的证书。HTTPS是唯一可以保证请求不被拦截或者篡改的通道。

## 和OAuth1.0的区别

OAuth1.0大部分是基于Flickr的FlickrAuth和Google的AuthSub这类的私有协议，这代表了基于实施经验的最佳方案。但是经过多年的工作，OAuth社区已经了解了足够的知识来重新思考和改进现有的协议，这体现在三个方面：

### 身份验证和签名

对于开发者来说最大的困惑和不解是OAuth1.0中对于ClientId和Secret的签名。不能简单的复制/粘贴一段示例代码导致开发人员很难快速的踏出第一步。

OAuth2发现这个问题后使用HTTPS来取代签名，这在所有的通信场合包括浏览器、客户端、API。

### 用户体验和可选的授权流程

OAuth包含两个主要的部分，获取一个AccessToken，然后用Token来发起请求。OAuth1.0在桌面浏览器上表现很好，但是在原生的桌面应用和移动应用或游戏/TV设备上体验很差。

对于原生应用来说，OAuth2支持更好的用户体验。并且支持扩展以适应未来的需求。

### 可扩展性

在大型的OAuth提供商使用OAuth1.0的时候，OAuth社区很快意识到这套协议不能很好的扩展。很多步骤依赖于状态管理和临时证书，这要求共享存储并且难于在不同的数据中心同步。OAuth1.0也要求API服务器知晓应用的ClientId和Secret，这会破坏很多大型服务器提供商的应用架构，导致授权服务器和API服务器不能完全分离。

OAuth2支持获取用户授权和发起API请求的分离。

#### 资源
* [OAuth 2 Simplified](https://aaronparecki.com/oauth-2-simplified/)
* Credit: Some content adapted from [hueniverse.com](http://hueniverse.com/).
* More information is available on [OAuth.net](http://oauth.net/)
* [Identity Server 4](http://docs.identityserver.io/en/release/)

> 译注：对于服务器端应用特指纯后端的应用，这类应用不会暴露任何的代码给外部环境，它和OAuth服务器的通信是服务和服务器之间的，所以相对比较安全。基于浏览器的应用现在常见的比如使用AngularJS，React之类的浏览器端渲染技术在浏览器上渲染页面，并通过RESTfulAPI请求数据。以上介绍的所有授权类型都是三方合作的，但是基于“password”的授权类型实际上是自有App的授权方案，这也是现在主流移动App的登陆(身份验证)方案，然而这类App也都会提供使用“微信”、“微博”登陆的方案，而后者就是本文所述的OAuth。

