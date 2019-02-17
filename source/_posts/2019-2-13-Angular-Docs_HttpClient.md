---
title: HttpClient 摘要笔记     
date: 2019-02-13
categories: angular
---
Angular 的官方文档虽然很不错，但是有些点并没有详细说明，这篇摘要笔记对一些要点进行了注解和说明，并对内容进行了编号，以方便查阅。
<!-- more -->

# HttpClient

https://angular.cn/guide/http

## 1. 准备工作

要想使用 `HttpClient`，就要先导入 Angular 的 `HttpClientModule`。大多数应用都会在根模块 `AppModule` 中导入它。

在 `AppModule` 中导入 `HttpClientModule` 之后，你可以把 `HttpClient` 注入到应用类中。

## 2. 获取 JSON 数据

使用 HttpClient 默认获取响应的 JSON 数据。下面示例中的 data 为响应结果中的 JSON 数据。

```javascript
showConfig() {
  this.configService.getConfig()
    .subscribe((data: Config) => this.config = {
        heroesUrl: data['heroesUrl'],
        textfile:  data['textfile']
    });
}
```

在以前版本中，需要使用 .json() 方法来获取数据。

### 2.1 为什么要写服务

你通常要对数据做后处理、添加错误处理器，还可能加一些重试逻辑，以便应对网络抽风的情况。

### 2.2 带类型检查的响应

HttpClient 的方式支持泛型。

```javascript
getConfig() {
  // now returns an Observable of Config
  return this.http.get<Config>(this.configUrl);
}

showConfig() {
  this.configService.getConfig()
    // clone the data object, using its known Config shape
    .subscribe((data: Config) => this.config = { ...data });
}
```

### 2.3 读取完整的响应体

当然可以读取完整的响应体。

需要通过 observe 选项来指定。此时的得到的是一个 HttpResponse<Config> 对象。

```javascript
getConfigResponse(): Observable<HttpResponse<Config>> {
  return this.http.get<Config>(
    this.configUrl, { observe: 'response' });
}

showConfigResponse() {
  this.configService.getConfigResponse()
    // resp is of type `HttpResponse<Config>`
    .subscribe(resp => {
      // display its headers
      const keys = resp.headers.keys();
      this.headers = keys.map(key =>
        `${key}: ${resp.headers.get(key)}`);

      // access the body directly, which is typed as `Config`.
      this.config = { ... resp.body };
    });
}
```

第 5 节有更进一步说明。

## 3. 错误处理

可以使用 Observable 的错误处理机制，在 .subscribe() 中添加第二个回调函数。

### 3.1 获取错误详情

错误可能分为两种：网络错误和客户端错误。

回调函数得到的错误类型是 HttpErrorResponse，可以根据具体类型来判断错误类型。

```javascript
private handleError(error: HttpErrorResponse) {
  if (error.error instanceof ErrorEvent) {
    // A client-side or network error occurred. Handle it accordingly.
    console.error('An error occurred:', error.error.message);
  } else {
    // The backend returned an unsuccessful response code.
    // The response body may contain clues as to what went wrong,
    console.error(
      `Backend returned code ${error.status}, ` +
      `body was: ${error.error}`);
  }
  // return an observable with a user-facing error message
  return throwError(
    'Something bad happened; please try again later.');
};
```

需要注意的是，该示例返回了一个 RxJs 的 ErrorObservable 对象。

通过管道可以传递给错误处理器。

```javascript
getConfig() {
  return this.http.get<Config>(this.configUrl)
    .pipe(
      catchError(this.handleError)
    );
}
```

### 3.2 retry()

有时候，错误只是临时性的，只要重试就可能会自动消失。 比如，在移动端场景中可能会遇到网络中断的情况，只要重试一下就能拿到正确的结果。

```javascript
getConfig() {
  return this.http.get<Config>(this.configUrl)
    .pipe(
      retry(3), // retry a failed request up to 3 times
      catchError(this.handleError) // then handle the error
    );
}
```

