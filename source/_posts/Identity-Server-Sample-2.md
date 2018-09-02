---
title: IdentityServer4 #2: 使用资源所有者密码授权保护 API
date: 2018-09-02
categories: oauth
tags: [oauth, IdentityServer4]
---
**OAuth 2.0 资源所有者密码授权** 允许一个客户端发送用户名和密码到令牌服务并获得一个表示该用户的访问令牌。
（OAuth 2.0） **规范** 建议仅对“受信任”的应用程序使用资源所有者密码授权。一般来说，当你想要验证一个用户并请求访问令牌的时候，使用交互式 OpenID Connect 流通常会更好。 
<!-- more -->
# IdentityServer4 入门之二: 使用资源所有者密码授权保护 API

**OAuth 2.0 资源所有者密码授权** 允许一个客户端发送用户名和密码到令牌服务并获得一个表示该用户的访问令牌。

（OAuth 2.0） **规范** 建议仅对“受信任”的应用程序使用资源所有者密码授权。一般来说，当你想要验证一个用户并请求访问令牌的时候，使用交互式 OpenID Connect 流通常会更好。 

不过，这个授权类型允许我们在 IdentityServer 快速入门中引入 **用户** 的概念，这是我们要展示它的原因。

## 添加用户
就像基于内存存储的资源（即 范围 Scopes）和客户端一样，对于用户也可以这样做。

```
注意：查看基于 ASP.NET Identity 的快速入门以获得更多关于如何正确存储和管理用户账户的信息
```

