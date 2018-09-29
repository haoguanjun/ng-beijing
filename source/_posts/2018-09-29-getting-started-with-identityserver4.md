---
title: IdentityServer 4 入门
date: 2018-09-29
categories: oauth
tages: [oauth]
---
Identity Server 4 是 IdentityServer 的新迭代版本，流行的 OpenID Connect 和 OAuth 框架的 .NET 版本实现，针对 ASP.NET Core 和 .NET Core 进行了重新设计和更新。在本文中，我们将快速浏览为什么 IdentityServr 4 会存在，然后适当深入并从头开始创建一个我们自己的可以使用的实现。
<!-- more -->
# IdentityServer 4 入门

Identity Server 4 是 IdentityServer 的新迭代版本，流行的 OpenID Connect 和 OAuth 框架的 .NET 版本实现，针对 ASP.NET Core 和 .NET Core 进行了重新设计和更新。在本文中，我们将快速浏览为什么 IdentityServr 4 会存在，然后适当深入并从头开始创建一个我们自己的可以使用的实现。

## IdentityServer 3 与 IdentityServer 4

![](https://www.scottbrady91.com/img/identityserver-logo.jpg) 有一句流行的话说 “概念兼容”，但对 Identity Server 4 来说是真的。概念是相同的，还是 OpenID Connect 供应商的规范实现，但是，许多的内部构成和扩展点发生了变化。当我们对我们的客户端应用集成 IdenttityServer 的时候，我们不再是集成一种实现，而是使用 OpenID Connect 或者 OAuth 规范集成。这意味着任何当前使用 IdentityServer 3 的应用程序将可以与 IdentityServer 4 协作。

Identity Server 的设计是作为自托管组件运行的，很难在仍然紧密耦合到 IIS 和 System.Web 的使用 MVC 的 ASP.NET 4.x 上实现，导致使用 Katana 组件支持的内部视图引擎。由于 IdentityServer 4 运行在 ASP.NET Core 上，我们现在可以使用任何 UI 技术，并且托管在任何 ASP.NET Core 可以运行的环境上。这还意味着我们现在可以集成现有的登录窗体/系统，支持就地升级。

Identity Server 中用于集成你的用户存储的 IUserService 也取消了，代之以新的用户存储抽象：`IProfileService` 和 `IResourceOwnerPasswordValidator`。

IdentityServer 3 没有完全取代，因为 .NET Framework 不会完全被取代。因为 Microsoft 将大多数的开发转移到了 .NET Core (见 [Katana](https://katanaproject.codeplex.com/wikipage?title=roadmap) 和 [ASP.NET Identity](https://aspnetidentity.codeplex.com/))，我认为 IdentityServer 也将会做同样的演进，但是我们现在在讨论 OSS，希望这个项目永远保持开放 Bug 修改和相关新功能的 PR。我个人不希望它在任何时候被放弃，并希望商业支持能够继续。

IdentityServer4 的目标是 .NET Standard 2.0，意味着它既可以支持 .NET Core 也支持 .NET Framework，尽管本文仅仅考虑 .NET Core，IdentityServer 4 现在 [supports .NET Core 2.0](https://leastprivilege.com/2017/10/06/identityserver4-v2/)。

## 在 ASP.NET Core 和 .NET Core 上实现 IdentityServer4

对于我们的初始实现，我们将使用用于演示和轻量实现的内存中的服务。在本文的最后，我们将切换到 Entity Framework 来支持更实际的产品级别的 IdentityServer。

在开始之前，请确保你使用了最新版本的 ASP.NET Core 和 .NET Core 工具。我使用 .NET Core 2.0 和 Visual Studio 2017 创建该教程。

我们需要从新的使用 .NET Core 的 ASP.NET Core 项目开始。我们使用不带验证的空项目模板。确保你的项目使用 .NET Core 和 ASP.NET Core 2.0。

在开始编码之前，将项目的 URL 切换到 HTTPS。没有不适用 TLS 的运行验证服务的场景。假设你在使用 IIS Express，可以通过开发项目的属性，进入 Debug 窗格，点击 `Enable SSL`，此刻，你应当可以生成 HTTPS 的 URL，这样在运行应用的时候，我们可以保持一致。

我们需要先安装下述的 nuget Package。

> IdentityServer4

现在，我们可以在 `Startup` 类中注册依赖和配置服务。

在 `ConfigureServices` 方法中添加下列的内容来注册最小必须的依赖。

```csharp
services.AddIdentityServer()
    .AddInMemoryClients(new List<Client>())                       // 客户端应用程序
    .AddInMemoryIdentityResources(new List<IdentityResource>())   // Identity 资源
    .AddInMemoryApiResources(new List<ApiResource>())             // API 资源
    .AddTestUsers(new List<TestUser>())                           // 用户
    .AddDeveloperSigningCredential();                             // 自签名
```

然后，在 `Configure` 方法中添加下述代码以在 HTTP 管道中添加 IdentityServer 中间件。

```csharp
app.UseIdentityServer();
```

这里我们所做的是在我们的 DI 容器中使用 `AddIdentityServer` 注册 IdentityServer ，使用 `AddDeveloperSigningCredential` 演示用的签名，对客户端应用、资源和用户使用内存中的仓库。通过调用 `AddIdentityServer` 将生成的令牌/授权存储到内存中。很快我们将添加实际的客户端，资源和用户。

`UseIdentityServer` 使得 IdentitySerer 开始拦截路由和处理请求。

我们已经可以实际运行 IdentityServer 了，它没有界面，没有支持任何的 Scope，并且没有用户，但是，你已经可以开始使用它了！访问 OpenID Connect 的端点 `/.will-known/openid-configuration` 来查看Discovery Document 。

## OpenID Connect Discovery Document

OpenID Connect Discovery Document  (也被称为 disco 文档) 作为众所周知的端点 (作为规范的一部分) 存在于任何 OpenID Connect  供应商上。该文档包含诸如众多端点 (例如：token 端点和结束会话端点) 的地址 ，供应商支持的授权类型，它提供的 Scope，以及其它。通过该标准文档，我们打开了自动集成的可能性。

## 签字证书

签字证书是专用于签署令牌的专用证书，客户端应用程序用于验证令牌的内容没有在传输中被修改。这引入了一个用于签署令牌的私有密钥，和一个验证签名的公钥。公钥可以被客户端应用程序通过 OpenID Connect discovery document 中的 `jwks_uri` 访问。

当你创建和使用你自己的签名证书的时候，请摔死自签名证书。该证书不需要由可信的证书颁发机构颁发。

现在我们已经可以运行 IdentityServer ，让我们添加一点数据。

## 客户端应用，资源和用户

首先，我们需要一个可以使用 IdentityServer 的客户端应用程序的存储，对客户端应用使用的资源，以及允许验证的用户也同样处理。

我们现在使用内存中的存储，这些存储接收他们所支持的实体，现在我们可以使用一些静态方法来填充。

### 客户端

IdentitServer 需要知道客户端应用程序被允许使用什么内容。我把它看成白名单，你的控制列表。每个客户端应用程序被配置为仅支持特定的事物，例如，可以仅仅请求返回请求的令牌到特定的 URL，或者仅能请求特定信息，他们拥有受限的访问。

```csharp
internal class Clients {
	public static IEnumerable<Client> Get() {
		return new List<Client> {
            new Client {
                ClientId = "oauthClient",
                ClientName = "Example Client Credentials Client Application",
                AllowedGrantTypes = GrantTypes.ClientCredentials,
                ClientSecrets = new List<Secret> {
                    new Secret("superSecretPassword".Sha256())},                         
                AllowedScopes = new List<string> {"customAPI.read"}
            }
        };
    }
}
```

这里我们添加一个使用客户端平局的 OAuth 授权类型。该授权类型要求一个客户端 ID 和客户端密钥进行授权访问，该密钥被由 Identity Server 提供的扩展方法简单进行了散列 (最后我们不会以明文存储任何口令，这比没有要好)。支持的 Scope 是一个客户端授权请求的 Scope 列表。这里我们的 Scope 是 `customAPI.read`，我们将在 API 资源中初始化。

### 资源 & Scopes

Scopes 表示你被允许做什么。它们表示我前面提到的受限访问。 IdentityServer 4 的 Scopes 如资源一样被建模，它包含两种类型：Identity 和 API。Identity 资源允许你建模 Scope ，它将返回特定的声明列表，同时，API 资源的 Scope 允许你建模访问受到保护的资源 (典型如 API)。

```csharp
internal class Resources {
    public static IEnumerable<IdentityResource> GetIdentityResources() {
        return new List<IdentityResource> {
            new IdentityResources.OpenId(),
            new IdentityResources.Profile(),
            new IdentityResources.Email(),
            new IdentityResource {
                Name = "role",
                UserClaims = new List<string> {"role"}
            }
        };
    }

    public static IEnumerable<ApiResource> GetApiResources() {
        return new List<ApiResource> {
            new ApiResource {
                Name = "customAPI",
                DisplayName = "Custom API",
                Description = "Custom API Access",
                UserClaims = new List<string> {"role"},
                ApiSecrets = new List<Secret> {new Secret("scopeSecret".Sha256())},
                Scopes = new List<Scope> {
                    new Scope("customAPI.read"),
                    new Scope("customAPI.write")
                }
            }
        };
    }
}
```

#### Identity 资源

前面三个 Identity 资源表示一些我们希望 IdentityServer 支持的标准的 OpenID Connect 定义 Scopes，例如：`email` scope 允许 `email` 和 `email_verified` 声明返回，我们还定义了一个自定义的 Identity 资源，名为 `role` 返回验证用户的 `role` 声明。

简明提示，在使用 OpenID Connect 流程的时候，`openid` scope 是必须的。你可以在 [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.html#ScopeClaims) 中找到更多信息。

#### API 资源

对于 API 资源，我们建模了单个希望保护的 API ，名为 `customApi`。该 API 有两个 scopes 可以被请求：`customAPI.read` 和 `customAPI.write`。

通过这样在 scope 中设置声明，我们可以确保这些声明将被添加到拥有这些 Scope 的令牌中 (如果用户拥有该类型的值，当然)。这样我们可以确保用户的 role 声明将被添加到使用该 scope 的令牌中。scope 的密钥将在随后的令牌反省中使用。

### 用户

在完全成熟的用户存储如 ASP.NET Identity 之前，我们使用 TestUser:

```csharp
internal class Users {
    public static List<TestUser> Get() {
        return new List<TestUser> {
            new TestUser {
                SubjectId = "5BE86359-073C-434B-AD2D-A3932222DABE",
                Username = "scott",
                Password = "password",
                Claims = new List<Claim> {
                    new Claim(JwtClaimTypes.Email, "scott@scottbrady91.com"),
                    new Claim(JwtClaimTypes.Role, "admin")
                }
            }
        };
    }
}
```

用户对象 (或者 sub) 声明是其唯一标识。这应该对你的 Identity 供应商是某种唯一的，不是类似电子邮件地址。我在 [recent vulnerability with Azure AD](http://www.thread-safe.com/2016/05/azure-ad-security-issue.html) 中指出。

我们现在需要使用这些信息更新我们的 DI 容器 (代替前面的空集合)。

```csharp
services.AddIdentityServer()
    .AddInMemoryClients(Clients.Get())                         
    .AddInMemoryIdentityResources(Resources.GetIdentityResources())
    .AddInMemoryApiResources(Resources.GetApiResources())
    .AddTestUsers(Users.Get())                     
    .AddDeveloperSigningCredential();
```

如果运行应用，并再次访问 discovery document ，你现在可以看到 `scopes_supported` 和 `claims_supported` 被填充了。

## OAuth 功能

为了测试我们的实现，我们可以使用前面的 OAuth 客户端来获取访问令牌。这使用客户端凭据流程，所以我们的请求如下所示：

>```
>POST /connect/token
>Headers:
>Content-Type: application/x-www-form-urlencoded
>Body:
>grant_type=client_credentials&scope=customAPI.read&client_id=oauthClient&client_secret=superSecretPassword
>```

这将以 JWT 形式返回我们的访问令牌

>```json
>"access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE0M2U4MjljMmI1NzQ4OTk2OTc1M2JhNGY4MjA1OTc5ZGYwZGE5ODhjNjQwY2ZmYTVmMWY0ZWRhMWI2ZTZhYTQiLCJ0eXAiOiJKV1QifQ.eyJuYmYiOjE0ODE0NTE5MDMsImV4cCI6MTQ4MTQ1NTUwMywiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NDQzNTAiLCJhdWQiOlsiaHR0cHM6Ly9sb2NhbGhvc3Q6NDQzNTAvcmVzb3VyY2VzIiwiY3VzdG9tQVBJIl0sImNsaWVudF9pZCI6Im9hdXRoQ2xpZW50Iiwic2NvcGUiOlsiY3VzdG9tQVBJLnJlYWQiXX0.D50LeW9265IH695FlykBiWVkKDj-Gjiv-8q-YJl9qV3_jLkTFVeHUaCDuPfe1vd_XVxmx_CwIwmIGPXftKtEcjMiA5WvFB1ToafQ1AqUzRyDgugekWh-i8ODyZRped4SxrlI8OEMcbtTJNzhfDpyeYBiQh7HeQ6URn4eeHq3ePqbJSTPrqsYyG9YpU6azO7XJlNeq_Ml1KZms1lxrkXcETfo7U1h-z66TxpvH4qQRrRcNOY_kejq1x_GD3peWcoKPJ_f4Rbc4B-UvqicslKM44dLNoMDVw_gjKHRCUaaevFlzyS59pwv0UHFAuy4_wyp1uX7ciQOjUPyhl63ZEOX1w",
>"expires_in": 3600,
>"token_type": "Bearer"
>```

如果使用该访问令牌使用 [jwt.io](jwt.io)  ，我们会看到其包含如下的声明。

>```json
>"alg": "RS256",
>"kid": "143e829c2b57489969753ba4f8205979df0da988c640cffa5f1f4eda1b6e6aa4",
>"typ": "JWT"
>"nbf": 1481451903,
>"exp": 1481455503,
>"iss": "https://localhost:44350",
>"aud": [ "https://localhost:44350/resources", "customAPI" ],
>"client_id": "oauthClient",
>"scope": [ "customAPI.read" ]
>```

现在，我们可以使用 IdentityServer 的令牌的自省端点来验证该令牌，比如，我们作为一个 OAuth 资源从外部合作方收到该令牌。如果成功，我们将收到该令牌中的声明。注意，在 IdentityServer 4 中，来自 IdentifyServer 3 的访问令牌验证端点不再存在。

在这，我们前面创建的 scope 密钥要使用了，使用 Basic 验证，这里的用户名是 Scope ID，口令则为 scope secret。

```
POST /connect/introspect
Headers:
Authorization: Basic Y3VzdG9tQVBJOnNjb3BlU2VjcmV0
Content-Type: application/x-www-form-urlencoded
Body:
token=eyJhbGciOiJSUzI1NiIsImtpZCI6IjE0M2U4MjljMmI1NzQ4OTk2OTc1M2JhNGY4MjA1OTc5ZGYwZGE5ODhjNjQwY2ZmYTVmMWY0ZWRhMWI2ZTZhYTQiLCJ0eXAiOiJKV1QifQ.eyJuYmYiOjE0ODE0NTE5MDMsImV4cCI6MTQ4MTQ1NTUwMywiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NDQzNTAiLCJhdWQiOlsiaHR0cHM6Ly9sb2NhbGhvc3Q6NDQzNTAvcmVzb3VyY2VzIiwiY3VzdG9tQVBJIl0sImNsaWVudF9pZCI6Im9hdXRoQ2xpZW50Iiwic2NvcGUiOlsiY3VzdG9tQVBJLnJlYWQiXX0.D50LeW9265IH695FlykBiWVkKDj-Gjiv-8q-YJl9qV3_jLkTFVeHUaCDuPfe1vd_XVxmx_CwIwmIGPXftKtEcjMiA5WvFB1ToafQ1AqUzRyDgugekWh-i8ODyZRped4SxrlI8OEMcbtTJNzhfDpyeYBiQh7HeQ6URn4eeHq3ePqbJSTPrqsYyG9YpU6azO7XJlNeq_Ml1KZms1lxrkXcETfo7U1h-z66TxpvH4qQRrRcNOY_kejq1x_GD3peWcoKPJ_f4Rbc4B-UvqicslKM44dLNoMDVw_gjKHRCUaaevFlzyS59pwv0UHFAuy4_wyp1uX7ciQOjUPyhl63ZEOX1w
```

收到的响应：

```
"nbf": 1481451903,
"exp": 1481455503,
"iss": "https://localhost:44350",
"aud": [ "https://localhost:44350/resources", "customAPI" ],
"client_id": "oauthClient",
"scope": [ "customAPI.read" ],
"active": true
```

如果你希望程序化处理该流程，并用这种方式授权一个 .NET Core 资源，查阅：[IdentityServer4.AcessTokenValidation library](https://github.com/IdentityServer/IdentityServer4.AccessTokenValidation)。

## 用户界面

直到现在我们还没有 UI，让我们通过拉取 [Quickstart UI from GitHub](https://github.com/IdentityServer/IdentityServer4.Quickstart.UI) 使用 ASP.NET Core MVC 来开始。

或者将所有的文件夹复制到你的项目中，或者使用下面的 Powershell 命令：

>```csharp
>iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/IdentityServer/IdentityServer4.Quickstart.UI/release/get.ps1'))
>```

现在，需要将 ASP.NET MVC Core 添加到项目中。首先，添加下述的包到项目中 (如果你已经有了 Microsoft.AspNetCore.All 就可以跳过) 。

> ```csharp
> Microsoft.AspNetCore.Mvc
> Microsoft.AspNetCore.StaticFiles
> ```

然后，添加服务 (ConfigureServices)

```csharp
services.AddMvc();
```

最后，在 HTTP 管线中添加 (Configure)

```csharp
app.UseStaticFiles();
app.UseMvcWithDefaultRoute();
```

现在运行项目，我进行了截屏，我们拥有了一个 UI，现在可以开始验证用户了。

![](https://www.scottbrady91.com/img/identityserver/IdentityServer4Splash.png)



_IdentityServer 4 Quickstart UI Splash Screen_

## OpenID Connect

为了演示使用 OpenID Connect 验证用户，我们将创建一个客户端的 Web 应用程序，并在 IdentityServer 中添加相应的客户端定义。

首先，我们需要在 IdentityServer 中添加新的客户端：

```csharp
new Client {
    ClientId = "openIdConnectClient",
    ClientName = "Example Implicit Client Application",
    AllowedGrantTypes = GrantTypes.Implicit,			// browser-based client-side web applications
    AllowedScopes = new List<string>
    {
        IdentityServerConstants.StandardScopes.OpenId,
        IdentityServerConstants.StandardScopes.Profile,
        IdentityServerConstants.StandardScopes.Email,
        "role",
        "customAPI.write"
    },
    RedirectUris = new List<string> {"https://localhost:44330/signin-oidc"},
    PostLogoutRedirectUris = new List<string> {"https://localhost:44330"}
}
```

这里的 redirect 和 logout 来自即将到来的新应用。重定向要求的 /signin-oidc 将由中间件创建和处理。

这里我们使用 OpenID Connect 的简化授权类型。该授权类型允许我们通过浏览器请求 Identity 和访问令牌。

我将从最简化的授权类型开始，但安全性也是最小的。

### 客户端应用程序

现在，我们需要创建该客户端应用程序，我们需要另外一个 ASP.NET Core 站点，再次使用 Web Application 模板，仍然不带验证。

将 OpenID Connect 验证添加到 ASP.NET Core 站点中，我们需要添加如下的两个 Package 到站点中 (如果你已经安装了 Microsoft.AspNetCore.All 可以跳过)

>```csharp
>Microsoft.AspNetCore.Authentication.Cookies
>Microsoft.AspNetCore.Authentication.OpenIdConnect
>```

然后，在 DI 中 (ConfiguraeServices)

```csharp
services.AddAuthentication(options =>
    {
        options.DefaultScheme = "cookie";
    })
    .AddCookie("cookie");
```

这里，我们告诉应用程序使用 Cookie 验证，对于用户签名，和验证的默认方式。同时，我们可以使用 IdentityServer 验证用户，每个客户端应用程序仍然需要颁发自己的 Cookie (在站点自己的域中)。

现在，我们需要添加 OpenID Connect 验证

```csharp
services.AddAuthentication(options =>
    {
        options.DefaultScheme = "cookie";
        options.DefaultChallengeScheme = "oidc";
    })
    .AddCookie("cookie")
    .AddOpenIdConnect("oidc", options =>
    {
        options.Authority = "https://localhost:44350/";
        options.ClientId = "openIdConnectClient";
        options.SignInScheme = "cookie";
    });
```

这里，我们告诉我们的应用程序，使用我们的 OpenID Connect 供应商 (IdentityServer)，我们希望登录的 client id ，以及成功验证需要的验证类型 (前面在 Cookie 中定义)。

默认，OpenID Connect 中间件将使用 /signin-oidc 作为重定向的 URI，使用 `implicit` 流程，请求 `openid` 和 `profile` scope (仅请求 identity 令牌)。

然后，我们需要在 HTTP 管线中添加验证，在 UseMvc 之前。

```csharp
app.UseAuthentication();
```

现在，剩下的就是创建一个需要验证才能访问的页面。让我们在 Contact 这个 Action 上添加授权特性，因为联系我们的人是最不想要的。

```csharp
[Authorize]
public IActionResult Contact() { ... }
```

现在，运行应用程序，并选择 Contact 页面，我们将受到 401 未授权。这将被我们的 OpenID Connect 中间件介入，它使用 302 带有需要的参数，将我们重定向到我们的 Identity Server 验证端点。

![](https://www.scottbrady91.com/img/identityserver/IdentityServer4Login.png)

_IdentityServer 4 Quickstart UI Login Screen_

成功登录后，IdentityServer 随后将询问我们允许客户端应用程序代理访问特定的信息或资源 (客户端请求的相关 identity 和资源 scopes)。该许可请求可以根据客户端被禁用。默认情况下，用于 ASP.NET Core 的 OpenID Connect 中间件将请求 openid 和 profile scopes。

![](https://www.scottbrady91.com/img/identityserver/IdentityServer4Consent.png)

_IdentityServer 4 Quickstart Ui Consent Screen_

这就是使用简化授权模式，在简单的 OpenID Connect 客户端应用所有需要的。

## Entity Framework Core

当前，我们使用内存中的存储，如前提示用于演示目的，或者轻量级的实现。理想情况下我们更希望将各种存储转移到持久性的数据中，不会在每次部署或者代码变更的时候重新设置。

IdentityServer 拥有一个  [Entity Framework (EF) Core package](https://github.com/IdentityServer/IdentityServer4.EntityFramework)，我们可以实现将 client、scope 和持久授权使用任何 EF Core 数据库供应商存储。

Identity Server Entity Framework Core Package 已经使用内存中、SQLite (内存中) 和 SQL Server 数据库供应商集成测试。如果你发现任何问题，或者希望基于其它的数据库供应商编写测试，请在 GitHub 开一个问题或者提交 PR。

本文中，我们将使用 SQL Server (SQL Express 或者 Local DB)，所以，我们需要如下包：

>```csharp
>IdentityServer4.EntityFramework
>Microsoft.EntityFrameworkCore.SqlServer
>```

### 持久化授权存储

持久化授权存储包含许可的所有信息 (所以，我们不需要在每次请求询问许可)，参考令牌 (存储 jwt 的地方，只有一个与 jwt 对应的键给请求者，使其易于撤销)。以及更多，没有持久性存储，令牌将在 IdentityServer 每次部署之后被回收，我们将不能一次寄宿多个安装 (没有负载均衡)。

首先，我们定义一组变量：

```csharp
const string connectionString = 
    @"Data Source=(LocalDb)\MSSQLLocalDB;database=Test.IdentityServer4.EntityFramework;trusted_connection=yes;";
var migrationsAssembly = typeof(Startup).GetTypeInfo().Assembly.GetName().Name;
```

我们然后通过添加 AddIdentityServer 来添加持久授权存储支持。

```csharp
AddOperationalStore(options =>
    options.ConfigureDbContext = builder =>
        builder.UseSqlServer(connectionString, sqlOptions => sqlOptions.MigrationsAssembly(migrationsAssembly)))
```

我们的迁移程序集是寄宿 IdentityServer 的项目。这对于目标 DbContexts 不在宿主项目中 (在这种情况下位于 nuget 包中) 是必要的，并且允许我们运行 EF 迁移。否则，我们将遇到一个异常。

>```
>Your target project 'Project.Host' doesn't match your migrations assembly 'Project.BusinessLogic'. Either change your target project or change your migrations assembly. Change your migrations assembly by using DbContextOptionsBuilder. E.g. options.UseSqlServer(connection, b => b.MigrationsAssembly("Project.Host")). By default, the migrations assembly is the assembly containing the DbContext.
>Change your target project to the migrations project by using the Package Manager Console's Default project drop-down list, or by executing "dotnet ef" from the directory containing the migrations project.
>```

### 客户端应用和 Scope 存储

为我们的 scope 和客户端存储添加持久化，我们需要一些类似的简单工作，使用下面代码替换 AddInMemoryClients，AddInMemoryIdentityResources 和 AddInmemoryApiResources ：

```csharp
.AddConfigurationStore(options =>
    options.ConfigureDbContext = builder =>
        builder.UseSqlServer(connectionString, sqlOptions => sqlOptions.MigrationsAssembly(migrationsAssembly)))
```

这些注册，还包含了从我们的客户端应用表中读取 CORS 策略的服务。

### 运行 EF 迁移

执行 EF 迁移，我们需要添加 Microsoft.EntityFrameworkCore.Tools 包

> ```xml
> <ItemGroup>
>     <DotNetCliToolReference Include="Microsoft.EntityFrameworkCore.Tools.DotNet" Version="2.0.0" />
> </ItemGroup>
> ```

然后，我们使用下面命令创建迁移：

>```markup
>dotnet ef migrations add InitialIdentityServerMigration -c PersistedGrantDbContext
>dotnet ef migrations add InitialIdentityServerMigration -c ConfigurationDbContext
>```

## ASP.NET Core Identity

为了持久化用户存储，IdentityServer 4 提供了对 ASP.NET Core Identity 的集成库。我们使用 SQL Server，ASP.NET Core Identity Entity Framework 库，以及 IdentityUser 实体。

>```csharp
>IdentityServer4.AspNetIdentity
>Microsoft.AspNetCore.Identity.EntityFrameworkCore
>Microsoft.EntityFrameworkCore.SqlServer
>```

当前，我们需要创建自己的 IdentityDbContext 实现以覆盖构造函数，来得到非泛型的 DbContextOptions 版本。这是因为 IdentityDbContext 仅有一个接收泛型 DbContextOptions 的构造函数，在我们注册多个 DbContexts 的时候，会返回一个 Invalid Operation Exception。[我已经开了一个 Issue](https://github.com/aspnet/Identity/issues/962)，所以，我们很快跳过这一步。

```csharp
public class ApplicationDbContext : IdentityDbContext {
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }
}
```

然后，我们需要在 ConfigureService 方法添加 ASP.NET Identity  DbContext 的注册。

```csharp
services.AddDbContext<ApplicationDbContext>(builder =>
        builder.UseSqlServer(connectionString, sqlOptions => sqlOptions.MigrationsAssembly(migrationsAssembly)));
    
services.AddIdentity<IdentityUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();
```

然后，在 IdentityServerbuilder 中替换 AddTestUser，使用：

```csharp
.AddAspNetIdentity<IdentityUser>()
```

我们需要再次执行迁移，

> ```markup
> dotnet ef migrations add InitialIdentityServerMigration -c ApplicationDbContext
> ```

这就是我们在 IdentityServer 4 中使用 ASP.NET Core Identity 所有需要的，但是不巧的是，我们前面下载的 Quickstart UI 不再能正常工作，因为它仍然使用 TestUserStore。

其实，我们可以修改来自 Quckstart UI 的 AccountController ，通过替换一些代码来使用 ASP.NET Core Identity。

首先，我们需要修改 ASP.NET Core Identity 的 UserManager 构造函数，取代原来的 TestUserStore，我们构造函数看起来如下所示：

```csharp
private readonly UserManager<IdentityUser> _userManager;
private readonly IIdentityServerInteractionService _interaction;
private readonly IEventService _events;
private readonly AccountService _account;

public AccountController(
    IIdentityServerInteractionService interaction,
    IClientStore clientStore,
    IHttpContextAccessor httpContextAccessor,
    IEventService events,
    UserManager<IdentityUser> userManager) {
      _userManager = userManager;
      _interaction = interaction;
      _events = events;
      _account = new AccountService(interaction, httpContextAccessor, clientStore);
}
```

通过删除 TestUserStore，我们不再被两个方法破坏：Login (post) 和 ExternalCallback。我们可以替换整个 Login 方法，使用下面的代码：

```csharp
[HttpPost]
[ValidateAntiForgeryToken]
public async Task<IActionResult> Login(LoginInputModel model, string button) {
    if (button != "login") {
        var context = await _interaction.GetAuthorizationContextAsync(model.ReturnUrl);
        if (context != null) {
            await _interaction.GrantConsentAsync(context, ConsentResponse.Denied);
            return Redirect(model.ReturnUrl);
        }
        else {
            return Redirect("~/");
        }
    }

    if (ModelState.IsValid) {
        var user = await _userManager.FindByNameAsync(model.Username);         

        if (user != null && await _userManager.CheckPasswordAsync(user, model.Password)) {
            await _events.RaiseAsync(
                new UserLoginSuccessEvent(user.UserName, user.Id, user.UserName));

            AuthenticationProperties props = null;
            if (AccountOptions.AllowRememberLogin && model.RememberLogin) {
                props = new AuthenticationProperties {
                    IsPersistent = true,
                    ExpiresUtc = DateTimeOffset.UtcNow.Add(AccountOptions.RememberMeLoginDuration)
                };
            };         

            await HttpContext.SignInAsync(user.Id, user.UserName, props);

            if (_interaction.IsValidReturnUrl(model.ReturnUrl) 
                    || Url.IsLocalUrl(model.ReturnUrl)) {
                return Redirect(model.ReturnUrl);
            }

            return Redirect("~/");
        }

        await _events.RaiseAsync(new UserLoginFailureEvent(model.Username, "invalid credentials"));
        ModelState.AddModelError("", AccountOptions.InvalidCredentialsErrorMessage);
    }

    var vm = await _account.BuildLoginViewModelAsync(model);
    return View(vm);
}
```

ExternalCallback 方法，我们需要替换查找和前面的逻辑，如下：

```csharp
[HttpGet]
public async Task<IActionResult> ExternalLoginCallback() {
    var result = await HttpContext.AuthenticateAsync(IdentityConstants.ExternalScheme);
    if (result?.Succeeded != true) {
        throw new Exception("External authentication error");
    }

    var externalUser = result.Principal;
    var claims = externalUser.Claims.ToList();

    var userIdClaim = claims.FirstOrDefault(x => x.Type == JwtClaimTypes.Subject);
    if (userIdClaim == null) {
        userIdClaim = claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
    }
    if (userIdClaim == null) {
        throw new Exception("Unknown userid");
    }

    claims.Remove(userIdClaim);
    var provider = result.Properties.Items["scheme"];
    var userId = userIdClaim.Value;

    var user = await _userManager.FindByLoginAsync(provider, userId);
    if (user == null) {
        user = new IdentityUser { UserName = Guid.NewGuid().ToString() };
        await _userManager.CreateAsync(user);
        await _userManager.AddLoginAsync(user, new UserLoginInfo(provider, userId, provider));
    }

    var additionalClaims = new List<Claim>();

    var sid = claims.FirstOrDefault(x => x.Type == JwtClaimTypes.SessionId);
    if (sid != null) {
        additionalClaims.Add(new Claim(JwtClaimTypes.SessionId, sid.Value));
    }

    AuthenticationProperties props = null;
    var id_token = result.Properties.GetTokenValue("id_token");
    if (id_token != null) {
        props = new AuthenticationProperties();
        props.StoreTokens(new[] { new AuthenticationToken { Name = "id_token", Value = id_token } });
    }

    await _events.RaiseAsync(new UserLoginSuccessEvent(provider, userId, user.Id, user.UserName));
    await HttpContext.SignInAsync(
        user.Id, user.UserName, provider, props, additionalClaims.ToArray());

    await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);

    var returnUrl = result.Properties.Items["returnUrl"];
    if (_interaction.IsValidReturnUrl(returnUrl) || Url.IsLocalUrl(returnUrl)) {
        return Redirect(returnUrl);
    }

    return Redirect("~/");
}
```

由于 ASP.NET Identity 也改变了默认的验证模式，任何 `IdentityServerConstants.DefaultCookieAuthenticationScheme` 和 `IdentityServerConstants.ExternalCookieAuthenticationScheme` 的实例，都应该修改为 `IdentityConstants.Application` and `IdentityConstants.ExternalScheme`。

## Repositories

- [Source Code for Completed Article](https://github.com/scottbrady91/IdentityServer4-Example)
- [IdentityServer 4](https://github.com/IdentityServer/IdentityServer4)
- [IdentityServer 4 Quickstart UI](https://github.com/IdentityServer/IdentityServer4.Quickstart.UI)
- [IdentityServer 4 Entity Framework](https://github.com/IdentityServer/IdentityServer4.EntityFramework)
- [IdentityServer 4 ASP.NET Core Identity](https://github.com/IdentityServer/IdentityServer4.AspNetIdentity)

## See Also

* [Getting Started with IdentityServer 4](https://www.scottbrady91.com/Identity-Server/Getting-Started-with-IdentityServer-4)
