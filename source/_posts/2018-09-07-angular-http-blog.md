---
title: 在 Angular 中访问 Blob 数据
date: 2018-09-07
caterigies: angular
tages: [angular]
---
本文说明了如何在 Angular 中通过 API 访问服务器端的 Blob 数据。
<!- more -->

## 在 Angular 中访问 Blob 数据

本文说明了如何在 Angular 中通过 API 访问服务器端的 Blob 数据。

### Blob 指什么？

MDN 中的说明是：`Blob` 对象表示一个不可变、原始数据的类文件对象。见：[Blob](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob)

更进一步来说，BLOB (binary large object)，二进制大对象，是一个可以存储二进制文件的容器。其中的内容，是以二进制的字节形式表示的。在数据库中，我们也会见到类似的数据类型。

当我们从服务器上下载文件的时候，我们并不关心文件的内容是图片还是 PDF，我们关心的只是把文件内容的字节完整地下载并保存出来。这个时候，我们需要的就是从字节的角度来看待资源，在前端，Blob 就是表示内存中的一个字节块的对象。

#### 问题现象

在 Angular 中，当我们需要从服务器端下载文件的时候，通过 Angular 的 Http 来访问 API 可能会遇到问题，stackoverflow 上就提供了这样一个案例。

 [PDF Blob is not showing content, Angular 2](https://stackoverflow.com/questions/37046133/pdf-blob-is-not-showing-content-angular-2)

问题中，询问者希望下载服务器上的某个 PDF 文件，将代码整理之后，核心代码如下：

```typescript
this._http
   .get(this.getPDFUrl + '/' + customerServiceId)
   .subscribe( (data: any) => {
     console.log("[Receipt service] GET PDF byte array " + JSON.stringify(data));

     var file = data.blob();            
     var fileURL = URL.createObjectURL(file);
     window.open(fileURL);
 });
```

代码中提供了正确的资源 Url 地址，希望从响应的 body 中获取 PDF 文件的内容。这里使用了 blob() 以获取 Blob 形式表示的资源内容。但是，会得到如下的异常：

```
The request body isn't either a blob or an array buffer
```

提供了 blob() 方法来获取 Blob 形式的资源内容，为什么会得到这样的异常呢？

然后，你发现可以使用 arrayBuffer() 来得到一个 ArrayBuffer 对象，你自己从 ArrayBuffer 转换为 Blob 类型的对象，但是，如果检查一下这个 ArrayBuffer 对象，就会发现其包含的内容长度大约为实际文件尺寸的一倍左右。这种方式是错误的。

我们找到 Angular 中 [body.ts](https://github.com/angular/angular/blob/master/packages/http/src/body.ts) 的源码看一下。

```typescript
export abstract class Body {
  /**
   * @internal
   */
  protected _body: any;
  ...
  /**
   * Return the body as an ArrayBuffer
   */
  arrayBuffer(): ArrayBuffer {
    if (this._body instanceof ArrayBuffer) {
      return <ArrayBuffer>this._body;
    }

    return stringToArrayBuffer(this.text());
  }

  /**
    * Returns the request's body as a Blob, assuming that body exists.
    */
  blob(): Blob {
    if (this._body instanceof Blob) {
      return <Blob>this._body;
    }

    if (this._body instanceof ArrayBuffer) {
      return new Blob([this._body]);
    }

    throw new Error('The request body isn\'t either a blob or an array buffer');
  }
}
```

可以看到，在访问 blob() 方法的时候，会检查响应内容的数据类型是否是 ArrayBuffer 类型，如果不是，则抛出了我们看到的异常，在访问 arrayBuffer() 方法的时候，如果不是 ArrayBuffer 类型，则使用了 text() 来获取响应的文本内容。text() 函数的内容也很有趣，里面涉及到字符编码。

在使用 arrayBuffer() 方法的时候，Angular 将响应的内容看成了字符串，但是，在浏览器中，字符串使用了 Unicode 编码，在将二进制文件的内容转换为字符串的过程中，将单字节转换为了 Unicode 16 的双字节，导致了内容长度的加倍。所以，这种方式是错误的。

那么，怎么样将响应内容表示为 ArrayBuffer 类型呢？

##### ResponseContentType

Angualr 已经定义了一个响应内容类型 ResponseContentType 枚举，其中的一个值就是 Blob。

```typescript
/**
 * Define which buffer to use to store the response
 * @deprecated see https://angular.io/guide/http
 */
export enum ResponseContentType {
  Text,
  Json,
  ArrayBuffer,
  Blob
}	
```

[enums.ts](https://github.com/angular/angular/blob/master/packages/http/src/enums.ts)

##### RequestOptions

在 RequestOptions 请求描述中，使用了这个枚举类型，`responseType` 属性的类型就是 `ResponseContentType`，在注释中说明了该属性用来说明如何存储响应的内容。

```typescript
...
import {RequestMethod, ResponseContentType} from './enums';
...

export class RequestOptions {
   ...
   /*
   * Select a buffer to store the response, such as ArrayBuffer, Blob, Json (or Document)
   */
   responseType: ResponseContentType|null;
   ...
}
```

[base_request_options.ts](https://github.com/angular/angular/blob/master/packages/http/src/base_request_options.ts)

通常你没有设置这个属性，在默认情况下，是以 Json 方式来使用的。

```
responseType?: 'json';
```



#### 使用 HTTP 访问 Blob 数据

**deprecated**

在早期版本的 HTTP 方式中，使用了 Http 类进行 API 访问。其中的 request 是各种访问形式的核心函数，为其他具体的请求形式提供服务，例如，get 请求中调用了这个 request 来实现 API 访问。

```typescript
 /*
 * @deprecated see https://angular.io/guide/http
 */
@Injectable()
export class Http {
  constructor(protected _backend: ConnectionBackend, protected _defaultOptions: RequestOptions) {}

  request(url: string|Request, options?: RequestOptionsArgs): Observable<Response> {
    let responseObservable: any;
    if (typeof url === 'string') {
      responseObservable = httpRequest(
          this._backend,
          new Request(mergeOptions(this._defaultOptions, options, RequestMethod.Get, <string>url)));
    } else if (url instanceof Request) {
      responseObservable = httpRequest(this._backend, url);
    } else {
      throw new Error('First argument must be a url string or Request instance.');
    }
    return responseObservable;
  }

  /**
   * Performs a request with `get` http method.
   */
  get(url: string, options?: RequestOptionsArgs): Observable<Response> {
    return this.request(
        new Request(mergeOptions(this._defaultOptions, options, RequestMethod.Get, url)));
  }
  ...
  }
```

[http.ts](https://github.com/angular/angular/blob/master/packages/http/src/http.ts)

我们需要在 RequestOptionsArgs 这个参数中设置期望的返回数据格式。例如：

```javascript
this.http.get(
    'my/url/to/ressource',
    { responseType: ResponseContentType.Blob }
  )
```

然后，就可以在响应对象上调用 blob() 来获取没有经过错误转换的实际数据了。



#### 使用 HttpClient 访问 Blob 数据

在升级之后，现在已经使用 [HttpClient](https://angular.io/api/common/http/HttpClient) 来访问 API 了。

该对象提供了多种重载方式，可以更为方便地使用返回的 Blob，例如 get 方法的一个定义如下：

```typescript
get(url: string, options: {
    headers?: HttpHeaders | {
        [header: string]: string | string[];
    };
    observe?: 'body';
    params?: HttpParams | {
        [param: string]: string | string[];
    };
    reportProgress?: boolean;
    responseType: 'blob';
    withCredentials?: boolean;
}): Observable<Blob>
```

所以，可以在下一步直接得到这个 Blob 对象，而不需要再调用 blob() 方法了。

### 相关问题

* 实际上，在 Angular 的 issues 中有一个关于这个问题的 issue：[HttpClient - HttpErrorResponse not json but blob #19888](https://github.com/angular/angular/issues/19888)

