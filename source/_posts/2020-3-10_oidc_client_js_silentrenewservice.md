---
title: oidc-client.js 中 SilentRenewService 源码分析     
date: 2020-03-10
categories: oidc-client.js
---
分析了 oidc-client.js 中静默刷新服务的源码实现
<!-- more -->


### 构造函数

从构造函数可以看到，它需要一个 UserManager 实例来进行初始化。

```javascript
constructor(userManager) {
  this._userManager = userManager;
}
```

### 实现 Token 的静默刷新

`_tokenExpiring` 实现静默刷新的处理函数，当 token 即将过期的时候，如果启用了静默刷新，将会回调此函数，通过调用 UserManager 的 `signinSilent()` 函数实现静默刷新。

```javascript
_tokenExpiring() {
  this._userManager.signinSilent().then(user => {
    Log.debug("SilentRenewService._tokenExpiring: Silent token renewal successful");
  }, err => {
    Log.error("SilentRenewService._tokenExpiring: Error from signinSilent:", err.message);
    this._userManager.events._raiseSilentRenewError(err);
  });
}
```

### 启动静默刷新

启动静默刷新之后，会在此对象实例中的 `_callback` 保存一个回调函数的引用。该回调函数是通过将对象本身绑定到函数 `_tokenExpiring` 来得到的。这样在静默刷新函数中，就可以使用 `this` 来访问  `userManager` 对象了。

如果没有的话，通过 `bind` 来得到这个回调函数，保存起来。

然后将该回调函数注册到访问令牌的过期回调事件中。

userManager 的 getUser() 会在加载用户信息之后，检查访问令牌的过期时间，并启动访问令牌的过期监控。这样，在即将过期的时候，上面注册的回调函数就会被调用。

```javascript
start() {
  if (!this._callback) {
    this._callback = this._tokenExpiring.bind(this);
    this._userManager.events.addAccessTokenExpiring(this._callback);

    // this will trigger loading of the user so the expiring events can be initialized
    this._userManager.getUser().then(user=>{
      // deliberate nop
    }).catch(err=>{
      // catch to suppress errors since we're in a ctor
      Log.error("SilentRenewService.start: Error from getUser:", err.message);
    });
  }
}
```



### 停止静默刷新

停止静默刷新就比较简单了，检查一下是否有回调函数生成，如果有那么做两件事：

1. 从 userManager 的访问令牌过期事件中，取消已经注册的回调函数。
2. 删除回调函数。

```javascript
stop() {
  if (this._callback) {
    this._userManager.events.removeAccessTokenExpiring(this._callback);
    delete this._callback;
  }
}
```

### Source code

https://github.com/IdentityModel/oidc-client-js/blob/dev/src/SilentRenewService.js

```javascript
// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from './Log.js';

export class SilentRenewService {

    constructor(userManager) {
        this._userManager = userManager;
    }

    start() {
        if (!this._callback) {
            this._callback = this._tokenExpiring.bind(this);
            this._userManager.events.addAccessTokenExpiring(this._callback);

            // this will trigger loading of the user so the expiring events can be initialized
            this._userManager.getUser().then(user=>{
                // deliberate nop
            }).catch(err=>{
                // catch to suppress errors since we're in a ctor
                Log.error("SilentRenewService.start: Error from getUser:", err.message);
            });
        }
    }

    stop() {
        if (this._callback) {
            this._userManager.events.removeAccessTokenExpiring(this._callback);
            delete this._callback;
        }
    }

    _tokenExpiring() {
        this._userManager.signinSilent().then(user => {
            Log.debug("SilentRenewService._tokenExpiring: Silent token renewal successful");
        }, err => {
            Log.error("SilentRenewService._tokenExpiring: Error from signinSilent:", err.message);
            this._userManager.events._raiseSilentRenewError(err);
        });
    }
}
```


