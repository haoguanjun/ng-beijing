---
title: 如何不需重新构建，使用环境变量来配置 Angular 应用  
date: 2019-03-06
categories: angular
---
如果我们可以基于不同的环境构建不同的版本，内置于 Angular CLI 的 [application environments](https://github.com/angular/angular-cli/wiki/stories-application-environments) 就可以理想地存储配置详情。

但是，如果你的应用程序需要在不同的环境下进行不同的配置，而不能重新构建，我们就需要另一个机制。

通过将配置详情分离到 `env.js` 文件中，我们的应用现在可以：
* 使用不同的配置部署到不同的环境，而不需要重新构建 Angular 应用
* 将代码分享给外部伙伴，而不会泄露任何机密配置信息
<!-- more -->

# [翻译] 如何不需重新构建，使用环境变量来配置 Angular 应用

原文地址：https://www.jvandemo.com/how-to-use-environment-variables-to-configure-your-angular-application-without-a-rebuild/

原文作者：[Jurgen Van de Moere ](https://twitter.com/jvandemo)

2016 年 2 月，我发布过如果使用环境变量配置 AngularJS 1.x，我们可以做到：

* 在不修改 AngularJS 应用程序代码、不重新构建的情况下，将 AngularJS 1.x 应用使用不同的配置部署到不同的环境中（阶段部署，产品等等）。
* 在不暴露任何敏感配置细节的情况下，在任何时刻，向外部伙伴分享 AngularJS 1.x 应用代码

许多开发者和商业机构已经使用该文中的框架在 AngularJS 1.x 获得成功。

自从 Angular 发布以来，实际上，我经常被问到，如何在 Angular 2+ 上实现类似的机制。最后，这篇文章将向您说明如何在不重新构建的情况下，配置 Angular 6 应用程序。

我们先看一下为什么内置的 Angular CLI 应用环境配置非常棒，但是对于在不重新构建的情况下，对于我们期望的配置不能支持。

## 1. Angular CLI 环境变量

多数 Angular 应用包含逻辑。

并且多数的 Angular 应用拥有配置，包含类似如下内容：

* API 的 URL 地址
* 是否记录 debug 信息
* 其它

Angular CLI 提供了应用环境变量，支持在构建时配置不同的设定。

在 Angular 6 中，`angular.json` 文件包含了对于仓库中所有应用的构建特定指令，包括环境设定：

```javascript
{
  "projects": {
    "app-name": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ],
              // ...
            }
          }
        }
      }
    }
  }
}
```

这里的 `fileReplacements` 表示你希望在构建时需要替换的环境特定文件。

在上面的场景中，Angular CLI 知道如果使用 `production` 配置，那么需要使用 `src/environments.prod.ts` 替换 `src/environments/environment.ts` 文件。

所以，如果 `environments/environments.prod.ts` 如下所示：

```javascript
export const environment = {  
  apiUrl: 'http://my-api-url',
  debugMode: false
};
```

而你使用 `ng build --configuration=production` 构建，Angular CLI 将执行文件替换操作，`src/environments/environment.ts` 将被 `src/environments/environment.prod.ts` 替换。

结果，你总是可以在项目中导入 `envionments/environment.ts` ，以便访问环境变量，基于 Angular CLI 使用正确的文件进行了替换。

```typescript
import { Component } from '@angular/core';  
import { environment } from './../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {  
  constructor() {
    console.log(environment.apiUrl);
  }
  title = 'app works!';
}
```

这个功能非常棒！但是，它是受限的。

## 2. Angular CLI 应用环境变量的限制

### 限制1：所扮演环境都需要独立的构建

构建时的配置要求对于每套环境生成独立的构建包。你可以自动化构建和部署，但是，如果你的构建是客户特定的怎么办？如果你希望对于不同的客户部署同样的 Angular 应用，但是使用不同的设置呢？

你可以对每个客户创建一个环境文件。

```javascript
{
  "projects": {
    "app-name": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ],
              // ...
            },
            "staging-client-a": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.client-a.staging.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ],
              // ...
            },
            "production-client-a": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.client-a.prod.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ],
              // ...
            },
            "staging-client-b": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.client-b.staging.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ],
              // ...
            },
            "production-client-b": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.client-b.prod.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ],
              // ...
            },
          }
        }
      }
    }
  }
}
```

但是在客户数量不断增长的情况下，可能很快失控。

假设你的应用程序使用了 20 个独立的配置进行部署，每个对于不同的客户，如果对于某个客户的配置发生了变化，需要单个重新构建，但是，如果应用程序代码发生了变化，就需要所有 20 个重建。

随着部署数量的增长，重新构建也会线性增长。

### 限制2：应用程序的配置是应用程序代码的一部分

应用程序的配置对于各种不同的部署情况非常不同（阶段，产品，客户 A，客户 B 等等）

将应用程序配置部分作为应用程序代码的一部分存储在仓库中会引入安全风险。想象一下你雇佣了一个外部的顾问访问你的私有应用代码。该顾问现在将可以访问存储在你的配置中的所有私有配置数据，因为你的环境配置也存在在你的代码仓库中。

### 限制3：对于动态云部分方案来说不够灵活

流行的基于云的寄宿架构可以动态扩展。而固定的配置限制了部署工具动态扩展，以及根据需要动态配置应用程序。

这些限制在  [The Twelve-Factor App config rule](http://12factor.net/config) 中有详细的说明，应该总是 **严格从代码中分离配置**

如果你的应用程序不受这些限制的映像，内置的 Angular CLI 应用环境配置就完美地适合存储配置详情。

但是，如果您的应用涉及到这些限制之一，你就需要其它的机制了。

## 3. 后端工程师是如何处理此类问题的

后端的工程师多年前就面临了类似的问题。

典型的处理方式是将配置信息存储到环境变量中。然后，在后端应用中从环境变量中读取这些信息。问题解决了。

不幸的是，前端应用没有访问类似后端的环境变量的机制，

所以，对于前端开发者来说，永远无解吗？

但是不是！

## 4. Angular 中的解决方案

在你看到如何处理之前，我们先定义使命中的 **What** 和 **Why** ，以便验证我们达到了目标。

### 4.1 **WHAT** 我们希望达到的目标？

我们希望从 Angular 应用程序中拆离所有配置。

### 4.2 **WHY** 我们希望这么做？

我们希望能够：

* 我们希望能够使用不同的配置在不同的环境部署应用程序，而不需要重新构建 Angular 应用程序
* 在任何时刻分享我们的应用代码给外部伙伴，而不会泄露任何机密配置信息

剩下的问题就是我们 **如何** 做？

编码时间！

### 4.3 步骤1：模拟一个环境

我们已经学到了后端工程师使用环境变量，我们学习前面的技术并使用类似的方式来解决问题。

为了便于演示，我们假设我们需要存储两个环境变量：

* `apiUrl`: 应用的 API URL 地址
* `enableDebug`：是否启用调试模式

首先，在我们应用程序的 `index.html ` 目录中，使用下面内容，我们创建一个新的 `env.js` 文件。

```javascript
(function (window) {
  window.__env = window.__env || {};

  // API url
  window.__env.apiUrl = 'http://dev.your-api.com';

  // Whether or not to enable debug mode
  // Setting this to false will disable console output
  window.__env.enableDebug = true;
}(this));
```

这段代码会在浏览器的 `window` 对象上创建在一个特定的全局变量 `__env` ，包含了我们应用的环境配置变量。

然后，在 `index.html` 的 `<head>` 中添加一个 `<script>` 元素，已在 Angular 之前加载 `env.js` 。

```html
<html ng-app="app">

  <head>
    <!-- Load environment variables -->
    <script src="env.js"></script>
  </head>

  <body>
    ...
    <!-- Angular code is loaded here -->
  </body>  

</html> 
```

默认情况下，类似 `env.js` 这样的 Javascript 文件不会被复制到构建的输出目录中。

为了保证该文件在使用 `ng build` 或者 `ng serve` 构建时被复制到输出目录中，我们必须将它添加到应用程序的构建配置文件 `angular.json` 的   `assets` 配置节中。

```javascript
{
  "projects": {
    "app-name": {
      "architect": {
        "build": {
          "options": {
            "assets": [
              "src/favicon.ico",
              "src/assets",
              "src/env.js"
            ]
          }
          "configurations": {
            "production": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ],
              // ...
            }
          }
        }
      }
    }
  }
}
```

注意 `src/env.js` 是如何添加到 `assets` 属性中的，紧接着 `src/favicon.ico` 和 `src/assets` 目录。

当我们重新运行 `ng build` 或者 `ng serve` ，`env.js` 将出现在构建输出目录中。

>当运行 `ng build` 的时候，你可以检查 `env.js` 是否出现在构建输出目录中。当运行 `ng serve` 的时候，你可以在浏览器中导航到 `http://localhost:4200/env.js`。在浏览器运行应用的时候，你可以打开浏览器的控制台，然后输入 `window.__env` 来检查环境变量是否已经被正确加载到全局 `window` 对象上。

### 4.4 步骤2：在 Angular 中加载环境变量

现在我们的环境变量已经作为全局 `window` 对象的 `__env` 属性可用了，我们可以通过为 Angular 提供一个服务来访问我们的环境变量，以便我们可以在应用程序的任何地方，使用 Angular 的依赖注入访问。

为了达到这个目的，我们将创建以下部分：

* `EnvService`: 纯的 TypeScript 类，提供可以通过依赖注入机制注入到应用程序任何位置的 `EnvService`。
* `EnvServiceFactory`: 从 `window.__env` 中读取环境变量，并创建 `EnvService` 实例
* `EnvServiceProvider`: Angular 的 provider，用于注册 `EnvServiceFactory` 来通过 Angular 依赖注入机制通过工厂创建 `EnvService` 实例。

通过使用 `EnvService` 这个 TypeScript 类，我们可以在喜欢的编辑器中，实现环境变量的代码提示。

多棒！

我们使用 Angular CLI 创建一个 `env.service.ts` 文件来构建 `EnvService` 类。

```bash
$ ng generate service env
```

然后，将内容替换为：

```typescript
export class EnvService {

  // The values that are defined here are the default values that can
  // be overridden by env.js

  // API url
  public apiUrl = '';

  // Whether or not to enable debug mode
  public enableDebug = true;

  constructor() {
  }

}
```

该 `EnvService` 类没有任何关于 Angular 的特殊部分，这是一个纯的 TypeScript 类，包含了我们希望存储在环境中的所有类型话的属性。该类将用于我们的 `EnvServiceFactory` 来创建 `EnvService` 的实例，其中的类型信息帮助 TypeScript 编译器提供开发时的支持。

`EnvService` 类中赋予变量的默认值，将通过 `env.js` 被定制值所覆盖，假设这里有 `env.js` 且器被成功加载。

如果 `env.js` 不能加载，应用程序将回退到 `EnvService` 类中定义的默认值。

>**提示**：如果应用程序不能使用默认值运行在产品环境下，可以添加一个特定的属性，例如 `envFileLoaded = false`, 它应该被 `env.js` 覆写并设置为 `true` . 这样，如果你的应用程序被加载了，但是该属性为 false，你就可以为用户提供一个友好的提示信息，`env.js` 不能加载，而不是回退到默认的配置值。

为了使 Angular 依赖注入机制创建该 `EnvService` 的实例，我们创建 `EnvServiceProvider`。

Angular CLI 没有提供创建 provider 的便利，我们自己在同样的目录创建 `env.service.provider.ts` 文件，并使用如下内容：

```typescript
import { EnvService } from './env.service';

export const EnvServiceFactory = () => {  
  // Create env
  const env = new EnvService();

  // Read environment variables from browser window
  const browserWindow = window || {};
  const browserWindowEnv = browserWindow['__env'] || {};

  // Assign environment variables from browser window to env
  // In the current implementation, properties from env.js overwrite defaults from the EnvService.
  // If needed, a deep merge can be performed here to merge properties instead of overwriting them.
  for (const key in browserWindowEnv) {
    if (browserWindowEnv.hasOwnProperty(key)) {
      env[key] = window['__env'][key];
    }
  }

  return env;
};

export const EnvServiceProvider = {  
  provide: EnvService,
  useFactory: EnvServiceFactory,
  deps: [],
};
```

首先，导入前面定义的 `EnvService` 类。

然后，我们导出 `EnvServiceFactory` 函数，其创建了 `EnvService` 类的实例，并从 `window.__env` 复制环境配置到 `EnvService` 实例中。

> 提示：如果你的应用包含嵌套的复杂配置，可以执行  [deep merge](https://github.com/KyleAMathews/deepmerge) ，而不是见到的复制属性。

最后，我们导出了 `EnvServiceProvider`，它可以作为 Angular 的 provider 提供给 `EnvService` 令牌。

可以通过 Angular 的依赖注入机制注册 `EnvServiceProvider` ，我们必须在应用程序的 `providers` 数组中加入它。

```typescript
// ...
import { NgModule } from '@angular/core';  
import { EnvServiceProvider } from './env.service.provider';

@NgModule({
  imports: [ // ... ],
  providers: [EnvServiceProvider],
})
export class AppModule {}
```

就这样！

现在，我们可以在应用程序的任何地方注入 `EnvService` 服务了。

```typescript
import { Component } from '@angular/core';  
import { EnvService } from '../env.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {  
  constructor(
    private env: EnvService
  ) {
    if(env.debugEnabled) {
      console.log('Debug mode enabled!');
    }
  }
}
```

> 如果你在运行 `ng serve` 之后更新了 `angular.json`，你必须重新启动 `ng serve` 以便开发服务器获取更新后的配置。

### 4.5 但是，这不是将问题转移到了 env.js 吗？

不是，相对于使用 Angular CLI 的  [application environments](https://github.com/angular/angular-cli/wiki/stories-application-environments), 更新配置不再需要重新构建了。

当你使用 `ng build --prod` 构建应用程序时，`env.js` 将出现在 `dist` 文件夹中。

> ```
> -rw-r--r--   1 jvandemo  staff    2179 Aug 14 09:36 3rdpartylicenses.txt
> -rw-r--r--   1 jvandemo  staff     265 Aug 14 09:36 env.js
> -rw-r--r--   1 jvandemo  staff    5430 Aug 14 09:36 favicon.ico
> -rw-r--r--   1 jvandemo  staff     646 Aug 14 09:36 index.html
> -rw-r--r--   1 jvandemo  staff  171249 Aug 14 09:36 main.xxx.js
> -rw-r--r--   1 jvandemo  staff   59561 Aug 14 09:36 polyfills.xxx.js
> -rw-r--r--   1 jvandemo  staff    1053 Aug 14 09:36 runtime.xxx.js
> -rw-r--r--   1 jvandemo  staff       0 Aug 14 09:36 styles.xxx.css
> ```

如果你使用静态 Web 服务器来支持，比如  [serve](https://github.com/zeit/serve), 你会看到你可以在 `dist` 文件夹中编辑 `env.js` 文件，以控制环境变量而不需要重新构建应用程序。一旦你刷新浏览器，新的环境变量就会被获取到。

![](https://user-images.githubusercontent.com/1859381/44098643-b82bd342-9fae-11e8-8810-8c80b814eb3a.gif)

你的部署团队可以打开 `env.js` 来查看环境变量是否可用，并基于特定的部署更新其中的值，比如阶段部署、产品、客户A、客户 B 等等。

```javascript
(function (window) {
  window.__env = window.__env || {};
  window.__env.apiUrl = 'http://production.your-api.com';
  window.__env.enableDebug = false;
}(this));
```

使用 `env.js` 重新配置应用现在可以由部署团队处理，不再需要重新构建 Angular 应用。

如果你觉得有点冒险，甚至可以通过一个外部的 URL 来基于请求者返回不同的配置（例如使用用户的 IP 地址来访者不同的配置）。

这个强大的机制允许你在不同的环境使用同样的应用进行不同的配置，而不需要构建不同的版本。

## 5. 总结

如果我们可以基于不同的环境构建不同的版本，内置于 Angular CLI 的 [application environments](https://github.com/angular/angular-cli/wiki/stories-application-environments) 就可以理想地存储配置详情。

但是，如果你的应用程序需要在不同的环境下进行不同的配置，而不能重新构建，我们就需要另一个机制。

通过将配置详情分离到 `env.js` 文件中，我们的应用现在可以：

* 使用不同的配置部署到不同的环境，而不需要重新构建 Angular 应用
* 将代码分享给外部伙伴，而不会泄露任何机密配置信息

这就是我们需要的。

您可以在 [这里](https://github.com/jvandemo/angular-environment-variables-demo)找到一个示例。





## see also

* https://www.jvandemo.com/how-to-use-environment-variables-to-configure-your-angular-application-without-a-rebuild/
