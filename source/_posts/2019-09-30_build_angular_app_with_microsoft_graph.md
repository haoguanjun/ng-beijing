---
title: 
date: 2019-09-30
categories: angular graph
---
# 构建基于 Microsoft Graph 的 Angular 单页应用

该教程讲解如何构建使用 Microsoft Graph 的 Angular 单页应用，以获取用户的日程信息。

> 提示：如果您更希望下载完整的教程，可以从 [GitHub repository](https://github.com/microsoftgraph/msgraph-training-angularspa) 下载或者克隆。

## 1. 介绍

### 前置条件

在开始此教程之前，您应该已经在开发机上安装了  [Node.js](https://nodejs.org/) 。如果还没有，请访问这个链接并下载。

> 注意：该教程基于 Node 10.15.3 完成。此指南中的步骤也可能用于其它版本，但是并没有进行测试。

### 观看教程

该教程已经录制完成，可以在 Youtube 的 Office 开发频道中观看。

## 2. 创建 Angular 单页应用

打开命令行界面，导航到您有权限创建文件的目录，执行下列命令来安装  [Angular CLI](https://www.npmjs.com/package/@angular/cli) 工具，并创建新的  Angular 应用。

```bash
npm install -g @angular/cli
ng new graph-tutorial
```

Angular 将会提示很多信息，如下回答这两个：

```bash
? Would you like to add Angular routing? Yes
? Which stylesheet format would you like to use? CSS
```

一旦命令完成，进入到 `graph-tutorial` 目录中，然后，执行下述命令启动本地的 Web 服务器。

```bash
ng serve --open
```

您的默认浏览器将会打开并访问 https://localhost:4200/  地址来访问默认的 Angular 页面。如果您的浏览器没有打开，请打开浏览器并浏览地址 https://localhost:4200/  来验证新建的应用可以工作。

在继续下一步之前，请安装后面将会使用的附加包：

- [bootstrap](https://github.com/twbs/bootstrap) 用于装饰和公共的组件。
- [ng-bootstrap](https://github.com/ng-bootstrap/ng-bootstrap) 用来提供在 Angular 中使用 Bootstrap 组件.
- [angular-fontawesome](https://github.com/FortAwesome/angular-fontawesome) 提供在 Angular 中使用 FontAwesome 图标.
- [fontawesome-svg-core](https://github.com/FortAwesome/Font-Awesome), [free-regular-svg-icons](https://github.com/FortAwesome/Font-Awesome), 和[free-solid-svg-icons](https://github.com/FortAwesome/Font-Awesome) 用于示例应用使用 FontAwesome 图标。
- [moment](https://github.com/moment/moment) 用来格式化日期和时间.
- [msal-angular](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/README.md) 用于 Azure Active Directory 验证并获取访问令牌
- [rxjs-compat](https://github.com/ReactiveX/rxjs/tree/master/compat), 用于 `msal-angular` 包.
- [microsoft-graph-client](https://github.com/microsoftgraph/msgraph-sdk-javascript) 访问 Microsoft Graph 的客户端

执行如下命令完成安装：

```bash
npm install bootstrap@4.3.1 @fortawesome/angular-fontawesome@0.5.0 @fortawesome/fontawesome-svg-core@1.2.22
npm install @fortawesome/free-regular-svg-icons@5.10.2 @fortawesome/free-solid-svg-icons@5.10.2
npm install moment@2.24.0 moment-timezone@0.5.26 npm i 
npm install @azure/msal-angular@0.1.2 rxjs-compat@6.5.3 @microsoft/microsoft-graph-client@1.7.0
```

### 设计应用

从添加 Bootstrap CSS 开始，还有一些全局样式。打开 `./src/styles.css` 文件，并添加如下代码行。

```css
@import "~bootstrap/dist/css/bootstrap.css";

/* Add padding for the nav bar */
body {
  padding-top: 4.5rem;
}

/* Style debug info in alerts */
.alert-pre {
  word-wrap: break-word;
  word-break: break-all;
  white-space: pre-wrap;
}
```

然后，将 Bootstrap 和 FontAwesome 模块加入 app 中。打开 `/src/app/app.module.ts` ，并在文件开头加入如下的 `import` 语句。

```typescript
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { faUserCircle } from '@fortawesome/free-regular-svg-icons';
```

然后，在导入语句之后，加入如下的代码行。

```javascript
library.add(faExternalLinkAlt);
library.add(faUserCircle);
```

在 `@NgModule` 定义中，使用下面的代码行替换原来的 `imports` 数组。

```typescript
imports: [
  BrowserModule,
  AppRoutingModule,
  NgbModule,
  FontAwesomeModule
]
```

下面生成页面顶部的 Angular 导航组件。在 Angular CLI 中，执行如下命令。

```bash
ng generate component nav-bar
```

命令完成之后，打开 `./src/app/nav-bar/nav-bar.component.ts` 文件，使用下面的代码行替换原有内容。

```typescript
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent implements OnInit {

  // Should the collapsed nav show?
  showNav: boolean;
  // Is a user logged in?
  authenticated: boolean;
  // The user
  user: any;

  constructor() { }

  ngOnInit() {
    this.showNav = false;
    this.authenticated = false;
    this.user = {};
  }

  // Used by the Bootstrap navbar-toggler button to hide/show
  // the nav in a collapsed state
  toggleNavBar(): void {
    this.showNav = !this.showNav;
  }

  signIn(): void {
    // Temporary
    this.authenticated = true;
    this.user = {
      displayName: 'Adele Vance',
      email: 'AdeleV@contoso.com'
    };
  }

  signOut(): void {
    // Temporary
    this.authenticated = false;
    this.user = {};
  }
}
```

打开 `./src/app/nav-bar/nav-bar.component.html` 文件，使用下面的代码行替换原有内容。

```html
<nav class="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
  <div class="container">
    <a routerLink="/" class="navbar-brand">Angular Graph Tutorial</a>
    <button class="navbar-toggler" type="button" (click)="toggleNavBar()" [attr.aria-expanded]="showNav"
    aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" [class.show]="showNav" id="navbarCollapse">
      <ul class="navbar-nav mr-auto">
        <li class="nav-item">
          <a routerLink="/" class="nav-link" routerLinkActive="active">Home</a>
        </li>
        <li *ngIf="authenticated" class="nav-item">
          <a routerLink="/calendar" class="nav-link" routerLinkActive="active">Calendar</a>
        </li>
      </ul>
      <ul class="navbar-nav justify-content-end">
        <li class="nav-item">
          <a class="nav-link" href="https://docs.microsoft.com/graph/overview" target="_blank">
            <fa-icon [icon]="[ 'fas', 'external-link-alt' ]" class="mr-1"></fa-icon>Docs
          </a>
        </li>
        <li *ngIf="authenticated" ngbDropdown placement="bottom-right" class="nav-item">
          <a ngbDropdownToggle id="userMenu" class="nav-link" href="javascript:undefined" role="button" aria-haspopup="true"
            aria-expanded="false">
            <div *ngIf="user.avatar; then userAvatar else defaultAvatar"></div>
            <ng-template #userAvatar>
              <img src="user.avatar" class="rounded-circle align-self-center mr-2" style="width: 32px;">
            </ng-template>
            <ng-template #defaultAvatar>
              <fa-icon [icon]="[ 'far', 'user-circle' ]" fixedWidth="true" size="lg"
                class="rounded-circle align-self-center mr-2"></fa-icon>
            </ng-template>
          </a>
          <div ngbDropdownMenu aria-labelledby="userMenu">
            <h5 class="dropdown-item-text mb-0">{{user.displayName}}</h5>
            <p class="dropdown-item-text text-muted mb-0">{{user.email}}</p>
            <div class="dropdown-divider"></div>
            <a class="dropdown-item" href="javascript:undefined" role="button" (click)="signOut()">Sign Out</a>
          </div>
        </li>
        <li *ngIf="!authenticated" class="nav-item">
          <a class="nav-link" href="javascript:undefined" role="button" (click)="signIn()">Sign In</a>
        </li>
      </ul>
    </div>
  </div>
</nav>
```

然后，创建应用的首页，在 CLI 中执行如下命令

```bash
ng generate component home
```

命令完成之后，打开 `./src/app/home/home.component.ts` 文件，使用下面的代码行替换原有内容：

```typescript
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  // Is a user logged in?
  authenticated: boolean;
  // The user
  user: any;

  constructor() { }

  ngOnInit() {
    this.authenticated = false;
    this.user = {};
  }

  signIn(): void {
    // Temporary
    this.authenticated = true;
    this.user = {
      displayName: 'Adele Vance',
      email: 'AdeleV@contoso.com'
    };
  }
}
```

然后，打开 `./src/app/home/home.component.html` 文件，使用下面内容替换原有内容。

```html
<div class="jumbotron">
  <h1>Angular Graph Tutorial</h1>
  <p class="lead">This sample app shows how to use the Microsoft Graph API from Angular</p>
  <div *ngIf="authenticated; then welcomeUser else signInPrompt"></div>
  <ng-template #welcomeUser>
    <h4>Welcome {{ user.displayName }}!</h4>
    <p>Use the navigation bar at the top of the page to get started.</p>
  </ng-template>
  <ng-template #signInPrompt>
    <a href="javascript:undefined" class="btn btn-primary btn-large" role="button" (click)="signIn()">Click here to sign in</a>
  </ng-template>
</div>
```

下面创建提醒服务，应用使用它向用户显示信息。我们从创建简单的 `Alert` 类开始。在 `./src/app` 目录中创建名为 `alert.ts` 的文件，并添加如下代码。

```typescript
export class Alert {
  message: string;
  debug: string;
}
```

在你的 CLI 中，执行如下命令：

```bash
ng generate service alerts
```

命令完成之后，打开 `./src/app/alerts.service.ts` 文件，使用如下内容替换原有内容。

```typescript
import { Injectable } from '@angular/core';
import { Alert } from './alert';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {

  alerts: Alert[] = [];

  add(message: string, debug: string) {
    this.alerts.push({message: message, debug: debug});
  }

  remove(alert: Alert) {
    this.alerts.splice(this.alerts.indexOf(alert), 1);
  }
}
```

然后，生成用来显示提醒内容的 alert 组件，在 CLI 中，执行如下命令：

```bash
ng generate component alerts
```

命令完成之后，打开 `./src/app/alerts/alerts.component.ts` 文件，使用如下内容替换原有内容。

```typescript
import { Component, OnInit } from '@angular/core';
import { AlertsService } from '../alerts.service';
import { Alert } from '../alert';

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css']
})
export class AlertsComponent implements OnInit {

  constructor(private alertsService: AlertsService) { }

  ngOnInit() {
  }

  close(alert: Alert) {
    this.alertsService.remove(alert);
  }
}
```

打开 `./src/app/alerts/alerts.component.html` 文件，使用如下内容替换原有内容：

```html
<div *ngFor="let alert of alertsService.alerts">
  <ngb-alert type="danger" (close)="close(alert)">
    <p>{{alert.message}}</p>
    <pre *ngIf="alert.debug" class="alert-pre border bg-light p-2"><code>{{alert.debug}}</code></pre>
  </ngb-alert>
</div>
```

现在，这些基本组件已经定义完成了。使用它们更新应用。首先，打开 `./src/app/app-routing.module.ts` 文件，将 `const routes: Routes = [];` 这行内容换为 

```typescript
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
];
```

打开 `./src/app/app.component.html` 文件，将原有内容替换为如下代码：

```html
<app-nav-bar></app-nav-bar>
<main role="main" class="container">
  <app-alerts></app-alerts>
  <router-outlet></router-outlet>
</main>
```

保存所有的修改内容，并刷新浏览器页面，现在，应用应该看起来如下所示：

![](https://docs.microsoft.com/en-us/graph/tutorials/angular/tutorial/images/create-app-01.png)

## 在 Azure 门户注册应用

在该练习中，您将使用 Azure Active Directory 管理中心创建一个 Azure AD web 应用程序的注册。

1. 打开浏览器，导航到 [Azure Active Directory admin center](https://aad.portal.azure.com/)，使用您的个人账号或者工作或学校账号登录。

2. 在左边的导航面板中选择 `Azure Active Directory` ，然后在 `Manage` 下面选择 `App registrations`

   ![](https://docs.microsoft.com/en-us/graph/tutorials/angular/tutorial/images/aad-portal-app-registrations.png)

3. 选择 `New rigistration`。在 `Register an application` 页面中，设置如下值：

   * `Name` 设置为 `Angular Graph Tutorial`

   * `Supported account types` 设置为 `Accounts in any organizational directory and personal Microsoft accounts`

   * 在 `Redirect URI` 下面，设置为下拉列表的第一个 `Web`，将值设置为 `http://localhost:4200`

     ![](https://docs.microsoft.com/en-us/graph/tutorials/angular/tutorial/images/aad-register-an-app.png)

4. 选择注册。在 `Angular Graph Tutorial` 页面，复制 `Application (client) ID` 的值并保存，在下一节你会用到它。

   ![](https://docs.microsoft.com/en-us/graph/tutorials/angular/tutorial/images/aad-application-id.png)

5. 在 `Manage` 下面选择 `Authentication` 。找到 `Implicit grant` 一节，启用 `Access tokens` 和 `ID tokens`。选择保存。

   ![](https://docs.microsoft.com/en-us/graph/tutorials/angular/tutorial/images/aad-implicit-grant.png)


## 添加 Azure AD 验证

 在本节的练习中，您将扩展上一节创建的应用，以支持使用 Azure AD 进行验证。这对于使用 OAuth 访问令牌来访问 Microsoft Graph 是必须的。这里需要集成    [Microsoft Authentication Library for Angular](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/README.md) 到应用中。

在 `./src`目录中创建名为 `oauth.ts` 的文件，并添加如下代码：

```typescript
export const OAuthSettings = {
  appId: 'YOUR_APP_ID_HERE',
  scopes: [
    "user.read",
    "calendars.read"
  ]
};
```

将 `YOUR_APP_ID_HERE` 替换为为你在应用程序注册门户中得到的应用程序标识。

> 重要：
>
> 如果你使用了源代码管理，例如 Git。现在就是把 `oauth.ts` 从源代码管理中剔除的时机，以避免无意中泄露你的应用标识。

打开 `./src/app/app.module.ts` 文件，在文件的顶部的 `import` 代码后追加如下代码：

```typescript
import { MsalModule } from '@azure/msal-angular';
import { OAuthSettings } from '../oauth';
```

然后，将 `MsalModule` 包添加到`@NgModule` 定义中的 `imports` 数组中，并使用应用标识进行初始化。

```typescript
imports: [
  BrowserModule,
  AppRoutingModule,
  NgbModule,
  FontAwesomeModule,
  MsalModule.forRoot({
    clientID: OAuthSettings.appId
  })
],
```

### 实现登录

从定义简单的 `User` 类开始，以便保存应用显示的用户信息。在 `./src/app` 文件夹中创建名为 `user.ts` 的新文件，并添加如下行：

```typescript
export class User {
  displayName: string;
  email: string;
  avatar: string;
}
```

现在，创建验证服务。通过出创建此服务，你可以方便地将它注入到需要访问验证方法的任何组件中。在 CLI 中执行如下命令：

```bash
ng generate service auth
```

命令执行完成之后，打开 `./src/app/auth.service.ts` 文件，并使用如下内容替换。

```typescript
import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

import { AlertsService } from './alerts.service';
import { OAuthSettings } from '../oauth';
import { User } from './user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public authenticated: boolean;
  public user: User;

  constructor(
    private msalService: MsalService,
    private alertsService: AlertsService) {

    this.authenticated = false;
    this.user = null;
  }

  // Prompt the user to sign in and
  // grant consent to the requested permission scopes
  async signIn(): Promise<void> {
    let result = await this.msalService.loginPopup(OAuthSettings.scopes)
      .catch((reason) => {
        this.alertsService.add('Login failed', JSON.stringify(reason, null, 2));
      });

    if (result) {
      this.authenticated = true;
      // Temporary placeholder
      this.user = new User();
      this.user.displayName = "Adele Vance";
      this.user.email = "AdeleV@contoso.com";
    }
  }

  // Sign out
  signOut(): void {
    this.msalService.logout();
    this.user = null;
    this.authenticated = false;
  }

  // Silently request an access token
  async getAccessToken(): Promise<string> {
    let result = await this.msalService.acquireTokenSilent(OAuthSettings.scopes)
      .catch((reason) => {
        this.alertsService.add('Get token failed', JSON.stringify(reason, null, 2));
      });

    // Temporary to display token in an error box
    if (result) this.alertsService.add('Token acquired', result);
    return result;
  }
}
```

现在，你已经有了验证服务，它可以被注入到组件中完成登录。从 `NavBarComponent` 开始，打开文件 `./src/app/nav-bar.component.ts` 文件，进行如下的变更：

* 在文件开头添加 `import { AuthService } from '../auth.service';`

* 从类中删除  `authenticated` 和 `user` 属性， 并删除在 `ngOnInit` 中的设置代码。

* 将参数 `private authService: AuthService` 添加到构造函数中，以注入 `AuthService` 服务。

* 使用如下代码替换 `signin` 方法

  ```typescript
  async signIn(): Promise<void> {
    await this.authService.signIn();
  }
  ```

* 使用如下代码替换 `signOut()` 方法

  ```typescript
  signOut(): void {
    this.authService.signOut();
  }
  ```

完成之后，代码应该如下所示：

```typescript
import { Component, OnInit } from '@angular/core';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent implements OnInit {

  // Should the collapsed nav show?
  showNav: boolean;

  constructor(private authService: AuthService) { }

  ngOnInit() {
    this.showNav = false;
  }

  // Used by the Bootstrap navbar-toggler button to hide/show
  // the nav in a collapsed state
  toggleNavBar(): void {
    this.showNav = !this.showNav;
  }

  async signIn(): Promise<void> {
    await this.authService.signIn();
  }

  signOut(): void {
    this.authService.signOut();
  }
}
```

由于已经从类中删除了 `authenticated` 和`user`属性，你还需要更新 `./src/app/nav-bar/nav-bar.componet.html` 文件。打开该文件并进行如下变更：

* 将所有的 `authenticated`  替换为 `authService.authenticated`
* 将所有的 `user` 替换为 `authService.user`

然后，更新 `HomeComponent` 类，如同在 `NavBarComponent` 中所作的所有修改一样变更 `./src/app/home/home.component.ts` ：

* 在 `HomeComponent` 中没有 `signOut` 方法

* 使用稍有不同的版本来替换 `signIn` 方法。该代码调用 `getAccessToken()` 来获得访问令牌，现在，将会作为错误输出该令牌。

  ```typescript
  async signIn(): Promise<void> {
    await this.authService.signIn();
  
    // Temporary to display the token
    if (this.authService.authenticated) {
      let token = await this.authService.getAccessToken();
    }
  }
  ```

完成之后，文件内容应当如下所示：

```typescript
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private authService: AuthService) { }

  ngOnInit() {
  }

  async signIn(): Promise<void> {
    await this.authService.signIn();

    // Temporary to display the token
    if (this.authService.authenticated) {
      let token = await this.authService.getAccessToken();
    }
  }
}
```

 最后，如同对 NavBar 中的变更一样修改 `./src/app/home/home.component.html` 文件。

保存所有的修改，刷新浏览器，点击 `Click here to login` 按钮，你应当被重定向到 `https://login.microsoftonline.com` 。使用你的微软账号登录，并同意要求的权限。应用页面将会刷新，显示访问令牌。

### 获取用户信息

 当前，验证服务设置两用户显示名称和电子邮件地址的常量。现在你已经有了访问令牌，你可以从 Microsoft Graph 来获取关联到当前用户的详情内容。打开 `./src/app/auth.service.ts` 文件，在文件开否添加如下的导入语句：

```typescript
import { Client } from '@microsoft/microsoft-graph-client';
```

在 `AuthService` 服务中添加新的名为 `getUser` 的函数：

```typescript
private async getUser(): Promise<User> {
  if (!this.authenticated) return null;

  let graphClient = Client.init({
    // Initialize the Graph client with an auth
    // provider that requests the token from the
    // auth service
    authProvider: async(done) => {
      let token = await this.getAccessToken()
        .catch((reason) => {
          done(reason, null);
        });

      if (token)
      {
        done(null, token);
      } else {
        done("Could not get an access token", null);
      }
    }
  });

  // Get the user from Graph (GET /me)
  let graphUser = await graphClient.api('/me').get();

  let user = new User();
  user.displayName = graphUser.displayName;
  // Prefer the mail property, but fall back to userPrincipalName
  user.email = graphUser.mail || graphUser.userPrincipalName;

  return user;
}
```

从 `signIn()` 方法中找到并删除如下代码行：

```typescript
// Temporary placeholder
this.user = new User();
this.user.displayName = "Adele Vance";
this.user.email = "AdeleV@contoso.com";
```

在原来的位置，添加如下的代码：

```typescript
this.user = await this.getUser();
```

新的代码使用 Microsoft Graph SDK 来获取用户详情，然后使用 API 调用返回的值来创建 `User` 对象实例。

现在，修改 `AuthService` 的构造函数，并检查如果用户已经登录，就直接加载用户详情。使用如下代码替换原有内容：

```typescript
constructor(
  private msalService: MsalService,
  private alertsService: AlertsService) {

  this.authenticated = this.msalService.getUser() != null;
  this.getUser().then((user) => {this.user = user});
}
```

最后，从 `HomeComponent` 类中删除临时代码，打开 `./src/app/home/home.component.ts` 文件，使用如下代码替换现有的 `signIn()` 函数。

```typescript
async signIn(): Promise<void> {
  await this.authService.signIn();
}
```

现在，如果你保存所有的变更，并运行应用，在登录之后，你应当返回到应用的首页，但是界面已经发生了变化，以指示你已经登录。

![](https://docs.microsoft.com/en-us/graph/tutorials/angular/tutorial/images/add-aad-auth-01.png)

点击右上角的用户头像，访问 `Sign Out` 链接，点击 `Sign Out` 重置会话，然后返回应用首页。

![](https://docs.microsoft.com/en-us/graph/tutorials/angular/tutorial/images/add-aad-auth-02.png)

### 存储并刷新令牌

此刻，你的应用已经拥有了访问令牌，它可以在访问 API 的时候通过 `Authorization` 请求头发送。它就是允许代理用户访问 Microsoft Graph 的令牌。

但是，该令牌是短时有效的。该令牌将在颁发之后的 1 小时后过期。因为应用使用了 MSAL 库。你不必自己实现任何的令牌存储或者刷新功能。`MsalService` 会在浏览器存储中缓存令牌。`acquireTokenSilent` 方法首先检查缓存的令牌，如果没有过期，就返回它。如果过期了，它会发出一个静默请求来申请新的令牌。



## See also

* [Build Angular single-page apps with Microsoft Graph](https://docs.microsoft.com/en-us/graph/tutorials/angular)
* [Create an Angular single-page app](https://docs.microsoft.com/en-us/graph/tutorials/angular?tutorial-step=1)
* [Register the app in the portal](https://docs.microsoft.com/en-us/graph/tutorials/angular?tutorial-step=2)
* [Add Azure AD authentication](https://docs.microsoft.com/en-us/graph/tutorials/angular?tutorial-step=3)
* [Get calendar data](https://docs.microsoft.com/en-us/graph/tutorials/angular?tutorial-step=4)
* [Congratulations!](https://docs.microsoft.com/en-us/graph/tutorials/angular?tutorial-step=5)
* [Video](https://www.youtube-nocookie.com/embed/KUPRTTOUzz8)