在 IdentityServer4.Test 命名空间下，IdentityServer4 预定义了用于测试的用户类 [`TestUser`](https://github.com/IdentityServer/IdentityServer4/blob/75b1a660c3cab2580112e6e0288f3f6bed8189f9/src/Test/TestUser.cs)，在代码注释中，说明此内存中的用户对象用于测试，不要用于生产环境。

```csharp
using System.Collections.Generic;
using System.Security.Claims;
using IdentityModel;

namespace IdentityServer4.Test
{
    public class TestUser
    {
        public string SubjectId { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string ProviderName { get; set; }
        public string ProviderSubjectId { get; set; }
        public bool IsActive { get; set; } = true;
        public ICollection<Claim> Claims { get; set; } 
        	= new HashSet<Claim> (new ClaimComparer ());
    }
}
```

在 Config.cs 文件中的配置类中，添加获取用户的方法。

```csharp
public static List<TestUser> GetUsers()
{
    return new List<TestUser>()
    {
        new TestUser
        {
            SubjectId="1",
            Username="爱丽丝",
            Password="password"
        },
        new TestUser
        {
            SubjectId="2",
            Username="博德",
            Password="password"
        }
    };
}
```

然后，使用 [AddTestUsers()](https://github.com/IdentityServer/IdentityServer4/blob/75b1a660c3cab2580112e6e0288f3f6bed8189f9/src/Test/IdentityServerBuilderExtensions.cs) 方法将测试用户注册到 IdentityServer 中。

```csharp
public void ConfigureServices(IServiceCollection services)
{
    // 使用内存存储，密钥，客户端和资源来配置身份服务器。
    services.AddIdentityServer()
        .AddTemporarySigningCredential()
        .AddInMemoryApiResources(Config.GetApiResources())
        .AddInMemoryClients(Config.GetClients())
        .AddTestUsers(Config.GetUsers());
}
```

`AddTestUsers` 扩展方法在背后做了以下几件事：

- 为资源所有者密码授权添加支持
- 添加对用户相关服务的支持，这服务通常为登录 UI 所使用（我们将在下一个快速入门中用到登录 UI）
- 为基于测试用户的身份信息服务添加支持（你将在下一个快速入门中学习更多与之相关的东西）

[AddTestUsers](https://github.com/IdentityServer/IdentityServer4/blob/75b1a660c3cab2580112e6e0288f3f6bed8189f9/src/Test/IdentityServerBuilderExtensions.cs) 的代码如下所示：

```csharp
using System.Collections.Generic;
using IdentityServer4.Test;

namespace Microsoft.Extensions.DependencyInjection
{
    /// <summary>
    /// Extension methods for the IdentityServer builder
    /// </summary>
    public static class IdentityServerBuilderExtensions
    {
        public static IIdentityServerBuilder AddTestUsers (this IIdentityServerBuilder builder, List<TestUser> users)
        {
            builder.Services.AddSingleton (new TestUserStore (users));
            builder.AddProfileService<TestUserProfileService> ();
            builder.AddResourceOwnerValidator<TestUserResourceOwnerPasswordValidator> ();
            return builder;
        }
    }
}
```

在生产环境下，你需要使用 AddResourceOwnerValidator 来注册自己实现的验证器。

此时的 [TestUserprofileService](https://github.com/IdentityServer/IdentityServer4/blob/75b1a660c3cab2580112e6e0288f3f6bed8189f9/src/Test/TestUserProfileService.cs) 提供了对用户的 profile 的支持。

在 IdentityServer 中，实现资源所有者密码验证需要实现接口[IResourceOwnerPasswordValidator](http://docs.identityserver.io/en/release/topics/resource_owner.html)， [TestUserResourceOwnerPasswordValidator](https://github.com/IdentityServer/IdentityServer4/blob/75b1a660c3cab2580112e6e0288f3f6bed8189f9/src/Test/TestUserResourceOwnerPasswordValidator.cs) 实现该接口并完成实际的用户验证工作。

```csharp
using System;
using System.Threading.Tasks;
using IdentityModel;
using IdentityServer4.Validation;
using Microsoft.AspNetCore.Authentication;

namespace IdentityServer4.Test
{
    /// <summary>
    /// Resource owner password validator for test users
    /// </summary>
    /// <seealso cref="IdentityServer4.Validation.IResourceOwnerPasswordValidator" />
    public class TestUserResourceOwnerPasswordValidator : IResourceOwnerPasswordValidator
    {
        private readonly TestUserStore _users;
        private readonly ISystemClock _clock;
        public TestUserResourceOwnerPasswordValidator (TestUserStore users, ISystemClock clock)
        {
            _users = users;
            _clock = clock;
        }
        public Task ValidateAsync (ResourceOwnerPasswordValidationContext context)
        {
            if (_users.ValidateCredentials (context.UserName, context.Password))
            {
                var user = _users.FindByUsername (context.UserName);
                context.Result = new GrantValidationResult (
                    user.SubjectId ??
                    throw new ArgumentException ("Subject ID not set", nameof (user.SubjectId)),
                        OidcConstants.AuthenticationMethods.Password, _clock.UtcNow.UtcDateTime,
                        user.Claims);
            }
            return Task.CompletedTask;
        }
    }
}
```

## 为资源所有者密码授权添加一个客户端定义

你可以通过修改 `AllowedGrantTypes` 属性简单地添加对已有客户端授权类型的支持。

通常你会想要为资源所有者用例创建独立的客户端，添加以下代码到你配置中的客户端定义中：

```csharp
public static IEnumerable<Client> GetClients()
{
    return new List<Client>
    {
        // 省略其他客户端定义...
        // 资源所有者密码授权客户端定义
        new Client
        {
            ClientId = "ro.client",

            AllowedGrantTypes = GrantTypes.ResourceOwnerPassword,

            ClientSecrets =
            {
                new Secret("secret".Sha256())
            },
            AllowedScopes = { "api1" }
        }
    };
}
```

## 使用密码授权请求一个令牌

客户端看起来跟之前 **客户端凭证授权** 的客户端是相似的。主要差别在于现在的客户端将会以某种方式收集用户密码，然后在令牌请求期间发送到令牌服务。

IdentityModel 的 `TokenClient` 在这里再次为我们提了供帮助：

```csharp
// 请求以获得令牌
var tokenClient = new TokenClient(disco.TokenEndpoint, "ro.client", "secret");
var tokenResponse = await tokenClient.RequestResourceOwnerPasswordAsync("爱丽丝", "password", "api1");
if (tokenResponse.IsError)
{
    Console.WriteLine(tokenResponse.Error);
    return;
}
Console.WriteLine(tokenResponse.Json);
Console.WriteLine("\n\n");
```

当你发送令牌到身份 API 端点的时候，你会发现与客户端凭证授权
 相比，资源所有者密码授权有一个很小但很重要的区别。访问令牌现在将包含一个 `sub` 信息，该信息是用户的唯一标识。`sub` 信息可以在调用 API 后通过检查内容变量来被查看，并且也将被控制台应用程序显示到屏幕上。

`sub` 信息的存在（或缺失）使得 API 能够区分代表客户端的调用和代表用户的调用。


## See Also

* [Quickstart #2: Securing an API using the Resource Owner Password Grant](https://github.com/IdentityServer/IdentityServer4.Samples/tree/release/Quickstarts/2_ResourceOwnerPasswords)
* [Protecting an API using Passwords](http://docs.identityserver.io/en/release/quickstarts/2_resource_owner_passwords.html)
* [Resource Owner Password Validation](http://docs.identityserver.io/en/release/topics/resource_owner.html)
* [GrantValidationResult](http://docs.identityserver.io/en/release/reference/grant_validation_result.html#refgrantvalidationresult)
* [晓晨Master 的 IdentityServer4](https://www.cnblogs.com/stulzq/category/1060023.html)
