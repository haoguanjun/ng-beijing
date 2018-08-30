---
title: IdentityServer4 入门之一     
date: 2018-08-30
categories: IdentityServer4
---
IdentityServer4 快速入门，官网示例基于 .NET Core 2.0，这里使用 .NET Core 2.1 重新实现。
<!-- more -->

## IdentityServer4 快速入门之一

IdentityServer4 官网示例地址：https://github.com/IdentityServer/IdentityServer4.Samples/tree/release/Quickstarts/1_ClientCredentials。
此示例使用 .NET Core 2.0 开发，我们这里升级为 .NET Core 2.1 版本。

### 快速构建一个基本的 API 服务
我们快速构建一个基本的 API 服务器，后继我们会使用 IdentityServer4 保护起来，但是，在开始的时候，它是可以直接访问的。
该服务提供一个访问端点 http://localhost:5010/identity，其可以返回当前访问用户的 Claim 。

#### 创建空的网站项目

使用 dotnet CLI 快速创建基本的 Web 项目。

```bash
dotnet new web -o apiServer
```


#### 添加 MVC 服务支持

打开 Startup.cs ，添加 MVC 服务支持。

在 ConfigureServices 方法中添加对 MVC 的支持

```csharp
services.AddMvc();
```

在 Configure() 方法中添加对 MVC 服务的配置。

```csharp
app.UseMvc(routes =>
                       {
                           routes.MapRoute(
                               name: "default",
                               template: "{controller=Home}/{action=Index}/{id?}");
                       });
```

完整的 Startup.cs 文件如下：

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace apiServer
{
    public class Startup
    {
        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddMvc();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseMvc(routes =>
                       {
                           routes.MapRoute(
                               name: "default",
                               template: "{controller=Home}/{action=Index}/{id?}");
                       });
        }
    }
}

```

#### 自定义服务器端口

默认情况下，ASP.NET Core 的 Web 应用将会使用 5000 端口，我们希望将该服务器的端口修改为 5010，以便让开验证服务器的端口。

将 Program.cs 修改为如下所示：

```csharp
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace apiServer
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateWebHostBuilder(args).Build().Run();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
            /*
            WebHost.CreateDefaultBuilder(args)
                .UseStartup<Startup>();
            */
            new WebHostBuilder()
            .UseKestrel()
            .UseUrls("http://localhost:5010")
            .UseContentRoot(Directory.GetCurrentDirectory())
            .UseIISIntegration()
            .UseStartup<Startup>();
        
    }
}
```

#### 添加 API 控制器

在项目根目录下，创建 Controllers 文件夹，这是默认的控制器文件夹。在其中创建 IdentityController.cs 控制器文件。

该控制器将获取用户的 Claim 并以 JSON 形式返回。

```csharp
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Route("identity")]
public class IdentityController : ControllerBase
{
    [HttpGet()]
    public IActionResult Get()
    {
        return new JsonResult(from c in User.Claims select new { c.Type, c.Value });
    }
}
```

#### 启动并访问该服务

执行 dotnet  的 `run` 命令，启动服务。

```bash
dotnet run
```

在浏览器中输入地址 `http://localhost:5010/identity` 以访问该服务，应该返回以下结果。

```javascript
[]
```

#### 保护该服务

##### 使用 [Authorize] 特性包含控制器

在控制器上使用 [Authorize] 特性保护控制器，这样，在用户没有得到授权的情况下，将不能访问该控制器。

修改之后的控制器代码如下：

```csharp
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Route("identity")]
[Authorize]
public class IdentityController : ControllerBase
{
    [HttpGet()]
    public IActionResult Get()
    {
        return new JsonResult(from c in User.Claims select new { c.Type, c.Value });
    }
}
```

由于并没有设置验证的模式，再次访问 `http://localhost:5010/identity`，将会得到如下错误信息。

```
An unhandled exception occurred while processing the request.
InvalidOperationException: No authenticationScheme was specified, and there was no DefaultChallengeScheme found.
Microsoft.AspNetCore.Authentication.AuthenticationService.ChallengeAsync(HttpContext context, string scheme, AuthenticationProperties properties)
```

##### 添加 IdentityServer4 验证服务

