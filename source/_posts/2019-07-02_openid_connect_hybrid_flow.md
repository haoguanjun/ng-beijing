---
date: 2019-07-02
title: 理解 OpenID Connect Hybrid 模式
categories: oauth
---
本文详细介绍了 hybrid 工作的细节。
<!-- more -->

# OpenID Connect Hybrid Flow


## 为什么我们需要 hybrid flow?

在回答这个问题之前，我们需要回顾一下 OpenID Connect 中基本的授权码模式和简化模式。

在基本模式中，授权码通过前端通道返回，而 `client id` 和 `client secret` 在验证过程中是必须的。然后，通过 `token` 端点发布访问令牌，通过后台通道返回客户端使用。

在简化模式中，在 `authorize` 端点生成访问令牌，不需要 `client secret` 用于客户端验证。整个过程通过前端通道完成。

下面的表格对比了两种授权模式。

| 授权码模式 Authorization Code                                | 简化模式 Implicit                      |
| ------------------------------------------------------------ | -------------------------------------- |
| 对于客户端而言，可以安全地在客户端和授权服务器之间保护 `client scret` | 用于使用脚本语言在浏览器中实现的客户端 |
| 服务器端实现                                                 | 单页应用                               |

更详细的内容可以参考我以前的博客，在那里我提供了一些关于 OpenID Connect 的初步想法。

如果我们希望将令牌从前端通道和后台通道拆分开呢？解决方案就是 hybrid 模式。