## 4. 可观察对象 (Observable) 与操作符 (operator)

操作符需要导入

```javascript
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
```

## 5. 请求非 JSON 格式的数据

对于非 JSON 格式的数据，可以通过 responseType 进行说明。

```javascript
getTextFile(filename: string) {
  // The Observable returned by get() is of type Observable<string>
  // because a text response was specified.
  // There's no need to pass a <string> type parameter to get().
  return this.http.get(filename, {responseType: 'text'})
    .pipe(
      tap( // Log the result or error
        data => this.log(filename, data),
        error => this.logError(filename, error)
      )
    );
}
```

## 6. 把数据发送到服务器

除了从服务器获取数据之外，`HttpClient` 还支持修改型的请求，也就是说，通过 `PUT`、`POST`、`DELETE`这样的 HTTP 方法把数据发送到服务器。

### 6.1 添加请求头

首先准备一个 options: { headers?: [HttpHeaders](https://angular.io/api/common/http/HttpHeaders) | { [header: string]: string | string[]; } 类型的对象。

```javascript
import { HttpHeaders } from '@angular/common/http';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type':  'application/json',
    'Authorization': 'my-auth-token'
  })
};
```

做为参数提供给请求方法。

```javascript
/** POST: add a new hero to the database */
addHero (hero: Hero): Observable<Hero> {
  return this.http.post<Hero>(this.heroesUrl, hero, httpOptions)
    .pipe(
      catchError(this.handleError('addHero', hero))
    );
}
```



### 6.2 发起 POST 请求

`HttpClient.post()` 方法像 `get()` 一样也有类型参数（你会希望服务器返回一个新的英雄对象），它包含一个资源 URL。

它还接受另外两个参数：

1. `hero` - 要 `POST` 的请求体数据。
2. `httpOptions` - 这个例子中，该方法的选项[指定了所需的请求头](https://angular.cn/guide/http#adding-headers)。

### 6.3 发起 DELETE 请求

该应用可以把英雄的 id 传给 `HttpClient.delete` 方法的请求 URL 来删除一个英雄。

```javascript
/** DELETE: delete the hero from the server */
deleteHero (id: number): Observable<{}> {
  const url = `${this.heroesUrl}/${id}`; // DELETE api/heroes/42
  return this.http.delete(url, httpOptions)
    .pipe(
      catchError(this.handleError('deleteHero'))
    );
}
```

### 6.4 发起 PUT 请求

应用可以发送 PUT 请求，来使用修改后的数据完全替换掉一个资源。 下面的 `HeroesService` 例子和 POST 的例子很像。

```javascript
/** PUT: update the hero on the server. Returns the updated hero upon success. */
updateHero (hero: Hero): Observable<Hero> {
  return this.http.put<Hero>(this.heroesUrl, hero, httpOptions)
    .pipe(
      catchError(this.handleError('updateHero', hero))
    );
}
```

## 7. 高级用法

### 7.1 配置请求

#### 7.1.1 修改请求头

 `HttpHeaders` 类的实例是不可变的。使用 set() ，它会返回当前实例的一份克隆，其中应用了这些新修改。

#### 7.1.2 URL 参数

使用 HttpParams 构建查询参数

```javascript
/* GET heroes whose name contains search term */
searchHeroes(term: string): Observable<Hero[]> {
  term = term.trim();

  // Add safe, URL encoded search parameter if there is a search term
  const options = term ?
   { params: new HttpParams().set('name', term) } : {};

  return this.http.get<Hero[]>(this.heroesUrl, options)
    .pipe(
      catchError(this.handleError<Hero[]>('searchHeroes', []))
    );
}
```

### 7.2 请求防抖 (debounce)

```javascript
withRefresh = false;
packages$: Observable<NpmPackageInfo[]>;
private searchText$ = new Subject<string>();

search(packageName: string) {
  this.searchText$.next(packageName);
}

ngOnInit() {
  this.packages$ = this.searchText$.pipe(
    debounceTime(500),
    distinctUntilChanged(),
    switchMap(packageName =>
      this.searchService.search(packageName, this.withRefresh))
  );
}

constructor(private searchService: PackageSearchService) { }
```

1. `debounceTime(500)` - 等待，直到用户停止输入（这个例子中是停止 1/2 秒）。
2. `distinctUntilChanged()` - 等待，直到搜索内容发生了变化。
3. `switchMap()` - 把搜索请求发送给服务。

### 7.3 拦截请求和响应

*HTTP* 拦截机制是 `@angular/common/http` 中的主要特性之一。 使用这种拦截机制，你可以声明*一些拦截器*，用它们监视和转换从应用发送到服务器的 HTTP 请求。 拦截器还可以用监视和转换从服务器返回到本应用的那些响应。 多个选择器会构成一个“请求/响应处理器”的双向链表。

#### 7.3.1 编写拦截器

要实现拦截器，就要实现一个实现了 `HttpInterceptor` 接口中的 `intercept()` 方法的类。

```javascript
import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest
} from '@angular/common/http';

import { Observable } from 'rxjs';

/** Pass untouched request through to the next request handler. */
@Injectable()
export class NoopInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler):
    Observable<HttpEvent<any>> {
    return next.handle(req);
  }
}
```

#### 7.3.2 next 对象

`next` 对象表示拦截器链表中的下一个拦截器。 这个链表中的最后一个 `next` 对象就是 `HttpClient` 的后端处理器（backend handler），它会把请求发给服务器，并接收服务器的响应。

大多数的拦截器都会调用 `next.handle()`，以便这个请求流能走到下一个拦截器，并最终传给后端处理器。 拦截器也*可以*不调用 `next.handle()`，使这个链路短路，并返回一个带有人工构造出来的服务器响应的 [自己的 `Observable`](https://angular.cn/guide/http#caching)。

这是一种常见的中间件模式，在像 Express.js 这样的框架中也会找到它。

#### 7.3.3 提供拦截器

 `NoopInterceptor` 就是一个由 Angular [依赖注入 (DI)](https://angular.cn/guide/dependency-injection)系统管理的服务。 像其它服务一样，你也必须先提供这个拦截器类，应用才能使用它。

由于拦截器是 `HttpClient` 服务的（可选）依赖，所以你必须在提供 `HttpClient` 的同一个（或其各级父注入器）注入器中提供这些拦截器。 那些在 DI 创建完 `HttpClient` *之后*再提供的拦截器将会被忽略。

由于在 `AppModule` 中导入了 `HttpClientModule`，导致本应用在其根注入器中提供了 `HttpClient`。所以你也同样要在 `AppModule` 中提供这些拦截器。

在从 `@angular/common/http` 中导入了 `HTTP_INTERCEPTORS` 注入令牌之后，编写如下的 `NoopInterceptor` 提供商注册语句：

```javascript
{ provide: HTTP_INTERCEPTORS, useClass: NoopInterceptor, multi: true },
```

认真考虑创建一个封装桶（barrel）文件，用于把所有拦截器都收集起来，一起提供给 `httpInterceptorProviders` 数组，可以先从这个 `NoopInterceptor` 开始。

```javascript
/* "Barrel" of Http Interceptors */
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { NoopInterceptor } from './noop-interceptor';

/** Http interceptor providers in outside-in order */
export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: NoopInterceptor, multi: true },
];
```

然后导入它，并把它加到 `AppModule` 的 *providers 数组*中，就像这样：

```javascript
providers: [
  httpInterceptorProviders
],
```

当你再创建新的拦截器时，就同样把它们添加到 `httpInterceptorProviders` 数组中，而不用再修改 `AppModule`。

#### 7.3.4 拦截器的顺序

Angular 会按照你提供它们的顺序应用这些拦截器。 如果你提供拦截器的顺序是先 *A*，再 *B*，再 *C*，那么请求阶段的执行顺序就是 *A->B->C*，而响应阶段的执行顺序则是 *C->B->A*。

以后你就再也不能修改这些顺序或移除某些拦截器了。 如果你需要动态启用或禁用某个拦截器，那就要在那个拦截器中自行实现这个功能。

#### 7.3.5 HttpEvents

你可能会期望 `intercept()` 和 `handle()` 方法会像大多数 `HttpClient` 中的方法那样返回 `HttpResponse<any>` 的可观察对象。

然而并没有，它们返回的是 `HttpEvent<any>` 的可观察对象。

这是因为拦截器工作的层级比那些 `HttpClient` 方法更低一些。每个 HTTP 请求都可能会生成很多个*事件*，包括上传和下载的进度事件。 实际上，`HttpResponse` 类本身就是一个事件，它的类型（`type`）是 `HttpEventType.HttpResponseEvent`。

很多拦截器只关心发出的请求，而对 `next.handle()` 返回的事件流不会做任何修改。

但那些要检查和修改来自 `next.handle()` 的响应体的拦截器希望看到所有这些事件。 所以，你的拦截器应该返回*你没碰过的所有事件*，除非你*有充分的理由不这么做*。

#### 7.3.6 不可变性

虽然拦截器有能力改变请求和响应，但 `HttpRequest` 和 `HttpResponse` 实例的属性却是只读（`readonly`）的， 因此让它们基本上是不可变的。

有充足的理由把它们做成不可变对象：应用可能会重试发送很多次请求之后才能成功，这就意味着这个拦截器链表可能会多次重复处理同一个请求。 如果拦截器可以修改原始的请求对象，那么重试阶段的操作就会从修改过的请求开始，而不是原始请求。 而这种不可变性，可以确保这些拦截器在每次重试时看到的都是同样的原始请求。

##### 7.3.6.1 请求体

`readonly` 这种赋值保护，无法防范深修改（修改子对象的属性），也不能防范你修改请求体对象中的属性。

如果你必须修改请求体，那么就要先复制它，然后修改这个复本，`clone()` 这个请求，然后把这个请求体的复本作为新的请求体，例子如下：

```javascript
// copy the body and trim whitespace from the name property
const newBody = { ...body, name: body.name.trim() };
// clone request and set its body
const newReq = req.clone({ body: newBody });
// send the cloned request to the next handler.
return next.handle(newReq);
```

##### 7.3.6.2 清空请求体

有时你需要清空请求体，而不是替换它。 如果你把克隆后的请求体设置成 `undefined`，Angular 会认为你是想让这个请求体保持原样。 这显然不是你想要的。 但如果把克隆后的请求体设置成 `null`，那 Angular 就知道你是想清空这个请求体了。

```javascript
newReq = req.clone({ ... }); // body not mentioned => preserve original body
newReq = req.clone({ body: undefined }); // preserve original body
newReq = req.clone({ body: null }); // clear the body
```

#### 7.3.7 设置默认请求头

应用通常会使用拦截器来设置外发请求的默认请求头。

```javascript
import { AuthService } from '../auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // Get the auth token from the service.
    const authToken = this.auth.getAuthorizationToken();

    // Clone the request and replace the original headers with
    // cloned headers, updated with the authorization.
    const authReq = req.clone({
      headers: req.headers.set('Authorization', authToken)
    });

    // send cloned request with header to the next handler.
    return next.handle(authReq);
  }
}
```

这种在克隆请求的同时设置新请求头的操作太常见了，因此它还有一个快捷方式 `setHeaders`：

```
content_copy// Clone the request and set the new header in one step. const authReq = req.clone({ setHeaders: { Authorization: authToken } });
```

这种可以修改头的拦截器可以用于很多不同的操作，比如：

- 认证 / 授权
- 控制缓存行为。比如 `If-Modified-Since`
- XSRF 防护

### 7.3.8 记日志

因为拦截器可以*同时*处理请求和响应，所以它们也可以对整个 HTTP 操作进行计时和记录日志。

```javascript
import { finalize, tap } from 'rxjs/operators';
import { MessageService } from '../message.service';

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  constructor(private messenger: MessageService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const started = Date.now();
    let ok: string;

    // extend server response observable with logging
    return next.handle(req)
      .pipe(
        tap(
          // Succeeds when there is a response; ignore other events
          event => ok = event instanceof HttpResponse ? 'succeeded' : '',
          // Operation failed; error is an HttpErrorResponse
          error => ok = 'failed'
        ),
        // Log when response observable either completes or errors
        finalize(() => {
          const elapsed = Date.now() - started;
          const msg = `${req.method} "${req.urlWithParams}"
             ${ok} in ${elapsed} ms.`;
          this.messenger.add(msg);
        })
      );
  }
}
```

RxJS 的 `tap` 操作符会捕获请求成功了还是失败了。 RxJS 的 `finalize` 操作符无论在响应成功还是失败时都会调用（这是必须的），然后把结果汇报给 `MessageService`。

在这个可观察对象的流中，无论是 `tap` 还是 `finalize` 接触过的值，都会照常发送给调用者。

#### 7.3.9 缓存

拦截器还可以自行处理这些请求，而不用转发给 `next.handle()`。

比如，你可能会想缓存某些请求和响应，以便提升性能。 你可以把这种缓存操作委托给某个拦截器，而不破坏你现有的各个数据服务。

```javascript
@Injectable()
export class CachingInterceptor implements HttpInterceptor {
  constructor(private cache: RequestCache) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // continue if not cachable.
    if (!isCachable(req)) { return next.handle(req); }

    const cachedResponse = this.cache.get(req);
    return cachedResponse ?
      of(cachedResponse) : sendRequest(req, next, this.cache);
  }
}

/**
 * Get server response observable by sending request to `next()`.
 * Will add the response to the cache on the way out.
 */
function sendRequest(
  req: HttpRequest<any>,
  next: HttpHandler,
  cache: RequestCache): Observable<HttpEvent<any>> {

  // No headers allowed in npm search request
  const noHeaderReq = req.clone({ headers: new HttpHeaders() });

  return next.handle(noHeaderReq).pipe(
    tap(event => {
      // There may be other events besides the response.
      if (event instanceof HttpResponse) {
        cache.put(req, event); // Update the cache.
      }
    })
  );
}
```

注意 `sendRequest` 是如何在发回给应用之前*拦截这个响应的*。 它会通过 `tap()` 操作符对响应进行管道处理，并在其回调中把响应加到缓存中。

然后，原始的响应会通过这些拦截器链，原封不动的回到服务器的调用者那里。

数据服务，比如 `PackageSearchService`，并不知道它们收到的某些 `HttpClient` 请求实际上是从缓存的请求中返回来的。

#### 7.3.10 返回多值可观察对象

`HttpClient.get()` 方法正常情况下只会返回一个*可观察对象*，它或者发出数据，或者发出错误。 有些人说它是“一次性完成”的可观察对象。

但是拦截器也可以把这个修改成发出多个值的*可观察对象*。

修改后的 `CachingInterceptor` 版本可以返回一个立即发出缓存的响应，然后仍然把请求发送到 NPM 的 Web API，然后再把修改过的搜索结果重新发出一次。

```javascript
// cache-then-refresh
if (req.headers.get('x-refresh')) {
  const results$ = sendRequest(req, next, this.cache);
  return cachedResponse ?
    results$.pipe( startWith(cachedResponse) ) :
    results$;
}
// cache-or-fetch
return cachedResponse ?
  of(cachedResponse) : sendRequest(req, next, this.cache);
```

### 7.4 监听进度事件

有时，应用会传输大量数据，并且这些传输可能会花费很长时间。 典型的例子是文件上传。 可以通过在传输过程中提供进度反馈，来提升用户体验。

要想发起带有进度事件的请求，你可以创建一个把 `reportProgress` 选项设置为 `true` 的 `HttpRequest`实例，以开启进度跟踪事件。

```javascript
const req = new HttpRequest('POST', '/upload/file', file, {
  reportProgress: true
});
```

接下来，把这个请求对象传给 `HttpClient.request()` 方法，它返回一个 `HttpEvents` 的 `Observable`，同样也可以在拦截器中处理这些事件。

```javascript
// The `HttpClient.request` API produces a raw event stream
// which includes start (sent), progress, and response events.
return this.http.request(req).pipe(
  map(event => this.getEventMessage(event, file)),
  tap(message => this.showProgress(message)),
  last(), // return last (completed) message to caller
  catchError(this.handleError(file))
);
```

## 8 安全：XSRF 防护

[跨站请求伪造 (XSRF)](https://en.wikipedia.org/wiki/Cross-site_request_forgery)是一个攻击技术，它能让攻击者假冒一个已认证的用户在你的网站上执行未知的操作。`HttpClient` 支持一种[通用的机制](https://en.wikipedia.org/wiki/Cross-site_request_forgery#Cookie-to-Header_Token)来防范 XSRF 攻击。当执行 HTTP 请求时，一个拦截器会从 cookie 中读取 XSRF 令牌（默认名字为 `XSRF-TOKEN`），并且把它设置为一个 HTTP 头 `X-XSRF-TOKEN`，由于只有运行在你自己的域名下的代码才能读取这个 cookie，因此后端可以确认这个 HTTP 请求真的来自你的客户端应用，而不是攻击者。

默认情况下，拦截器会在所有的修改型请求中（比如 POST 等）把这个 cookie 发送给使用相对 URL 的请求。但不会在 GET/HEAD 请求中发送，也不会发送给使用绝对 URL 的请求。

要获得这种优点，你的服务器需要在页面加载或首个 GET 请求中把一个名叫 `XSRF-TOKEN` 的令牌写入可被 JavaScript 读到的会话 cookie 中。 而在后续的请求中，服务器可以验证这个 cookie 是否与 HTTP 头 `X-XSRF-TOKEN` 的值一致，以确保只有运行在你自己域名下的代码才能发起这个请求。这个令牌必须对每个用户都是唯一的，并且必须能被服务器验证，因此不能由客户端自己生成令牌。把这个令牌设置为你的站点认证信息并且加了盐（salt）的摘要，以提升安全性。

为了防止多个 Angular 应用共享同一个域名或子域时出现冲突，要给每个应用分配一个唯一的 cookie 名称。

> *注意，HttpClient 支持的只是 XSRF 防护方案的客户端这一半。* 你的后端服务必须配置为给页面设置 cookie ，并且要验证请求头，以确保全都是合法的请求。否则，Angular 默认的这种防护措施就会失效。

### 8.1 配置自定义 cookie/header 名称

如果你的后端服务中对 XSRF 令牌的 cookie 或 头使用了不一样的名字，不是默认名字 `XSRF-TOKEN`，就要使用 `HttpClientXsrfModule.withConfig()` 来覆盖掉默认值。

```javascript
imports: [
  HttpClientModule,
  HttpClientXsrfModule.withOptions({
    cookieName: 'My-Xsrf-Cookie',
    headerName: 'My-Xsrf-Header',
  }),
],
```

## 9 测试 HTTP 请求

如同所有的外部依赖一样，HTTP 后端也需要在良好的测试实践中被 Mock 掉。`@angular/common/http` 提供了一个测试库 `@angular/common/http/testing`，它让你可以直截了当的进行这种 Mock 。

### 9.1 Mock 方法论

### 9.2 搭建环境

要开始测试那些通过 `HttpClient` 发起的请求，就要导入 `HttpClientTestingModule` 模块，并把它加到你的 `TestBed` 设置里去，代码如下：

```javascript
// Http testing module and mocking controller
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

// Other imports
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
```

然后把 `HTTPClientTestingModule` 添加到 `TestBed` 中，并继续设置*被测服务*。

```javascript
describe('HttpClient testing', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ]
    });

    // Inject the http service and test controller for each test
    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
  });
  /// Tests begin ///
});
```

现在，在测试中发起的这些请求会发给这些测试用的后端（testing backend），而不是标准的后端。

这种设置还会调用 `TestBed.get()`，来获取注入的 `HttpClient` 服务和模拟对象的控制器 `HttpTestingController`，以便在测试期间引用它们。

### 9.3 期待并回复请求

现在，你就可以编写测试，等待 GET 请求并给出模拟响应。flush() 方法用于推入准备好的响应数据。

```javascript
it('can test HttpClient.get', () => {
  const testData: Data = {name: 'Test Data'};

  // Make an HTTP GET request
  httpClient.get<Data>(testUrl)
    .subscribe(data =>
      // When observable resolves, result should match test data
      expect(data).toEqual(testData)
    );

  // The following `expectOne()` will match the request's URL.
  // If no requests or multiple requests matched that URL
  // `expectOne()` would throw.
  const req = httpTestingController.expectOne('/data');

  // Assert that the request is a GET.
  expect(req.request.method).toEqual('GET');

  // Respond with mock data, causing Observable to resolve.
  // Subscribe callback asserts that correct data was returned.
  req.flush(testData);

  // Finally, assert that there are no outstanding requests.
  httpTestingController.verify();
});
```



#### 9.3.1 自定义对请求的预期

```javascript
// Expect one request with an authorization header
const req = httpTestingController.expectOne(
  req => req.headers.has('Authorization')
);
```

#### 9.3.2 处理一个以上的请求

如果你需要在测试中对重复的请求进行响应，可以使用 `match()` API 来代替 `expectOne()`，它的参数不变，但会返回一个与这些请求相匹配的数组。一旦返回，这些请求就会从将来要匹配的列表中移除，你要自己验证和刷新（flush）它。

多次调用 flush() 方法准备多个数据

```javascript
// get all pending requests that match the given URL
const requests = httpTestingController.match(testUrl);
expect(requests.length).toEqual(3);

// Respond to each request with different results
requests[0].flush([]);
requests[1].flush([testData[0]]);
requests[2].flush(testData);
```

### 9.4 测试对错误的预期

你还要测试应用对于 HTTP 请求失败时的防护。

调用 `request.flush()` 并传入一个错误信息，如下所示，这里通过 flush() 方法推入一个服务器端的 404 响应。

```javascript
it('can test for 404 error', () => {
  const emsg = 'deliberate 404 error';

  httpClient.get<Data[]>(testUrl).subscribe(
    data => fail('should have failed with the 404 error'),
    (error: HttpErrorResponse) => {
      expect(error.status).toEqual(404, 'status');
      expect(error.error).toEqual(emsg, 'message');
    }
  );

  const req = httpTestingController.expectOne(testUrl);

  // Respond with mock error
  req.flush(emsg, { status: 404, statusText: 'Not Found' });
});
```

另外，你还可以使用 `ErrorEvent` 来调用 `request.error()`.

```javascript
it('can test for network error', () => {
  const emsg = 'simulated network error';

  httpClient.get<Data[]>(testUrl).subscribe(
    data => fail('should have failed with the network error'),
    (error: HttpErrorResponse) => {
      expect(error.error.message).toEqual(emsg, 'message');
    }
  );

  const req = httpTestingController.expectOne(testUrl);

  // Create mock ErrorEvent, raised when something goes wrong at the network level.
  // Connection timeout, DNS error, offline, etc
  const mockError = new ErrorEvent('Network error', {
    message: emsg,
  });

  // Respond with mock error
  req.error(mockError);
});
```