在项目中添加对于 IdentityServer4 的 AccessTokenValidation 支持。使用 dotnet 的 CLI 工具添加。

```bash
dotnet add package IdentityServer4.AccessTokenValidatio
```

添加之后的项目文件内容：

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>netcoreapp2.1</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <Folder Include="wwwroot\" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="IdentityServer4.AccessTokenValidation" Version="2.6.0" />
    <PackageReference Include="Microsoft.AspNetCore.App" />
  </ItemGroup>

</Project>

```

##### 使用 IdentityServer4 的验证服务

在 Startup.cs 文件的 ConfigureServices 方法中，在 MVC 服务之前，添加验证和授权服务支持。

```csharp
services
   .AddAuthentication(options =>
      {
         options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
         options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
      })
   .AddJwtBearer(o =>
      {
         o.Authority = "http://localhost:5000";
         o.Audience = "api1";
         o.RequireHttpsMetadata = false;
      });
```

完整的 Startup.cs 内容

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

using IdentityServer4.AccessTokenValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace apiServer
{
    public class Startup
    {
        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
            services
            .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                })
            .AddJwtBearer(o =>
                {
                    o.Authority = "http://localhost:5000";
                    o.Audience = "api1";
                    o.RequireHttpsMetadata = false;
                });
            
            services.AddMvc();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseAuthentication();
            app.UseMvc(routes =>
                       {
                           routes.MapRoute(
                               name: "default",
                               template: "{controller=Home}/{action=Index}/{id?}");
                       });
        }
    }
}
```

##### 检查受保护的服务

此时，重新访问 `http://localhost:5010/identity`，由于没有提供 access token，服务器会返回 401 错误。

```
HTTP ERROR 401
```

### 实现 OAuth2 授权服务器

使用 IdentityServer4 创建授权服务器。

##### 创建项目

使用 dotnet 的 CLI 工具创建项目，仍然是一个 Web 项目。

```bash
dotnet new web -o Starter
```

然后，添加 IdentityServer4 包。

```base
dotnet add package IdentityServer4
```

添加之后的项目文件内容：

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>netcoreapp2.1</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <Folder Include="wwwroot\" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="IdentityServer4" Version="2.2.0" />
    <PackageReference Include="Microsoft.AspNetCore.App" />
  </ItemGroup>

</Project>
```

#### 配置参数

我们在代码中配置授权服务器支持的用户和 scope

创建 Config.cs 文件，在两个静态方法中分别提供 API 资源和用户。

我们创建的用户标识为 client，密钥为 secret。

```csharp
using IdentityServer4.Models;
using System.Collections.Generic;

namespace QuickstartIdentityServer
{
    public class Config
    {
        // scopes define the API resources in your system
        public static IEnumerable<ApiResource> GetApiResources()
        {
            return new List<ApiResource>
            {
                new ApiResource("api1", "My API")
            };
        }

        // clients want to access resources (aka scopes)
        public static IEnumerable<Client> GetClients()
        {
            // 唯一的一个用户
            return new List<Client>
            {
                new Client
                {
                    ClientId = "client",
                    AllowedGrantTypes = GrantTypes.ClientCredentials,

                    ClientSecrets = 
                    {
                        new Secret("secret".Sha256())
                    },
                    AllowedScopes = { "api1" }
                }
            };
        }
    }
}
```



#### 配置服务

在 Startup.cs 中配置 IdentityServer4 服务。

* 在 ConfigureServices 中设置对 IdentityServer 服务的支持
* 在 Configure 中使用默认配置。

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using QuickstartIdentityServer;

namespace starter
{
    public class Startup
    {
        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddIdentityServer()
                .AddDeveloperSigningCredential()
                .AddInMemoryApiResources(Config.GetApiResources())
                .AddInMemoryClients(Config.GetClients());

        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseIdentityServer();
        }
    }
}
```

#### 运行服务

使用 dotnet 命令启动服务

```bash
dotnet run
```

应该看到如下输出

