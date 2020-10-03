---
title: 如何使用 Azure Active Directory 认证和 Microsoft Graph 构建 Blazor Web 应用
date: 2020-10-3
categeries: oauth
tags: [oauth]
---
如果您是一个 .NET 开发者，你很可能听过过 Blazor 是一个最近的热门开发技术。Blazor 是一个使用 .NET Blazor 服务器来构建可交互客户端 Web 界面的框架。就是本文所专注的技术，提供了在 ASP.NET Core 应用中，在服务器端寄宿 Razor 组件的支持。UI 的更新通过 SignalR 连接进行。由于多数的应用都需要某些程度的验证和授权，这里将展示如何使用 Azure AD 实现验证的最佳方式，以及如何从 Microsoft Graph 获取数据。
<!-- more -->


# 如何使用 Azure Active Directory 认证和 Microsoft Graph 构建 Blazor Web 应用

英文原文：https://developer.microsoft.com/en-us/identity/blogs/how-to-build-a-blazor-web-app-with-azure-active-directory-authentication-and-microsoft-graph/

如果您是一个 .NET 开发者，你很可能听过过 Blazor 是一个最近的热门开发技术。Blazor 是一个使用 .NET Blazor 服务器来构建可交互客户端 Web 界面的框架。就是本文所专注的技术，提供了在 ASP.NET Core 应用中，在服务器端寄宿 Razor 组件的支持。UI 的更新通过 SignalR 连接进行。由于多数的应用都需要某些程度的验证和授权，这里将展示如何使用 Azure AD 实现验证的最佳方式，以及如何从 Microsoft Graph 获取数据。

### 先决条件