在 hybrid 模式，我们可以请求组合的 `code`、`id_token` 和 `token`。这里是定义在 [OIDC specification](http://openid.net/specs/openid-connect-core-1_0.html) 中的三种组合：

1. response type = `code` + ` token`
2. response type = `code` +  `id_token`
3. response type = `code` +  `id_token` +  `token`

> 注：`code` 指授权码 (authorization code)，`token` 指访问令牌 (access token)，`id_token` 指 ID 令牌 (id token)。
>
> 该模式基于授权码模式，所以在三种组合中，都会出现 `code`。

下面让我们逐个分析它们。

## Code + Token

在这种响应类型中，我们从 `authorization` 端点请求 `code` 和 `access token` 。

例如下面的授权请求：

> https://localhost:9443/oauth2/authorize?response_type=code token&client_id=<Client ID>&nonce=asd&redirect_uri=http://localhost:8080/playground2/oauth2client&scope=openid

> 注意：访问的端点是 `/oauth2/authorize`，`response type` 为 `code` 和 `token`。

> `nonce` 表示一次性的验证码。 

成功的授权响应示例如下：

> http://localhost:8080/playground2/oauth2client#access_token=1940a308-d492-3660-a9f8-46723cc582e9&code=99b34587-5483-374d-8b25-50485498e761&token_type=Bearer&expires_in=299999&session_state=baae9a71cdabe38b4643b9d59bd9f65ffaf5a9b8c453f4256c085e5a1c57e624.-EA3ZqPzLvsk25CKmt56YA

通过将 `code` 发送到 `token` 端点，我们可以请求 `access token`、`refresh token` 和 `id token`。

下面是用来通过 `token` 端点请求令牌的 curl 命令

> curl -k -v — user <Client ID>:<Client secret> -d “grant_type=authorization_code&code=99b34587–5483–374d-8b25–50485498e761&redirect_uri=http://localhost:8080/playground2/oauth2client" https://localhost:9443/oauth2/token

这里是从 `token` 端点返回的响应内容。

> {“access_token”:”1940a308-d492–3660-a9f8–46723cc582e9",”refresh_token”:”6b96cc3a-00da-3d7d-acd1–5aaf76dcd9d4",”scope”:”openid”,”id_token”:”eyJ4NXQiOiJOVEF4Wm1NeE5ETXlaRGczTVRVMVpHTTBNekV6T0RKaFpXSTRORE5sWkRVMU9HRmtOakZpTVEiLCJraWQiOiJOVEF4Wm1NeE5ETXlaRGczTVRVMVpHTTBNekV6T0RKaFpXSTRORE5sWkRVMU9HRmtOakZpTVEiLCJhbGciOiJSUzI1NiJ9.eyJhdF9oYXNoIjoiSnJaWTlNdFlWRUlJSlV4LUREQm13dyIsInN1YiI6ImFkbWluIiwiYXVkIjpbIm5jemJnNW01eHh0NnRQNFVNWndCNlB0UW9Rb2EiXSwiYXpwIjoibmN6Ymc1bTV4eHQ2dFA0VU1ad0I2UHRRb1FvYSIsImlzcyI6Imh0dHBzOlwvXC9sb2NhbGhvc3Q6OTQ0M1wvb2F1dGgyXC90b2tlbiIsImV4cCI6MTUxMDgzMTAxMCwibm9uY2UiOiJhc2QiLCJpYXQiOjE1MTA4MzEwMDd9.XKV0ioEvflR4MHGthO3cwXwC88msNgqR4l1O83mfhxOMtO1PG3ABWB5E4aFXFpR9t-8zJs09slhLsDTDhmC33KE8Die61UK9_Vb5aNA4XCkawyJt8dCX6clc6UUbTEO5N1ubXA18QFgwAEWpvoTz1hKx8XLnvOSehbdEKsoPunoHDmXpYJe_9hBg5V3kN-VHxdKdGOtl9u-Aml42s5p45cZY0mlFVcKjatBAf7hqWNPlUebyujDWG1Iyk_-AXNQ2wYi0F77uG7_HstP_tp0sOctu0TYCK8bwBTXEJYMPt1CqOqcae05m8N8hb0zs6Yxvyx_udCJPG-8n2zRB-T-kcg”,”token_type”:”Bearer”,”expires_in”:299494}

将 `id_token` 解码之后，我们可以得到如下结果：

```javascript
{
 	“at_hash”: “JrZY9MtYVEIIJUx-DDBmww”,
 	“sub”: “admin”,
 	“aud”: [
 		“nczbg5m5xxt6tP4UMZwB6PtQoQoa”
 	],
 	“azp”: “nczbg5m5xxt6tP4UMZwB6PtQoQoa”,
 	“iss”: “https://localhost:9443/oauth2/token",
 	“exp”: 1510831010,
 	“nonce”: “asd”,
 	“iat”: 1510831007
}
```

在两个访问令牌 (`access token`) 发布的时候，还完成了一些校验工作。在此场景下，`access token` 通过 `authorize` 端点颁发，其它的令牌通过 `token` 端点颁发。这两个访问令牌可能相同，也可能不同。

## Code  + ID_Token

在这种响应类型中，我们通过 `authorize` 端点请求访问令牌 `access token` 和 `id_token`。

示例的授权请求

> https://localhost:9443/oauth2/authorize?response_type=code id_token&client_id=<Client ID>&nonce=asd&redirect_uri=http://localhost:8080/playground2/oauth2client&scope=openid

示例的响应内容

> http://localhost:8080/playground2/oauth2client?code=16fd899f-5f0c-3114-875e-2547b629cd05&id_token=eyJ4NXQiOiJOVEF4Wm1NeE5ETXlaRGczTVRVMVpHTTBNekV6T0RKaFpXSTRORE5sWkRVMU9HRmtOakZpTVEiLCJraWQiOiJOVEF4Wm1NeE5ETXlaRGczTVRVMVpHTTBNekV6T0RKaFpXSTRORE5sWkRVMU9HRmtOakZpTVEiLCJhbGciOiJSUzI1NiJ9.eyJhdF9oYXNoIjoiSnJaWTlNdFlWRUlJSlV4LUREQm13dyIsImNfaGFzaCI6IlM1VU9YUk5OeVlzSTZaMEczeHhkcHciLCJzdWIiOiJhZG1pbiIsImF1ZCI6WyJuY3piZzVtNXh4dDZ0UDRVTVp3QjZQdFFvUW9hIl0sImF6cCI6Im5jemJnNW01eHh0NnRQNFVNWndCNlB0UW9Rb2EiLCJpc3MiOiJodHRwczpcL1wvbG9jYWxob3N0Ojk0NDNcL29hdXRoMlwvdG9rZW4iLCJleHAiOjE1MTA4MzE1MTIsIm5vbmNlIjoiYXNkIiwiaWF0IjoxNTEwODMxNTA4fQ.BsiXZwP_EFnNH-5r01z4P18OZbVY1WHOD1GSTrDa4-TxcSEuMOlvIQA54Poy0hUS8RCP46XB-WhUaOHQpvsHBj6CUCkNWAqJj5F-TetXUhONhnI0Hp7K3zofa_E5-ucFmUoKVwk-wFAMakKziIsX9P8v9-mi2kPlQPDyS3i7tkRlABS5emgbOSHxNsoKjdaglLT78zdARMFfF0i0oaDyRv9nfZIgSZJE1Qec99DA7engA43NJQCB1vMjF9Qruefyyjtq2abaLLRG6Yh6NeWDyIXkjjbHEcKxzBsKU6VqL84DqHHYFUwZ1nL2aLon1kHXUHgGfuhuBJ5qIwEtbZrQLw#session_state=d96bad64e37e82196898a824082aafbdd945c922e7d40cb4e0013d9fad6d68c8.o0_m4GJ1YJvNUUqg8k3LrQ

解码之后的 `id token` 如下所示：

```javascript
{
 	“at_hash”: “JrZY9MtYVEIIJUx-DDBmww”,
 	“c_hash”: “S5UOXRNNyYsI6Z0G3xxdpw”,
 	“sub”: “admin”,
 	“aud”: [
 		“nczbg5m5xxt6tP4UMZwB6PtQoQoa”
 	],
 	“azp”: “nczbg5m5xxt6tP4UMZwB6PtQoQoa”,
 	“iss”: “https://localhost:9443/oauth2/token",
 	“exp”: 1510831512,
 	“nonce”: “asd”,
 	“iat”: 1510831508
}
```

关于该 `id token` 很重要的一点就是，他要求有一个 **c_hash** 值。那么什么是 c_hash 呢？

c_hash 是 [ASCII 表示法的八位字节的最左侧最左侧的一半,其中使用的哈希算法是 ID 令牌的 JOSE 标头的 alg 标头参数中使用的哈希算法](http://openid.net/specs/openid-connect-core-1_0.html)。

在通过授权码颁发 `id_token` 的时候，c_hash 值是强制的，不管响应类型是 `code`  和`id_token` ，还是 `code` 、`id_token` 和 `token`。

通过将 `code` 发送到 `token` 端点，我们可以请求访问令牌 `access token`，`refresh token` 和 `id_token`。可以使用与前面相同的 curl 命令，下面是从 `token` 端点返回的内容：

> {“access_token”:”1940a308-d492–3660-a9f8–46723cc582e9",”refresh_token”:”6b96cc3a-00da-3d7d-acd1–5aaf76dcd9d4",”scope”:”openid”,”id_token”:”eyJ4NXQiOiJOVEF4Wm1NeE5ETXlaRGczTVRVMVpHTTBNekV6T0RKaFpXSTRORE5sWkRVMU9HRmtOakZpTVEiLCJraWQiOiJOVEF4Wm1NeE5ETXlaRGczTVRVMVpHTTBNekV6T0RKaFpXSTRORE5sWkRVMU9HRmtOakZpTVEiLCJhbGciOiJSUzI1NiJ9.eyJhdF9oYXNoIjoiSnJaWTlNdFlWRUlJSlV4LUREQm13dyIsInN1YiI6ImFkbWluIiwiYXVkIjpbIm5jemJnNW01eHh0NnRQNFVNWndCNlB0UW9Rb2EiXSwiYXpwIjoibmN6Ymc1bTV4eHQ2dFA0VU1ad0I2UHRRb1FvYSIsImlzcyI6Imh0dHBzOlwvXC9sb2NhbGhvc3Q6OTQ0M1wvb2F1dGgyXC90b2tlbiIsImV4cCI6MTUxMDgzMjI3MSwibm9uY2UiOiJhc2QiLCJpYXQiOjE1MTA4MzIyNjd9.jAGLp8FFdIyFi4ZmvRPX9hVu8NbLVL2iM1895UNrS7wqgl2PCi7zHnvBoOYkbsxxMYGoVepFNzz7hHbk-kuzq_kBoBsZK2Ucbv0hUkwiEkigLy6hpGm-mqXjai3cjlJevWOVcZbMhkEyRlsZtdUG0RCzteT7emAuZLFm5zfMpq1h5JsVRGjK_6fQbHhB2Svkl_kV_ctAD8_kymASGEjRGnwGW5np4uBI0NPYMDTvrl8N9i6yfUVD9-y7rL9Gtrq9hK28Swj5Szvv_c1IX8wYBP-p8gu2cBpGIulIq-OkbfCUh-rrbh96relOaKwKwk0g7nST6o6wZTAwaicNQBYHYw”,”token_type”:”Bearer”,”expires_in”:298234}

解码之后的 `id token` 如下所示：

```javascript
{
 	“at_hash”: “JrZY9MtYVEIIJUx-DDBmww”,
 	“sub”: “admin”,
 	“aud”: [
 		“nczbg5m5xxt6tP4UMZwB6PtQoQoa”
 	],
 	“azp”: “nczbg5m5xxt6tP4UMZwB6PtQoQoa”,
 	“iss”: “https://localhost:9443/oauth2/token",
 	“exp”: 1510832271,
 	“nonce”: “asd”,
 	“iat”: 1510832267
}
```

在颁发这两个 `id token` 的时候，有一些检验必须完成。在这种场景下，一个 `id token` 由 `authhorize` 端点颁发，另一个由 `token` 端点颁发。下面是规范中定义的一些检验：

1. 两个令牌中的 `iss` 和 `sub` 值必须相同。
2. 如果任何一个 `id token` 中包含关于终端用户的声明，两个令牌中提供的值必须相同。
3. 关于验证事件的声明必须都提供。
4. `at_hash` 和 `c_hash` 声明可能会从 `token` 端点返回的令牌中忽略，即使从 `authorize` 端点返回的令牌中已经声明。

## Code + ID_Token + Token

该响应类型中，我们从 `authorize` 端点请求 `code` 、`access token` 和 `id_token`。

示例的授权请求如下：

> https://localhost:9443/oauth2/authorize?response_type=code id_token token&client_id=<Client ID>&nonce=asd&redirect_uri=http://localhost:8080/playground2/oauth2client&scope=openid

成功的授权响应如下：

> http://localhost:8080/playground2/oauth2client#access_token=1940a308-d492-3660-a9f8-46723cc582e9&code=55aa698d-ac3b-30ec-b4ca-f5e803590a4b&id_token=eyJ4NXQiOiJOVEF4Wm1NeE5ETXlaRGczTVRVMVpHTTBNekV6T0RKaFpXSTRORE5sWkRVMU9HRmtOakZpTVEiLCJraWQiOiJOVEF4Wm1NeE5ETXlaRGczTVRVMVpHTTBNekV6T0RKaFpXSTRORE5sWkRVMU9HRmtOakZpTVEiLCJhbGciOiJSUzI1NiJ9.eyJhdF9oYXNoIjoiSnJaWTlNdFlWRUlJSlV4LUREQm13dyIsImNfaGFzaCI6IlhDUnVTMmhFT0JfM0hkeG9FM0pxT2ciLCJzdWIiOiJhZG1pbiIsImF1ZCI6WyJuY3piZzVtNXh4dDZ0UDRVTVp3QjZQdFFvUW9hIl0sImF6cCI6Im5jemJnNW01eHh0NnRQNFVNWndCNlB0UW9Rb2EiLCJpc3MiOiJodHRwczpcL1wvbG9jYWxob3N0Ojk0NDNcL29hdXRoMlwvdG9rZW4iLCJleHAiOjE1MTA4MzMxNjQsIm5vbmNlIjoiYXNkIiwiaWF0IjoxNTEwODMzMTYwfQ.WgpDf07dDVqrJRBbe_EqLYAfuRQQ1GkBJzgxaIczLTU_e-HasS6e24l75P0Csv0i2gUXk_H9d8zyJ6zalp2geBUmJ1wXLJtELrp-wvVaHVj-_aLHXM_8bsjL-BTj_f-OUEpGiDsPh19GxcMWw6hOubM0JKMh6ZWbF_A7-7RWwlh3vvRSjHhzhWypfjfP1NGTByjICJWF31AbGgfBy7OUUDhOIURYZM0m5u0fmvvD4O8qah1zjTxUL6mLaalOZ7QNppPU7SmPgeSQnfNsxy5KCA_N1vYyNLxzs3NitcCZAOQ88XU2AF-W4Sykay0tp1qiI35mqHg2cYinNPEdrnCYyQ&token_type=Bearer&expires_in=297341&session_state=872ac70304690624d4b3e2c705b5f452043be5f758ddd2487aa193730d9ef809.IwoAA6ua4m5CRth0erWuxA

解码之后的 `id_token` 如下所示：

```javascript
{
	“at_hash”: “JrZY9MtYVEIIJUx-DDBmww”,
	“c_hash”: “XCRuS2hEOB_3HdxoE3JqOg”,
	“sub”: “admin”,
	“aud”: [
		“nczbg5m5xxt6tP4UMZwB6PtQoQoa”
	],
	“azp”: “nczbg5m5xxt6tP4UMZwB6PtQoQoa”,
	“iss”: “https://localhost:9443/oauth2/token",
	“exp”: 1510833164,
	“nonce”: “asd”,
	“iat”: 1510833160
}
```

通过将授权码 `code` 发送到 `token` 端点，可以请求 `access token`、`refresh token` 和 `id_token`。可以继续使用前面的 curl 命令，下面是从 `token` 端点返回的内容：

> {“access_token”:”1940a308-d492–3660-a9f8–46723cc582e9",”refresh_token”:”6b96cc3a-00da-3d7d-acd1–5aaf76dcd9d4",”scope”:”openid”,”id_token”:”eyJ4NXQiOiJOVEF4Wm1NeE5ETXlaRGczTVRVMVpHTTBNekV6T0RKaFpXSTRORE5sWkRVMU9HRmtOakZpTVEiLCJraWQiOiJOVEF4Wm1NeE5ETXlaRGczTVRVMVpHTTBNekV6T0RKaFpXSTRORE5sWkRVMU9HRmtOakZpTVEiLCJhbGciOiJSUzI1NiJ9.eyJhdF9oYXNoIjoiSnJaWTlNdFlWRUlJSlV4LUREQm13dyIsInN1YiI6ImFkbWluIiwiYXVkIjpbIm5jemJnNW01eHh0NnRQNFVNWndCNlB0UW9Rb2EiXSwiYXpwIjoibmN6Ymc1bTV4eHQ2dFA0VU1ad0I2UHRRb1FvYSIsImlzcyI6Imh0dHBzOlwvXC9sb2NhbGhvc3Q6OTQ0M1wvb2F1dGgyXC90b2tlbiIsImV4cCI6MTUxMDgzMzMwNywibm9uY2UiOiJhc2QiLCJpYXQiOjE1MTA4MzMzMDN9.k69ufNIJHJHb6foeRSMVoJsgAWz0q65_8R6Lhz-tIW-tdLDI7eNg3kSL5-S2T3uFn7XFvn113wEWvCS8X3JBCIPMAFCmGBCR_L5pCh_OO6_xQeZyfa0fx_R27kZ9EIW5u0WSSjlpzzvr_50YldCfXMhZASjZlA5sCZ9BReyhkEUW_kSCWUDJEPaFQqgKVNfnRmr1q4N2lJwXPHjjE-4BcTMxKY87mqFzq_HVdXc1SRVIG0iuWkiYaD34pK8ZI12GFGSmOpDzhYb06uxrR8GC4jpq_WHMvMKrPrLaoVkEFaqomgxLIOJaNZJzqpe3wlaWM952eTndpSW0HSR5kgZgmw”,”token_type”:”Bearer”,”expires_in”:297198}

检验与其它的类型相同。

我想你已经理解了 hybrid 模式以及它是如何工作的。


## See Also:

* [OpenID Connect Hybrid Flow ](https://medium.com/@hasiniwitharana/openid-connect-hybrid-flow-1123bc9461fe)