```
>dotnet run
Using launch settings from C:\study\dotnetcore\identityserver4\starter\Properties\launchSettings.json...
info: Microsoft.AspNetCore.DataProtection.KeyManagement.XmlKeyManager[0]
      User profile is available. Using 'C:\Users\xxx\AppData\Local\ASP.NET\DataProtection-Keys' as key repository and Windows DPAPI to encrypt keys at rest.
info: IdentityServer4.Startup[0]
      You are using the in-memory version of the persisted grant store. This will store consent decisions, authorization codes, refresh and reference tokens in memory only. If you are using any of those features in production, you want to switch to a different store implementation.
Hosting environment: Development
Content root path: C:\study\dotnetcore\identityserver4\starter
Now listening on: https://localhost:5001
Now listening on: http://localhost:5000
Application started. Press Ctrl+C to shut down.
```

我们不会直接使用这个服务器，在 API 服务器的配置中，我们使用了

```
o.Authority = "http://localhost:5000";
```

来配置授权服务器。



### 创建消费服务的客户端

#### IdentityModel
我们创建一个控制台应用来消费 API 服务，使用 [IdentityModel](https://github.com/IdentityModel/IdentityModel) 辅助访问 OAuth2.0 的服务端。

##### TokenClient

Client library for OAuth 2.0 and OpenID Connect token endpoints.

Features:

- Support for client credentials & resource owner password credential flow
- Support for exchanging authorization codes with tokens
- Support for refreshing refresh tokens
- Support for client credentials via Basic Authentication, POST body and X.509 client certificates
- Extensible for custom parameters
- Parsing of token response messages

Example:

```
var client = new TokenClient(
    "https://server/token",
    "client_id",
    "secret");
    
var response = await client.RequestClientCredentialsAsync("scope");
var token = response.AccessToken;
```

##### IdentityModel2

新的 [IdentityModel2](https://identitymodel.readthedocs.io/en/latest/) 项目提供了更佳的支持。

#### 创建客户端项目

使用 dotnet 的命令行工具创建控制台项目

```bash
dotnet new console -o Client
```

添加对 IdentityModel 的引用。

```bash
dotnet add package IdentityModel
```

添加之后的项目文件如下所示：

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>netcoreapp2.1</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="IdentityModel" Version="3.9.0" />
  </ItemGroup>

</Project>
```

#### 访问 API 服务

##### 使用 IdentityModel 方式访问

首先我们使用元数据来发现服务端点。

```csharp
var disco = await DiscoveryClient.GetAsync("http://localhost:5000");
```

然后，我们直接创建了用户的 Token，以访问资源。

```csharp
var tokenClient = new TokenClient(disco.TokenEndpoint, "client", "secret");
```

随后，我们获取 access token。

```csharp
var tokenResponse = await tokenClient.RequestClientCredentialsAsync("api1");
```

最终，我们使用这个 access token 通过 HttpClient 访问服务器资源。

```csharp
var client = new HttpClient();
client.SetBearerToken(tokenResponse.AccessToken);

var response = await client.GetAsync("http://localhost:5010/identity");
```

完整代码如下所示：

```csharp
using IdentityModel.Client;
using Newtonsoft.Json.Linq;
using System;
using System.Net.Http;
using System.Threading.Tasks;

namespace Client
{
    public class Program
    {
        public static void Main(string[] args) => MainAsync().GetAwaiter().GetResult();

        private static async Task MainAsync()
        {
            // discover endpoints from metadata
            var disco = await DiscoveryClient.GetAsync("http://localhost:5000");
            if (disco.IsError)
            {
                Console.WriteLine(disco.Error);
                return;
            }

            // request token
            var tokenClient = new TokenClient(disco.TokenEndpoint, "client", "secret");
            var tokenResponse = await tokenClient.RequestClientCredentialsAsync("api1");

            if (tokenResponse.IsError)
            {
                Console.WriteLine(tokenResponse.Error);
                return;
            }

            Console.WriteLine("Token:");
            Console.WriteLine(tokenResponse.Json);
            Console.WriteLine("\n\n");

            // call api
            var client = new HttpClient();
            client.SetBearerToken(tokenResponse.AccessToken);

            var response = await client.GetAsync("http://localhost:5010/identity");
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine(response.StatusCode);
            }
            else
            {
                var content = await response.Content.ReadAsStringAsync();
                Console.WriteLine(JArray.Parse(content));
            }
        }
    }
}
```
##### 使用 IdentityModel2 语法访问

###### 发现服务端点

```csharp
var disco = await client.GetDiscoveryDocumentAsync("http://localhost:5000");
```

###### 请求 access token

注意 GrantType 为 `"client_credentials"`，或者使用常量 IdentityModel.OidcConstants.GrantTypes.ClientCredentials 来表示。

```csharp
var tokenResponse = await client.RequestTokenAsync(new TokenRequest
            {
                Address = disco.TokenEndpoint,
                GrantType = "client_credentials",

                ClientId = "client",
                ClientSecret = "secret",

                Parameters =
                    {
                        { "scope", "api1" }
                    }
            });
```

###### 使用 access token 访问服务

```csharp
client.SetBearerToken(tokenResponse.AccessToken);

var response = await client.GetAsync("http://localhost:5010/identity");
```

完整代码：

```csharp
using IdentityModel.Client;
using Newtonsoft.Json.Linq;
using System;
using System.Net.Http;
using System.Threading.Tasks;

namespace Client
{
    public class Program
    {
        public static void Main(string[] args) => MainAsync().GetAwaiter().GetResult();

        private static async Task MainAsync()
        {
            var client = new HttpClient();

            // discover endpoints from metadata
            var disco = await client.GetDiscoveryDocumentAsync("http://localhost:5000");
            if (disco.IsError)
            {
                Console.WriteLine(disco.Error);
                return;
            }

            // request token
            var tokenResponse = await client.RequestTokenAsync(new TokenRequest
            {
                Address = disco.TokenEndpoint,
                GrantType = IdentityModel.OidcConstants.GrantTypes.ClientCredentials,

                ClientId = "client",
                ClientSecret = "secret",

                Parameters =
                    {
                        { "scope", "api1" }
                    }
            });

            Console.WriteLine("Token:");
            Console.WriteLine(tokenResponse.Json);
            Console.WriteLine("\n\n");

            // call api
            client.SetBearerToken(tokenResponse.AccessToken);

            var response = await client.GetAsync("http://localhost:5010/identity");
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine(response.StatusCode);
            }
            else
            {
                var content = await response.Content.ReadAsStringAsync();
                Console.WriteLine(JArray.Parse(content));
            }
        }
    }
}
```



#### 访问服务

运行客户端，访问服务，可以看到如下输出：

```

