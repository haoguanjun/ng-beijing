---
title: 如何构建可编辑的配置文件     
date: 2018-03-26
categories: angular
---
Angular CLI 是 Angular 官方推荐的构建产品级应用的工具，支持完整的打包、紧缩和摇树。使用 Angular CLI 创建的项目，甚至包括了支持环境特定版本的机制。但是，这些 TypeScript 的环境特定版本的配置文件，并不支持由 IT 运维或者自动化部署工具，例如 VSTS 编辑。本文提供了一种使用 JSON 配置文件实现的步骤和代码示例，它可以在多种环境进行定制.
<!-- more -->
# 如何构建可编辑的配置文件

[Laurie Atkinson](https://www.linkedin.com/in/atkinsonlaurie/) 

Angular CLI 是 Angular 官方推荐的构建产品级应用的工具，支持完整的打包、紧缩和摇树。使用 Angular CLI 创建的项目，甚至包括了支持环境特定版本的机制。但是，这些 TypeScript 的环境特定版本的配置文件，并不支持由 IT 运维或者自动化部署工具，例如 VSTS 编辑。本文提供了一种使用 JSON 配置文件实现的步骤和代码示例，它可以在多种环境进行定制。
## 定义配置设置的 TypeScript 接口

在 Angular 应用中使用接口，可以提供智能提示和对于实体的类型安全。对于本示例，使用下面的示例配置文件。
```typescript
export interface IAppConfig {
    env: {
        name: string;
    };
    appInsights: {
        instrumentationKey: string;
    };
    logging: {
        console: boolean;
        appInsights: boolean;
    };
    aad: {
        requireAuth: boolean;
        tenant: string;
        clientId: string;
 
    };
    apiServer: {
        metadata: string;
        rules: string;
    };
}
```

## 创建 JSON 配置文件
放置配置文件比较方便的方式是保存在项目的 assets 文件夹中，这个文件夹在构建过程中会被复制到目录中。使用前面定义的接口，开发环境下的配置文件如下所示。
**assets\config\config.dev.json**
```javascript
{
    "env": {
    "name": "DEV"
     },
    "appInsights": {
    "instrumentationKey": "<dev-guid-here>"
     },
    "logging": {
    "console": true,
    "appInsights": false
    },
    "aad": {
    "requireAuth": true,
    "tenant": "<dev-guid-here>",
    "clientId": "<dev-guid-here>"
    },
    "apiServer": {
    "metadata": "https://metadata.demo.com/api/v1.0/",
    "rules": "https://rules.demo.com/api/v1.0/"
    }
}
```

而部署方式下的配置文件如下所示：
**assets\config\config.deploy.json**

```javascript
{
    "env": {
    "name": "#{envName}"
    },
    "appInsights": {
    "instrumentationKey": "#{appInsightsKey}"
    },
    "logging": {
    "console": true,
    "appInsights": true
    },
    "aad": {
    "requireAuth": true,
    "tenant": "#{aadTenant}",
    "clientId": "#{aadClientId}"
    },
    "apiServer": {
    "metadata": "https://#{apiServerPrefix}.demo.com/api/v1.0/",
    "rule": "https://#{apiServerPrefix}.demo.com/api/v1.0/",
    }
}
```

## 在 Angular CLI 构建中继续使用 environments.ts
Angular CLI 会在 environments 文件夹中创建多个 TypeScript 文件。它们仍然会被使用，但是仅仅包含环境的名称。

**environments\environment.dev.json**

```javascript
export const environment = {
    name: 'dev'
};
```

**environments\environment.deploy.json**

```javascript
export const environment = {
    name: 'deploy'
};
```

**angular.json**

```javascript
"projects": {
  "my-app": {
    "architect": {
      "build": {
        "configurations": {
          "deploy": {
            "fileReplacements": [
              {
                "replace": "src/environments/environment.ts",
                "with": "src/environments/environment.deploy.ts"
              }
            ],
            . . .
          }
        }
      },
      "serve": {
        . . .
        "configurations": {
          "deploy": {
            "browserTarget": "my-app:build:deploy"
          }
```



## 创建读取配置文件的服务
服务将会读取正确的配置文件，并存储到该类的静态字段中。

**app.config.ts** 

*(注意：这里使用了上面定义的接口，并且配置文件的名称约定为相关的文件名.)*

```javascript
import { Injectable } from '@angular/core’;
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { IAppConfig } from './models/app-config.model';

@Injectable()
export class AppConfig {
    static settings: IAppConfig;
    constructor(private http: HttpClient) {}

    load() {
        const jsonFile = `assets/config/config.${environment.name}.json`;
        return new Promise<void>((resolve, reject) => {
            this.http.get(jsonFile).toPromise().then((response : IAppConfig) => {
               AppConfig.settings = <IAppConfig>response;
               resolve();
            }).catch((response: any) => {
               reject(`Could not load file '${jsonFile}': ${JSON.stringify(response)}`);
            });
        });
    }
}
```

## 在应用创建之前加载配置文件

Angular 提供名为 **APP_INITIALIZER** 的令牌，它支持在应用被初始化的时候执行代码。在 app 模块中，使用该令牌来执行配置服务中的 load 方法。由于我们定义的该方法返回一个 Promise，Angular 将会等到该 Promise 完成之后执行初始化。

**app.module.ts**

```javascript
import { APP_INITIALIZER } from '@angular/core';
import { AppConfig } from './app.config';
 
export function initializeApp(appConfig: AppConfig) {
  return () => appConfig.load();
}
@NgModule({
    imports: [ , , , ],
    declarations: [ . . . ],
    providers: [
       AppConfig,
       { provide: APP_INITIALIZER,
         useFactory: initializeApp,
         deps: [AppConfig], multi: true }
    ],
    bootstrap: [
      AppComponent
    ]
})
export class AppModule { }
```

## 在应用中使用配置服务
现在配置设置已经可以在应用中使用了，通过定义的接口还提供了类型检查。

```javascript
export class DataService {
    protected apiServer = AppConfig.settings.apiServer;
    . . .
    if (AppConfig.settings.aad.requireAuth) { . . . }
}
export class LoggingService {
    . . .
    instrumentationKey: AppConfig.settings && AppConfig.settings.appInsights ?
                        AppConfig.settings.appInsights.instrumentationKey : ''
    . . .
    if (AppConfig.settings && AppConfig.settings.logging) { . . . }
}
```
注意：使用环境的名称而不是 prod 来构建产品版本，使用下面的命令：
>   ng build –configuration=deploy
## See also
* [Angular How-to: Editable Config Files](https://devblogs.microsoft.com/premier-developer/angular-how-to-editable-config-files)
