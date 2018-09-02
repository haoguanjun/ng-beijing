---
title: 第 5 章 客户端凭据流程
date: 2018-09-02
categories: oauth
---
多数的 OAuth 流用于处理授权委托，当资源的拥有着授权应用程序访问其数据的时候。但是，还有一种情况是，客户端本身拥有数据，而并不需要从资源拥有者委托，或委派访问已经授予应用程序外部的典型 OAuth 流。
<!-- more -->
## 第 5 章 客户端凭据流

多数的 OAuth 流用于处理授权委托，当资源的拥有着授权应用程序访问其数据的时候。但是，还有一种情况是，客户端本身拥有数据，而并不需要从资源拥有者委托，或委派访问已经授予应用程序外部的典型 OAuth 流。
该方式类似于 OAuth 1.0 中"双腿流程"。
![](https://image.slidesharecdn.com/oauth2-0-121105042359-phpapp02/95/oauth20-26-638.jpg?cb=1361524294)

### 何时应当使用客户端凭据流
想象有一个存储的 API，例如 Goolge 的存储或者 Amazon 的 S3。你构建了一个拥有某些资源 (数据、图片等等)的应用程序，使用这些 API 在应用程序之外存储这些资源。应用程序需要读取或者更新这些资源，但是，这由应用程序本身代理而不是某个独立的用户。这就是典型的客户端凭据流的场景。应用程序可以直接向 OAuth 授权服务器请求访问码，而不需要引入任何的终端用户。
还有另一种客户端凭据流的场景，当资源的拥有者授权应用程序在外部访问其资源，而不使用典型的 OAuth 流的时候。Google 在 Google 的应用市场中提供了实际的用例。当应用程序在应用市场被列出的时候，供应商获取表示其应用程序的凭据，同时注册他们需要访问的数据 **scope**。当应用程序被某个组织的 IT 管理员最终安装的时候，Google 询问该管理员是否授权给该应用程序访问其组织的数据。在访问被授权之后，Google 存储该应用程序 “Task Manager Pro”  被组织被权访问 "Google Calendar 和 Google Contacts"。Google 不会颁发任何令牌给应用程序。未来应用程序访问数据的时候，Google 简单地查询该应用程序是否允许访问特定组织的数据。

### 什么 API 支持客户端凭据流？
虽然前面的描述介绍了该流程的潜在场景，但是，这些提供者 (Google 和 Amazon) 并没有实现 OAuth 2.0 中的客户端凭据流。然而，为执行应用的登录，Facebook 在其应用中实现了该流。应用登录是某些特定的 Facebook API 调用所必须的，包括从应用程序洞察服务中获取应用程序统计信息和用户弹出数据的能力。

### 客户端是如何验证的？
该流程依赖于客户端能够通过授权服务器正确地验证，并且客户端的身份凭据仍然保密。为了进行身份验证，客户端可以将 **client_id** 和 **client_secret** 作为访问令牌请求中 POST 参数传递给授权服务器，也可以使用 HTTP 基本身份验证头。授权服务器还可以使用其它机制 ( 例如公钥/私钥对、SSL/TLS 客户端身份验证等 ) 对客户端进行身份验证。

### 安全特性
根据客户端凭据流程所使用的精细场景，单个的客户端凭据集可以提供对大量数据的访问。一组凭据可以访问的数据越多，如果凭据受到破坏，风险就会越大。非常重要的是, 用于验证客户端身份的凭据保持高度机密性。理想情况下, 这些凭据也将定期轮换。

### 演练
为了演练该流程，我们使用 Facebook 应用洞察服务的应用登录实现。

#### 第一步 使用应用程序的凭据交换访问令牌
应用程序需要通过授权服务器请求访问令牌，授权请求使用客户端的凭据。

你可以在 API 提供这的文档中找到授权服务的令牌 API。对 Facebook 而言，该 URL 是：

```
https://graph.facebook.com/oauth/access_token
```

这是必需的 POST 参数：

* **grant_type**
  使用  “client_credentials” 用于该流程
* **client_id**
  在注册应用的时候提供给你的值
* **client_secret**
  在注册应用的时候提供给你的值

这是通过 curl 命令行工具的一个示例

```
curl -d "grant_type=client_credentials\
   &client_id=2016271111111117128396\
   &client_secret=904b98aaaaaaac1c92381d2" \
   https://graph.facebook.com/oauth/access_token
```

如果客户端的凭据被成功验证，访问令牌将返回到客户端。在本书写作的时候，Facebook 已经实现了 OAuth 2.0 规范的早期版本，它在响应的 body 内返回使用 url-encoding 的 **access_token** ：

```
access_token=2016271111111117128396|8VG0riNauEzttXkUXBtUbw
```

规范的最新草案 v22 声明授权服务器应当返回一个 **application/json** 的响应，其中包含 **access_token**：

```javascript
{
   "access_token":"2016271111111117128396|8VG0riNauEzttXkUXBtUbw"
}
```

然后，应用程序就可以使用 **access_token** 代替应用程序访问 API。

#### 第二步 调用 API
由于通过客户端凭据颁发的访问令牌是一个类似其它流程提供的令牌的持票者令牌 (bearer token)，它也可以被以类似的方式使用。你可以简单地通过提供 HTTP **Authorization** 头，或者请求参数值，基于 API 支持的何种方式。

这是使用 curl 的示例，使用请求参数来传递访问令牌：

```
curl "https://graph.facebook.com/202627763128396/insights?\
   access_token=2016271111111117128396|8VG0riNauEzttXkUXBtUbw"
```

Facebook 也支持通过 HTTP **Authorization** 头方式传递访问令牌，但是，使用了老式的 **Authorization: OAuth _tokenvalue_** 而不是 **Authorization: Bearer _tokenvalue_**。

### 访问令牌何时过期？
客户端凭据流程典型使用长寿命的访问令牌。授权服务器可能提示一个 **expires_in** 时间，但是，协议并不支持在响应中颁发刷新的令牌。相反，在当前令牌过期的时候，应用程序简单地请求新的访问令牌。

### See also
* [Client Credentials](https://www.oauth.com/oauth2-servers/access-tokens/client-credentials/)