>dotnet run
Token:
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjQ3OWUzMmE4ZWI5OWZjMDljMTdiZjI2NTI5NmZlNjMwIiwidHlwIjoiSldUIn0.eyJuYmYiOjE1MzU2MTY0MTAsImV4cCI6MTUzNTYyMDAxMCwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo1MDAwIiwiYXVkIjpbImh0dHA6Ly9sb2NhbGhvc3Q6NTAwMC9yZXNvdXJjZXMiLCJhcGkxIl0sImNsaWVudF9pZCI6ImNsaWVudCIsInNjb3BlIjpbImFwaTEiXX0.V6aOV7tX59coLEkMpM3p9l3ppydmpjEcupRhHKHAkJMkA1Pb8w_0splbMMJH4G_iHRhKA8ueJn6XtDW24pcM1cdaulM2wt63Yc1h5fuUUawkJeHPdgRNWUBY5d8h-RPUamNuMparw3X1YpLMGKX5tFB8j8wYmUb_mhPhYjsXqSkDxxIHGpkxGd4RSFGkMMH0iX-jOwXV_tR91naY7WXxJD-TGYXJn0MT2L13MGARMiTIAVpGksPfgE9dhtKGRQ2BFC45BewnHdJSsEhD6UBWhRce5248HejE7dW_gI6xRYZrfd2e3nKyyBPwT67AN26Wiuv4dixuCGUolrbZ3JgteA",
  "expires_in": 3600,
  "token_type": "Bearer"
}



