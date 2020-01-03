---
title: 使用 OpenID Connect、Angular CLI 和 oidc-client 进行 SPA 验证   
date: 2020-01-03
categories: 
    - oidc-client.js
    - angular
---
使用 oidc-client.js 在 Angular 应用中对 OpenID Connect 提供支持。
<!-- more -->

# 使用 OpenID Connect、Angular CLI 和 oidc-client 进行 SPA 验证

OpenID Connect 作为现代的验证协议，特别是在 SPA 应用程序，或者常见的客户端应用程序中。我经常建议使用的客户端是 oidc-client，它是 IdentityModel OSS 项目中提供的纯 JavaScript 库。它处理所有与 OpenID Connect Provider 之间的所有协议交互，包括令牌检验 (很奇怪有些库把它忽略了)，并且是  [certified OpenID Connect Relying Party](https://openid.net/certification/#RPs)，符合隐式 RP 和配置 RP 配置文件。

在本文中，我们将使用 Angular CLI 和 oidc-client 库来演练基本的验证场景，我们将验证一个用户，然后使用 `access token` 来访问使用 OAuth 保护的 API。这里将使用 `implicit flow`，这里所有的 token 通过浏览器传递 (在客户端处理的时候一定要记住，)

> 关于使用哪个流程的建议发生了一些变化。我建议现在坚持这篇文章,然后阅读一个改进文档: [迁移oidc客户端-js使用OpenID连接授权代码流和PKCE](https://www.scottbrady91.com/Angular/Migrating-oidc-client-js-to-use-the-OpenID-Connect-Authorization-Code-Flow-and-PKCE)。迁移代价微不足道。

## Angular CLI 初始化

为了保持文章内容的简单，我们使用 Angular CLI 来创建我们的 Angular 应用程序，它支持基本的路由。如果你不使用 Angular CLI，也没有问题，该文章中的 OpenID Connect 实现支持所有的 Angular 4 应用程序。

如果你还没有准备好，首先需要安装 Angular CLI 作为全局包

```bash
npm install -g @angular/cli
```

然后使用 CLI 创建一个带有路由支持的应用程序，现在跳过测试支持。

```bash
ng new angular4-oidcclientjs-example –-routing true --skip-tests
```

这就会初始化我们教程所需要的所有支持了。你应该已经可以运行该应用程序了。

```bash
ng serve
```

现在，如果你在浏览器中访问我们的站点，默认的地址是 http://localhost:4200，我们应该已经可以看到一个欢迎页面了。

## 受保护的组件和路由守卫

### 受保护的组件

现在我们创建一个需要用户验证之后才能访问的组件 protected，我们使用 Angular CLI 来创建该组件。

```bash
ng generate component protected
```

在创建该组件之后，CLI 会自动将该组件添加到 `app.module` 中，但是，需要手工添加到路由系统中，以便能够访问它。因此，需要修改 `app-routing.module` 

```typescript
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProtectedComponent } from './protected/protected.component';

const routes: Routes = [
    {
        path: '',
        children: []
    },
    {
        path: 'protected',
        component: ProtectedComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
```

这里我们导入了组件，注册了 /protected 路径。

现在，我们更新  `app.component.html` ，添加一个链接到该组件的导航。

```html
<h3><a routerLink="/">Home</a> | <a routerLink="/protected">Protected</a></h3>
<h1>
  {{title}}
</h1>
<router-outlet></router-outlet>
```

### 路由守卫

现在我们有了页面，让我们把它保护起来！ 我们可以使用带有 `CanActivate` 的守卫来实现。这意味着该守卫可以在路由之前提供处理逻辑来决定是否路由可以激活使用。现在我们先返回 `false` ，这将防止访问受保护的路由。

使用 CLI 创建该守卫

```bash
ng generate service services\authGuard
```

然后从 `angular/router` 导入  `CanActivate` , 实现我们的服务，然后直接返回 `false`。最小化的路由守卫看起来如下所示，但是，也欢迎你实现需要的完整逻辑。

```javascript
import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

@Injectable()
export class AuthGuardService implements CanActivate {
        canActivate(): boolean {
            return false;
        }
}
```

现在需要在 `app.module` 的 `NgModule` 中注册我们的路由守卫，这也不会自动完成。

```typescript
import { AuthGuardService } from './services/auth-guard.service';

@NgModule({
    // declarations, imports, etc.
    providers: [AuthGuardService]
})
```

最后，在 `app-routing.module` 中使用该路由守卫。

```typescript
import { AuthGuardService } from './services/auth-guard.service';

const routes: Routes = [
  // other routes
  {
    path: 'protected',
    component: ProtectedComponent,
    canActivate: [AuthGuardService]
  }
];
```

现在回到应用，访问受保护的组件，你应该看到它不再可以访问了。

### 使用 oidc-client 进行验证

现在我们有了资源和守卫，让我们创建一个服务来处理验证和管理用户的 Session。首先创建名为 `AuthService` 的服务。

```bash
ng generate service services\auth
```

然后，在 `app.module` 中注册。

```typescript
import { AuthService } from './services/auth.service';

@NgModule({
    // declarations, imports, etc.
    providers: [AuthGuardService, AuthService]
})
```

为了处理所有与 OpenID Connect Provider 的交互，引入 `oidc-client` ，在 package.json 中添加它。

```javascript
"oidc-client": "^1.3.0"
```

还需要在 peer dependency 中添加：

```javascript
"babel-polyfill": "^6.23.0"
```

不要忘了使用 npm 安装它们。

安装之后，在 `AuthService` 中导入 `UserManager` 和 `UserManagerSettings` ，以及 `User` 。

```javascript
import { UserManager, UserManagerSettings, User } from 'oidc-client';
```



#### UserManager

`oidc-client` 库的入口是 `UserManager`。这是我们所有与 OpenID Connect 交互的位置。另一个选择是使用 `OidcClient`，但是，它仅仅管理协议支持。在本文中，我们使用 `UserManager` 来处理所有的用户管理。

`UserManager` 构造函数需要一个 `UserManagerSettings` 对象。这里我们硬编码这些设置，但是在产品中，它们应当使用你的环境配置来初始化。

```javascript
export function getClientSettings(): UserManagerSettings {
    return {
        authority: 'http://localhost:5555/',
        client_id: 'angular_spa',
        redirect_uri: 'http://localhost:4200/auth-callback',
        post_logout_redirect_uri: 'http://localhost:4200/',
        response_type:"id_token token",
        scope:"openid profile api1",
        filterProtocolClaims: true,
        loadUserInfo: true
    };
}
```

如果你熟悉 OpenID Connect Provider 的话，这些设置应该能够识别出来。

* `authority`，OpenID Connect Provider 的 Url 地址
* `client_id`，客户端应用在 OpenID Connect Provider 上注册的客户端标识
* `redirect_uri`，客户端注册的回调地址。
* `response_type`，可以理解为请求的 token 类型，在本例中，id_token 用来标识验证的用户，另一个 access token 用来访问受保护的资源。还可以有 `code`，对于客户端/Web 应用并不适合，它需要使用客户端的凭据来交换令牌。
* `scope`，应用程序需要访问的 `scope`，在本例中，我们请求两个 scopes：`openid`和 `profile`，它们将允许我们访问关于用户的某些声明，和一个 API 的 scope `api1`，它允许我们访问受到 OpenID Connect Provider 保护的 API

这些设置是创建 UserManager 所必须的，我们还包括了一些可选的设置：

* `post_logout_redirect_uri`，它是注册在 OpenID Connect Provider 中，在用户登出之后重定向的 Url 地址
* `filterProtocolClaims`，它阻止协议水平的声明，例如从 Identity Server 作为 profile 数据提取的 `nbf`，`iss`， `at_hash` 和 `nonce`。这些声明在令牌验证之外没有特别有用。
* `loadUserInfo`，允许库自动使用获取的 access token 访问 OpenID Connect Provider 来获取用户信息。为了获取关于验证的用户的额外信息，该设置默认为 `true`

当前，我们使用 OpenID Connect 元数据端点来实现自动发现，但是，如果这不适合你 (可能发现端点不支持 CORS)，UserManager 也可以手动配置，请查看  [configuration section](https://github.com/IdentityModel/oidc-client-js/wiki#configuration)  文档。

oidc-client 默认使用浏览器的 session 存储。还可以使用 local storage，但是，在某些国家可能有隐私影响，由于你可能将私人信息存储到磁盘上。切换到 local storage，你需要导入 `WebStorageStateStore` 并设置 UserManager 的 `userStore` 属性为：

```javascript
userStore: new WebStorageStateStore({ store: window.localStorage })
```

在我们的 `AuthService` 中，使用你的设置来初始化 UserManager。

```typescript
private manager = new UserManager(getClientSettings());
```

然后，创建一个内部的成员来保存当前用户，它将在构造函数中初始化。

```typescript
private user: User = null;

constructor() {
    this.manager.getUser().then(user => {
        this.user = user;
    });
}
```

这里，我们使用了 oicd-client 的 `getUser` 方法。该方法加载当前通过验证的用户，通过检查配置中的存储 (现在是 Session 存储)。方法的返回值是一个 `Promise`，所以，我们将返回的值保存到内部成员中，以便以后方便访问。下面我们将使用 `User` 对象。

### AuthService

我们将创建 5 个方法：

1. `isLoggedIn`
2. `getClaims`
3. `getAuthorizationHeaderValue`
4. `startAuthentication`
5. `completeAuthentication`

我们从 `isLoggedIn` 开始，这里我们将检查我们是否已经拥有一个用户，以及是否还没有过期。这可以通过它的 `expired` 属性来知道，它将检查用户的访问令牌是否已经过期。

```typescript
isLoggedIn(): boolean {
    return this.user != null && !this.user.expired;
}
```

`getClaims` 简单地返回用户的声明。它保存在用户的 `profile` 属性中。因为我们设置了 `filterProtocolClaims` 为 `true`，这些声明更有意义。

```typescript
getClaims(): any {
    return this.user.profile;
}
```

`getAuthorizationHeaderValue` 用来从用户对象生成 HTTP 的 `authorization` 请求头。这需要使用获取的令牌类型和访问令牌本身。在访问受到保护的 API 时，我们将看到如何使用。

```typescript
getAuthorizationHeaderValue(): string {
    return `${this.user.token_type} ${this.user.access_token}`;
}
```

为了实现笨重的协议交互，我们需要 `startAuthentication()` 和 `completeAuthentication()` 方法。

它们将处理我们的 OpenID Connect 验证请求，使用 oidc-client 的 `signinRedirect` 和 `signRedirectCallback` 方法。在调用之后，将使用 UserManagerSettings 中的设置，自动将用户重定向到 OpenID Connect Provider 。还可以使用使用 `signinPopup` 和 `signinPopupCallback` ，这将打开新窗口，而不是使用重定向。

```typescript
startAuthentication(): Promise<void> {
    return this.manager.signinRedirect();
}

completeAuthentication(): Promise<void> {
    return this.manager.signinRedirectCallback().then(user => {
        this.user = user;
    });
}
```

`signInRedirect()`  将生成授权请求到我们的 OpenID Connect Provider 服务器，处理 `state` 和 `nonce`，如果需要的话，访问元数据端点。

通过验证之后，回调函数将会被调用并传入令牌，包括可令牌的验证。如果 `loadUserInfo` 设置为 `true`，它将访问用户信息端点来获取额外的被授权用户的信息。该方法返回被验证用户的 `Promise`，我们可以把它保存到本地。

### 路由守卫

现在，更新我们的路由守卫来使用新创建的 `AuthService`，检查用户是否已经登录，否则，启动验证过程。

```typescript
import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

import { AuthService } from '../services/auth.service'

@Injectable()
export class AuthGuardService implements CanActivate {

    constructor(private authService: AuthService) { }

    canActivate(): boolean {
        if(this.authService.isLoggedIn()) {
            return true;
        }

        this.authService.startAuthentication();
        return false;
    }
}
```

### 回调端点

我们还需要另外的一个组件来完成验证。它是验证的回调组件，帮助我们获取从 OpenID Connect Provider 返回的 identity 和访问令牌，使用 oidc-client 库完成验证过程。通过创建另一个组件可以完成，我们称为 `auth-callback` 组件，使用它映射到 `redirect uri`，使用 CLI 创建它。

```bash
ng generate component auth-callback
```

然后，导入我们的 `AuthService` 服务，通过构造函数注入，在 `ngOnInit`中调用它的 `completeAuthentication()` 方法。

```typescript
constructor(private authService: AuthService) { }

ngOnInit() {
    this.authService.completeAuthentication();
}
```

又一次，我们将该组件添加到路由系统中，映射的 path 就是我们在 OpenID Connect Provider 中注册的 Url。

```type
import { AuthCallbackComponent } from './auth-callback/auth-callback.component';

const routes: Routes = [
    // other routes
    {
        path: 'auth-callback',
        component: AuthCallbackComponent
    }
];
```

现在，在我们尝试访问受到保护的组件时，我们将被自动重定向到 OpenID Connect Provider 。一旦通过验证，我们将返回到我们的 `auth-callback` 页面，我们的令牌在 url 片段中，如果你现在检查 session 存储，应该发现一个新的名为：`oidc.user:http://localhost:5555/:angular_spa` 的键，它的值为 JSON ，其中包含了我们的 identity token，access token token type 和用户描述数据。

### Redirects

现在在用户验证之后，被返回到了 `callback` 地址，这样的用户体验不好。相反，我们应该记录用户试图访问的收保护的资源地址，一旦通过验证返回到应用中，`callback` 页面应该将用户重定向回到期望的页面。这取决于你希望如何处理，以前我看到过有人将地址记录到 session/local storage 中。

## 访问受到保护的 API

目前，我们受保护的资源在应用程序内部，在用户访问之前强制用户通过授权。但是，在访问受到 OpenID Connect Provider 保护的 API 时，怎么处理呢？作为验证的一部分，我们已经请求了访问令牌，所以，我们使用它来授权访问 API。

首先，生成一个新的组件，我们在其中访问 API

```bash
ng generate component call-api
```

然后，将它添加到路由系统中去。

```typescript
import { CallApiComponent } from './call-api/call-api.component';

const routes: Routes = [
    // other routes
    {
        path: 'call-api',
        component: CallApiComponent,
        canActivate: [AuthGuardService]
    }
];
```

我们需要使用 `HttpClientModule` ，在 `app.module` 中导入它。

```typescript
import { HttpClientModule } from '@angular/common/http';

@NgModule({
    // declarations, providers, etc.
    imports: [HttpClientModule]
})
```

在组件内部，通过构造函数来注入安全服务，还有 `angular/common/http` 中的 http 服务。

```typescript
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { AuthService } from '../services/auth.service'

@Component({
    selector: 'app-call-api',
    templateUrl: './call-api.component.html',
    styleUrls: ['./call-api.component.css']
})
export class CallApiComponent implements OnInit {

    constructor(private http: Http, private authService: AuthService) { }
    ngOnInit() {
    }
}
```

在 `ngOnInit` 中设置 `authorization` 请求头，然后访问 API。我们获取响应后，保存到内部的成员中。

```typescript
export class CallApiComponent implements OnInit {
    response: Object;
    constructor(private http: HttpClient, private authService: AuthService) { }

    ngOnInit() {
        let headers = new HttpHeaders({ 'Authorization': this.authService.getAuthorizationHeaderValue() });

        this.http.get("http://localhost:5555/api", { headers: headers })
          .subscribe(response => this.response = response);
    }
}
```

该演示 API 简单地返回一些文本，它要求使用由 http://localhost:5555 服务器颁发的 `bearer` 类型的 `api1` 的  token。

在组件的 html 中，我们显示这些响应文本。

```html
<p>
    Response: {{response}}
</p>
```

最后，更新主页面，包含该功能的链接。

```html
<h3>
    <a routerLink="/">Home</a>
    | <a routerLink="/protected">Protected</a> 
    | <a routerLink="/call-api">Call API</a>
</h3>
<h1>
  {{title}}
</h1>
<router-outlet></router-outlet>
```



### Token Expiration

现在，如果你的访问令牌过期了，会发生两件事中的其一：

* 在下一次访问受保护页面的时候，`AuthService` 服务将检测到你已经登出了
* 或者从 API 得到一个 401 未授权的访问

第一种场景还好，我们的验证服务会自动将用户重定向到 identity server 进行验证，并返回新的访问令牌。但是，对于第二种场景，可能导致数据丢失，例如，刚刚填写的表单数据。由于在使用隐式流的时候，我们不能刷新令牌，我们不得不使用另外一种方式，这就是 OIDC-client 提供的静默刷新功能，你可以阅读  [Silent Refresh - Refreshing Access Tokens when using the Implicit Flow](https://www.scottbrady91.com/OpenID-Connect/Silent-Refresh-Refreshing-Access-Tokens-when-using-the-Implicit-Flow)  这篇文章。



## See also:

* [SPA Authentication using OpenID Connect, Angular CLI and oidc-client](https://www.scottbrady91.com/Angular/SPA-Authentiction-using-OpenID-Connect-Angular-CLI-and-oidc-client)   
* [Silent Refresh - Refreshing Access Tokens when using the Implicit Flow](https://www.scottbrady91.com/OpenID-Connect/Silent-Refresh-Refreshing-Access-Tokens-when-using-the-Implicit-Flow)    
* [Migrating oidc-client-js to use the OpenID Connect Authorization Code Flow and PKCE](https://www.scottbrady91.com/Angular/Migrating-oidc-client-js-to-use-the-OpenID-Connect-Authorization-Code-Flow-and-PKCE)




