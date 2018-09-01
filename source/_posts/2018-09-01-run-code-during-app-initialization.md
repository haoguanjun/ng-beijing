---
title: 在应用初始化期间运行代码  
date: 2018-09-01
categories: angular
---
想象一下，您的应用需要一些动态配置信息，这些信息在应用启动之前需要动态获取，并在应用运行中使用。
显然不能直接写道静态配置文件中，但是从客户端发出的请求又是一个异步请求，如何协调这个问题呢？
<!-- more -->

想象一下，您的应用需要一些动态配置信息，这些信息在应用启动之前需要动态获取，并在应用运行中使用。  

显然不能直接写道静态配置文件中，但是从客户端发出的请求又是一个异步请求，如何协调这个问题呢？

这里，我想向您演示，如何在 Angular 应用初始化期间，使用 APP_INITIALIZER 注入器来获取应用的动态配置信息。

#### 什么是 APP_INITIALIZER 注入器
APP_INITIALIZER 是允许您在 Angular 初始化七千处理您自己任务的机制。它既可以用于 AppModule，核心模块，也可以用于您自己的应用加载模块中。典型的场景是应用加载之前做的事情，比如从服务处加载用于设置应用的配置信息。在示例中，我们使用它从服务器的 XML 配置文件中加载应用的设置信息。

#### 创建 AppLoad 模块
尽管不是必要，通过创建 App Load module 还是对应用加载有助于隔离。

```typescript
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule } from "@angular/common/http";
 
import { AppLoadService } from './app-load.service';
 
export function init_app(appLoadService: AppLoadService) {    return () => appLoadService.initializeApp();
}
 
export function get_settings(appLoadService: AppLoadService) {    return () => appLoadService.getSettings();
}
 
@NgModule({
  imports: [HttpClientModule],
  providers: [
    AppLoadService,
    { provide: APP_INITIALIZER, useFactory: init_app, deps: [AppLoadService], multi: true },
    { provide: APP_INITIALIZER, useFactory: get_settings, deps: [AppLoadService], multi: true }
  ]
})
export class AppLoadModule { }
```

注意一下几点：

##### APP_INITIALIZER 导入自 @angular/core

这里有多个 APP_INITIALIZER，它们在应用初始化过程中并发执行，直到它们全部完成。

　　使用 nulti: true 用于多个注入器，如果只有一个，使用 multi: false。

##### 工厂函数 init_app 和 get_settings 应当返回一个返回 Promise 的函数。

##### 该模块必须添加到 AppModule 的导入数组中。

#### 创建 App Load Service
AppLoadService 应当隔离您在应用初始化期间的作为。当然这不是必须的，您可以使用任何需要的服务。

这里实现了两个方法我们在前面代码中使用的方法。在我们的 AppLoadModule 中作为依赖注入到提供器数组中。

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import 'rxjs/add/operator/toPromise';
 
import { APP_SETTINGS } from '../settings';
 
@Injectable()
export class AppLoadService {
 
  constructor(private httpClient: HttpClient) { }
 
  initializeApp(): Promise<any> {    return new Promise((resolve, reject) => {
          console.log(`initializeApp:: inside promise`);
 
          setTimeout(() => {
            console.log(`initializeApp:: inside setTimeout`);            // doing something 
            resolve();
          }, 3000);
        });
  }
 
  getSettings(): Promise<any> {
    console.log(`getSettings:: before http.get call`);    
    const promise = this.httpClient.get('http://private-1ad25-initializeng.apiary-mock.com/settings')
      .toPromise()
      .then(settings => {
        console.log(`Settings from API: `, settings);
 
        APP_SETTINGS.connectionString = settings[0].value;
        APP_SETTINGS.defaultImageUrl = settings[1].value;
 
        console.log(`APP_SETTINGS: `, APP_SETTINGS); 
        return settings;
      }); 
    return promise;
  }
}
```

注意以下几点：

initializeApp 用于等待 3 秒，并输出日志来显示两个方法是并行执行的。

getSettings 调用一个模拟的我使用 APIARY 创建的 API 来或者设置。

　　这里使用这些设置来设置 APP_SETTINGS 对象的

　　它们都返回 Promise 

##### 运行应用
运行应用，可以在 Console 中查看如下输出
![](https://img1.mukewang.com/5b1b7e0f0001237413960412.jpg)

##### 注意：

您可以看到两个方法都被调用了。

设置首先返回

 initializeApp 最后完成，然后应用启动。

如何从 settings 中获取 API 的地址？

有些人想：“如果没有 settings 来知道 URL, 我如何调用 API 呢？”，这是一个问题，您可以通过一个相对 URL 来通过 HttpClient ，并假设 API 在您的 Web 站点上。

#### 参考资料
https://www.intertech.com/Blog/angular-4-tutorial-run-code-during-app-initialization/