[
  {
    "type": "nbf",
    "value": "1535616410"
  },
  {
    "type": "exp",
    "value": "1535620010"
  },
  {
    "type": "iss",
    "value": "http://localhost:5000"
  },
  {
    "type": "aud",
    "value": "http://localhost:5000/resources"
  },
  {
    "type": "aud",
    "value": "api1"
  },
  {
    "type": "client_id",
    "value": "client"
  },
  {
    "type": "scope",
    "value": "api1"
  }
]
```

此时，检查 IdentityServer 服务器的输出，可以看到如下内容：

```
>dotnet run
Using launch settings from C:\study\dotnetcore\identityserver4\starter\Properties\launchSettings.json...
info: Microsoft.AspNetCore.DataProtection.KeyManagement.XmlKeyManager[0]
      User profile is available. Using 'C:\Users\xxx\AppData\Local\ASP.NET\DataProtection-Keys' as key repository and Windows DPAPI to encrypt keys at rest.
info: IdentityServer4.Startup[0]
      You are using the in-memory version of the persisted grant store. This will store consent decisions, authorization codes, refresh and reference tokens in memory only. If you are using any of those features in production, you want to switch to a different store implementation.
Hosting environment: Development
Content root path: C:\study\dotnetcore\identityserver4\starter
Now listening on: https://localhost:5001
Now listening on: http://localhost:5000
Application started. Press Ctrl+C to shut down.
info: Microsoft.AspNetCore.Hosting.Internal.WebHost[1]
      Request starting HTTP/1.1 GET http://localhost:5000/.well-known/openid-configuration
info: IdentityServer4.Hosting.IdentityServerMiddleware[0]
      Invoking IdentityServer endpoint: IdentityServer4.Endpoints.DiscoveryEndpoint for /.well-known/openid-configuration
info: Microsoft.AspNetCore.Hosting.Internal.WebHost[2]
      Request finished in 148.0893ms 200 application/json; charset=UTF-8
info: Microsoft.AspNetCore.Hosting.Internal.WebHost[1]
      Request starting HTTP/1.1 GET http://localhost:5000/.well-known/openid-configuration/jwks
info: IdentityServer4.Hosting.IdentityServerMiddleware[0]
      Invoking IdentityServer endpoint: IdentityServer4.Endpoints.DiscoveryKeyEndpoint for /.well-known/openid-configuration/jwks
info: Microsoft.AspNetCore.Hosting.Internal.WebHost[2]
      Request finished in 21.7819ms 200 application/json; charset=UTF-8
info: Microsoft.AspNetCore.Hosting.Internal.WebHost[1]
      Request starting HTTP/1.1 POST http://localhost:5000/connect/token application/x-www-form-urlencoded 40
info: IdentityServer4.Hosting.IdentityServerMiddleware[0]
      Invoking IdentityServer endpoint: IdentityServer4.Endpoints.TokenEndpoint for /connect/token
info: IdentityServer4.Validation.TokenRequestValidator[0]
      Token request validation success
{
        "ClientId": "client",
        "GrantType": "client_credentials",
        "Scopes": "api1",
        "Raw": {
          "grant_type": "client_credentials",
          "scope": "api1"
        }
      }
info: Microsoft.AspNetCore.Hosting.Internal.WebHost[2]
      Request finished in 210.8521ms 200 application/json; charset=UTF-8
info: Microsoft.AspNetCore.Hosting.Internal.WebHost[1]
      Request starting HTTP/1.1 GET http://localhost:5000/.well-known/openid-configuration
info: IdentityServer4.Hosting.IdentityServerMiddleware[0]
      Invoking IdentityServer endpoint: IdentityServer4.Endpoints.DiscoveryEndpoint for /.well-known/openid-configuration
info: Microsoft.AspNetCore.Hosting.Internal.WebHost[2]
      Request finished in 0.7336ms 200 application/json; charset=UTF-8
info: Microsoft.AspNetCore.Hosting.Internal.WebHost[1]
      Request starting HTTP/1.1 GET http://localhost:5000/.well-known/openid-configuration/jwks
info: IdentityServer4.Hosting.IdentityServerMiddleware[0]
      Invoking IdentityServer endpoint: IdentityServer4.Endpoints.DiscoveryKeyEndpoint for /.well-known/openid-configuration/jwks
info: Microsoft.AspNetCore.Hosting.Internal.WebHost[2]
      Request finished in 0.5583ms 200 application/json; charset=UTF-8
```