为了继续下面的演练，您需要最新版本的 [NET Core 3.1 SDK](https://dotnet.microsoft.com/download/dotnet-core/3.1), [Visual Studio 2019](https://visualstudio.microsoft.com/downloads/) (可选，但是最好)，并且拥有一个 Azure AD 的租户。如果你不能访问 Azure AD 租户，要么你可以免费注册一个  [Microsoft 365 Developer program](https://developer.microsoft.com/en-us/microsoft-365/dev-program)，或者创建一个免费的  [Free Azure Trial](https://azure.microsoft.com/free)  试用账号。

### Blazor 与验证

如果你正在构建 Blazor (服务器端) 应用，那么我们有一些好消息。Visual Studio 和 CLI 模版支持开箱即用的验证支持。打开 Visual Studio，然后创建一个新的 Blazor 应用。我们将它命名为 "BlazorAppWithAuth"，然后按照下面的动画进行。

![](https://developer.microsoft.com/en-us/identity/blogs/wp-content/uploads/2020/07/1.gif)

通过选择工作或者学校账号验证选项，Visual Studio 将在 Azure AD 上创建适当的应用注册，并为 Blazor 应用配置开箱即用的验证所需的配置和代码。我们可以通过检查 appsettings.json 来确认。

![](https://developer.microsoft.com/en-us/identity/blogs/wp-content/uploads/2020/07/2.png)

并且，如果你到 Azure 门户的 Azure AD 注册页签中查看，还可以看到与 Visual Studio 中看到的信息想匹配的应用注册资料。

![](https://developer.microsoft.com/en-us/identity/blogs/wp-content/uploads/2020/07/3.png)

不需要写一行代码，我们的 Blazor 应用在用户访问任何页面之前，就可以提示用户。我们可以通过运行应用来快速测试该应用。在我们第一次访问该站点的时候，我们将被提示这些应用要求的 (默认) 权限，这里是读取用户的资料。

![](https://developer.microsoft.com/en-us/identity/blogs/wp-content/uploads/2020/07/4.png)！



![](https://developer.microsoft.com/en-us/identity/blogs/wp-content/uploads/2020/07/5.png)

到了这一步，你可能认为我们的任务已经完成了，实际上，还有许多事情要做。首先，默认的模版使用了老式的，默认 v1 版本的 Azure AD 端点。如果你想知道为什么你应当使用 Microsoft identity platform 并使用 v2 版本的端点，你可以[查看 Microsoft identity platform 文档](https://docs.microsoft.com/en-us/azure/active-directory/develop/)。

### 使用 Microsoft.Identity.Web 现代化验证

在 [Build 2020](https://techcommunity.microsoft.com/t5/azure-active-directory-identity/build-2020-fostering-a-secure-and-trustworthy-app-ecosystem-for/ba-p/1257360) 中，我们为 ASP.NET Core 3.1 (及后继版本) 宣布了一个新的验证和令牌管理库。新的库对复杂性进行了很棒的大量抽象，支持开发者只需要很少的代码就可以实现验证。而且，新库最大的优势是因为该库构建与 MSAL 之上，你不再需要使用两个单独的库来先进行验证，然后获得一个令牌来访问后端的 API。所以，让我们看一下如何迁移到这个最新的库上。

> 注意：Microsoft.Identity.Web 仍然在预览状态，它将很快发布
>
> 注意：现在 1.0 已经发布。发布时间：2020/10/1

首先，我们需要下载这个新的 NuGet 包

* Microsoft.Identity.Web (0.2.2 preview) - 1.0.0 已经发布
* Microsoft.Identity.Web.UI (0.2.2 preview) - 1.0.0 已经发布

![](https://developer.microsoft.com/en-us/identity/blogs/wp-content/uploads/2020/07/6.png)



![](https://developer.microsoft.com/en-us/identity/blogs/wp-content/uploads/2020/07/7.png)

然后，我们需要修改几行代码来清除老的验证代码并切换到新的代码。

打开 Startup() 并替换代码，下面是原来的代码：

```csharp
services.AddAuthentication(AzureADDefaults.AuthenticationScheme)
                .AddAzureAD(options => Configuration.Bind("AzureAd", options));

services.AddControllersWithViews(options =>
            {
                var policy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build();
                options.Filters.Add(new AuthorizeFilter(policy));
            });
```

替换为：

```csharp
services.AddMicrosoftWebAppAuthentication(Configuration);
services.AddControllersWithViews(options =>
   {
      var policy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build();
      options.Filters.Add(new AuthorizeFilter(policy));
   })
  .AddMicrosoftIdentityUI();
```

最后，我们需要确保我们的应用可以使用正确的 v2 版本端点来进行登录和登出。打开 LoginDisplay.razor 并进行如下的更新：

```html
<AuthorizeView>
    <Authorized>
        Hello, @context.User.Identity.Name!
        <a href="MicrosoftIdentity/Account/SignOut">Log out</a>
    </Authorized>
    <NotAuthorized>
        <a href="MicrosoftIdentity/Account/SignIn">Log in</a>
    </NotAuthorized>
</AuthorizeView>
```

你需要注意到，这里并没有特定的用来登录和登出的页面。相反，它们构建在 Microosft.Identity.Web.dll 内部。所以，在我们更新区域到 "MicrosoftIdentity" 的时候，不再需要其它的修改了。

当我们再次从 Visual Stuido 运行应用的时候，我们从 v2 中获得新的登录体验，例如无口令和多因子验证。最棒的是这些功能被设计为不需要修改任何代码，随着 Azure AD 的管理被配置为使用这些设置，所有的用户可以从更强的安全性中获益。

![](https://developer.microsoft.com/en-us/identity/blogs/wp-content/uploads/2020/07/8.png)

如你所见，使用很少的代码，我们可以借助于 Microsoft.Identity.Web 库基于 Azure AD 来验证用户。

### 从 Microsoft Graph 提取数据

Microsoft Graph 提供了大量的 API 来支持你基于用户自己的数据构建丰富的沉浸式的应用。在下面的步骤中，我们将拉取用户的电子邮件并将它们显示在应用内。为达到该目标，我们首先需要在 Azure AD 上扩展应用注册的权限，增加访问电子邮件数据的访问，然后我们需要在 Blazore 应用中添加一些代码来提取，并在其中的一个页面上显示数据。

#### Azure AD 门户

找到应用的注册，并进入 API 权限，选择添加新的权限，然后选择 Graph API，在这里，我们希望选择被代理权限，并选择 "Mail Read" 权限。

![](https://developer.microsoft.com/en-us/identity/blogs/wp-content/uploads/2020/07/9.gif)我们还需要创建一个用户密钥，因为我们的应用将需要一个验证令牌，和提取数据而不需要任何用户交互的方式。在同一个应用注册中，打开 Certificates 和 Secrets 页签，然后创建新的永不过期的密钥，如下所示：

![](https://developer.microsoft.com/en-us/identity/blogs/wp-content/uploads/2020/07/10.gif)

确保你复制了密码，因为一旦你从该页面切换出去，你就再也不能访问它了。但是，如果需要的话，你总是可以重新创建它 - 这很简单且免费。

回到 Blazor 应用中，在 Visual Studio 中，我们首先需要在 appsettings.json 中添加客户密钥。在 AzureAD

 的配置节，我们必须添加如下的行：

```json
“ClientSecret”: “<your secret>”
```

在 Startup.cs 文件中，我们需要更新代码以确保使用正确的权限获取了适当的访问令牌，并将它保存在缓存中，以便我们在后继的应用中使用它访问 Microsoft Graph。我们将添加 HttpClient 到我们的服务管线中，来支持我们随后有效的发出 HTTP 调用到 Microsoft.Graph。

```csharp
services.AddMicrosoftWebAppAuthentication(Configuration)
 .AddMicrosoftWebAppCallsWebApi(Configuration, new string[] { "User.Read", "Mail.Read" })
 .AddInMemoryTokenCaches();

services.AddHttpClient();
```

然后，我们需要更新在 FetchData.razor 页面中的代码来获取我们的电子邮件数据，来替代默认的天气数据。下面的代码包含了所有我们需要获取电子邮件并显示在页面上的代码。

```html
@page "/fetchdata"

@inject IHttpClientFactory HttpClientFactory
@inject Microsoft.Identity.Web.ITokenAcquisition TokenAcquisitionService

<h1>Weather forecast</h1>

<p>This component demonstrates fetching data from a service.</p>

@if (messages == null)
{
    <p><em>Loading...</em></p>
}
else
{
    <h1>Hello @userDisplayName !!!!</h1>

    <table class="table">
        <thead>
            <tr>
                <th>Subject</th>
                <th>Sender</th>
                <th>Received Time</th>
            </tr>
        </thead>
        <tbody>
            @foreach (var mail in messages)
            {
                <tr>
                    <td>@mail.Subject</td>
                    <td>@mail.Sender</td>
                    <td>@mail.ReceivedTime</td>
                </tr>
            }
        </tbody>
    </table>
}
@code {

    private string userDisplayName;
    private List<MailMessage> messages = new List<MailMessage>();

    private HttpClient _httpClient;

    protected override async Task OnInitializedAsync()
    {
        _httpClient = HttpClientFactory.CreateClient();


        // get a token
        var token = await TokenAcquisitionService.GetAccessTokenForUserAsync(new string[] { "User.Read", "Mail.Read" });

        // make API call
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var dataRequest = await _httpClient.GetAsync("https://graph.microsoft.com/beta/me");

        if (dataRequest.IsSuccessStatusCode)
        {
            var userData = System.Text.Json.JsonDocument.Parse(await dataRequest.Content.ReadAsStreamAsync());
            userDisplayName = userData.RootElement.GetProperty("displayName").GetString();
        }


        var mailRequest = await _httpClient.GetAsync("https://graph.microsoft.com/beta/me/messages?$select=subject,receivedDateTime,sender&$top=10");


        if (mailRequest.IsSuccessStatusCode)
        {
            var mailData = System.Text.Json.JsonDocument.Parse(await mailRequest.Content.ReadAsStreamAsync());
            var messagesArray = mailData.RootElement.GetProperty("value").EnumerateArray();


            foreach (var m in messagesArray)
            {
                var message = new MailMessage();
                message.Subject = m.GetProperty("subject").GetString();
                message.Sender = m.GetProperty("sender").GetProperty("emailAddress").GetProperty("address").GetString();
                message.ReceivedTime = m.GetProperty("receivedDateTime").GetDateTime();
                messages.Add(message);
            }
        }
    }


    public class MailMessage
    {
        public string Subject;
        public string Sender;
        public DateTime ReceivedTime;
    }
}
```

重新运行应用，并确保先登出当前的用户，因为当前的令牌没有包含正确的访问权限，并且我们已经修改了一些代码。你将会注意到再次登录的时候，我们的提示增加了新的访问权限，这意味着一切如我们所愿。现在，除了基本的用户资料数据，应该还可以请求访问我们的电子邮件数据。

![](https://developer.microsoft.com/en-us/identity/blogs/wp-content/uploads/2020/07/11.png)

在授权之后，我们被导航到了 "Fetch Data" 页面，可以看到一些电子邮件！

![](https://developer.microsoft.com/en-us/identity/blogs/wp-content/uploads/2020/07/12-1536x780.png)

如果你正确的如上演练，你现在应该可以看到类似上面图示中的你的电子邮件数据了。

### 总结

新的 Microsoft.Identity.Web 在简化验证和令牌管理方面做了出色的改进，你现在就应该开始使用它，在开始之前，有些事情值得你关注：

1. 与普通的支持动态/增加提醒的 Web 应用不同，在 Blazor 中，你需要在一开始为你的应用请求所有需要的权限。失败的话，将会导致 TokenAcruisition 方法不能根据新的权限验证用户。这是 Blazor 机制的一部分，所以在创建应用的时候要记住这一点。
2. 不是自己处理 Microsoft Graph HTTP 请求，你应该借助于 Microsoft Graph SDK，它简化了与 Microsoft Graph 的交互并提供了所有你需要序列化和反序列的对象。但是，在本示例中，我们仅仅遵循了建议 1，因为我们仅仅发出一个 Microsoft Graph 调用。

最后，你可以在 GitHub 上找到本示例 Blazor 应用程序的可运行示例的[所有的源代码](https://github.com/jpda/msiddev-blazor-aad-graph)，

### 参考

* [Microsoft.Identity.Web at NuGet](https://www.nuget.org/packages/Microsoft.Identity.Web/)


