---
title: 在 Angular 中使用 ADAL.js     
date: 2019-04-22
categories: angular oauth
---
该文介绍了如何在 Angular 应用中集成 Microsoft Azure Active Directory，使用 OpenID Connect 隐式流方案实现验证和授权。
该示例使用了微软提供的 ADAL.js 脚本客户端。
<!-- more -->
# 在 Angular 中使用 ADAL.js

## 摘要

该文介绍了使用 PathLocationStrategy 的实现，和涉及的 Angular 特性，例如：HttpInterceptor 和 InjectionToken.

## 项目

项目使用 Angular CLI 创建，使用了 Bootstrap 来创建基本的布局，顶部导航条提供了登入/登出按钮，使用 ADAL.js 来触发 OpenID Connect 隐式流 。关于 OpenID Connect 和 AAD 的详细说明，[请查阅这里](https://docs.microsoft.com/en-us/azure/active-directory/develop/v1-protocols-openid-connect-code)

图 1 创建项目

![](https://40jajy3iyl373v772m19fybm-wpengine.netdna-ssl.com/wp-content/uploads/sites/31/2019/04/1_thumb1.png)

## 在 Azure 活动目录中注册应用

必须首先在 Azure 活动目录中注册应用。

第一个应用名为 **Client-App**, 作为消费端，它将使用 OpenID Connect 隐式流来获取用户的标识和声明。关于 JWT 令牌中的声明，[请查看这里](https://docs.microsoft.com/en-us/azure/active-directory/develop/id-tokens)。

第二个应用名为 **Server-APP**, 它提供 WebAPI 资源。当路由激活的时候， **Client-App** 将从 **Server-App** 请求 access token ，该 access token 将被用于 HttpRequest Authorization 头/Bearer Token 以便提供 WebAPI 的授权检查。

### Client-App 设置

1. 在 Azure Portal 中，导航到 Azure Active Direction > App registrations，点击 **New application registration**
2. 名称设置为 **Client-App**
3. 应用类型设置为 **Web app/API**
4. Sign-On URL 配置为：**http://localhost:4200/frameredirect**
5. 点击 **Create** 按钮完成创建

### Server-App 设置

1. 在 Azure Portal 中，导航到 Azure Active Direction > App registrations，点击 **New application registration**
2. 名称设置为 **Service-App**
3. 设置应用类型为 **Web app/API**
4. Sign-On URL 配置为：https://localhost:44351
5. 点击 **Create** 按钮完成创建

编辑 **Client-App** 应用，点击 Edit Manafest, 将属性 oauth2AllowImplicitFlow 设置为 **true** ，然后保存。

编辑 **Client-App** 应用，点击 Settings > Required permissions > Add > Select an API

* 搜索 **Server-App**, 并选中
* 选中复选框 **Delegated Permissions**, 保存
* 最后，点击 **Grant Permissions**

关于应用注册的更多信息，参见如下文章

* <https://docs.microsoft.com/en-us/azure/active-directory/active-directory-app-registration>

* <https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-v1-add-azure-ad-app>

## 关键实现细节

### DAL 配置

现在使用 InjectToken 来封装用于 WebAPI 的配置，包括：Client ID, TenantID, ResourceID 和 endpoint 等等。配置服务用于构建用于 ADAL.js 的最小设置。[这里](https://github.com/AzureAD/azure-activedirectory-library-for-js/wiki/Config-authentication-context)你可以发现完整的配置内容。在 Angular 应用中，整个配置通过 value provider 来实现。

图 2 在 app.config.js 中定义 InjectionToken

![](https://40jajy3iyl373v772m19fybm-wpengine.netdna-ssl.com/wp-content/uploads/sites/31/2019/04/2_thumb1.png)

图 3 通过值提供器配置

![](https://40jajy3iyl373v772m19fybm-wpengine.netdna-ssl.com/wp-content/uploads/sites/31/2019/04/3_thumb1.png)

图 4 在 adal-config.service.ts 中配置 ADAL.js

![](https://40jajy3iyl373v772m19fybm-wpengine.netdna-ssl.com/wp-content/uploads/sites/31/2019/04/4_thumb1.png)

### ADAL.js 封装器

类似原生实现，我们封装 ADAL.js AuthenticationContext 作为一个可注入的服务。需要注意的是函数 acquireTokenResilient，我们使用了一个简单的 retry 策略来获取令牌。

图 5 adal.service.ts 中的 ADAL.js 封装器

![](https://40jajy3iyl373v772m19fybm-wpengine.netdna-ssl.com/wp-content/uploads/sites/31/2019/04/5_thumb1.png)

### 守卫受保护的路由

如果没有提供用户信息，CanActivate 将导航到路由 AccessDenied 。

图 6 使用 Guard 实现强制授权检查

 ![](https://40jajy3iyl373v772m19fybm-wpengine.netdna-ssl.com/wp-content/uploads/sites/31/2019/04/6_thumb.png)

### HttpClient 和 Bearer Token

新的实现使用 Angular HttpInterceptor 来处理用于 WebAPI 的带有 Authorization 头的 HttpRequest。使用 HttpInterceptor 持有 BaseService HttpClient 从 AdalService 解耦。

图 7 auth-interceptor.ts 中

![](https://40jajy3iyl373v772m19fybm-wpengine.netdna-ssl.com/wp-content/uploads/sites/31/2019/04/7_thumb.png)

### 处理重定向和处理 id_token

成功授权之后，在 Client-App 中，OpenID Connect 将使用 redirect_uri 设置重定向回我们的应用程序。路由 frameredirect 配置为处理该回调，在 URI 的 # 中包含了 id_token。frameredirect 组件调用 ADAL.js 的 AuthenticationContext.handleWindowCallback 来从 URL 中提取和缓存该 id_token。你可以在这里做额外的工作，但是，示例中仅仅回调到 home 路由。

图 8 *FramedRedirect HomeComponent invoking ADAL.js handleCallback*

![](https://40jajy3iyl373v772m19fybm-wpengine.netdna-ssl.com/wp-content/uploads/sites/31/2019/04/8_thumb.png)

## 效果展示

图 9 没有授权的初始状态

![](https://40jajy3iyl373v772m19fybm-wpengine.netdna-ssl.com/wp-content/uploads/sites/31/2019/04/9_thumb.png)

图 10 用户点击登录

![](https://40jajy3iyl373v772m19fybm-wpengine.netdna-ssl.com/wp-content/uploads/sites/31/2019/04/10_thumb.png)

图 11 通过 Server-App 资源使用 Authorization 头调用 WebAPI

![](https://40jajy3iyl373v772m19fybm-wpengine.netdna-ssl.com/wp-content/uploads/sites/31/2019/04/11_thumb.png)



## See also

* [Active Directory Authentication Library (ADAL) for JavaScript](<https://github.com/AzureAD/azure-activedirectory-library-for-js>)
* [Using ADAL.js with Angular4+](<https://devblogs.microsoft.com/premier-developer/using-adal-js-with-angular4/>)
