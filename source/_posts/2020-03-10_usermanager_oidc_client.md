---
title: usermanager 事件管理     
date: 2020-03-10
categories: oidc-client.js
---
usermanager 事件管理
<!-- more -->

### 用户事件

Oidc-client.js 定义了 6 种用户事件

1. userLoaded: 当用户回话建立之后。
2. userUnloaded: 当用户会话结束之后
3. accessTokenExpiring: 在 access token 失效之前
4. accessTokenExpired: access token 失效之后.
5. silentRenewError: 静默刷新 access token 失败.
6. userSignedOut [1.1.0]: 当用户在 OpenID Providers (OPs) 的登录状态发生变化后

#### 用户加载和卸载事件

其实是通过 AccessTokenEvents 的 load() 和 unload() 来实现的。本质上是通过定时器来实现的。然后通过 Event 来触发对处理函数的调用。

所以，对于 access token 的即将过期和已经过期事件提供了支持。

```javascript
load(user, raiseEvent=true) {
  Log.debug("UserManagerEvents.load");
  super.load(user);
  if (raiseEvent) {
    this._userLoaded.raise(user);
  }
}
unload() {
   Log.debug("UserManagerEvents.unload");
   super.unload();
   this._userUnloaded.raise();
}
```

addUserLoaded, removeUserLoaded 是一对，addUserUnloaded 和 removeUserUnloaded 是一对，注意它们都没有对应的触发事件函数，原因是它们在 load() 和 unload() 中触发。

```javascript
addUserLoaded(cb) {
  this._userLoaded.addHandler(cb);
}
removeUserLoaded(cb) {
  this._userLoaded.removeHandler(cb);
}

addUserUnloaded(cb) {
  this._userUnloaded.addHandler(cb);
}
removeUserUnloaded(cb) {
  this._userUnloaded.removeHandler(cb);
}
```

不过，需要注意的是，在 UserManager 中，getUser() 方法中，并不会触发 userloaded 事件。

```javascript
    getUser() {
        return this._loadUser().then(user => {
            if (user) {
                Log.info("UserManager.getUser: user loaded");

                this._events.load(user, false);

                return user;
            }
            else {
                Log.info("UserManager.getUser: user not found in storage");
                return null;
            }
        });
    }
```

https://github.com/IdentityModel/oidc-client-js/blob/dev/src/UserManager.js

#### 其他事件

使用标准的事件定义方式处理

1. 支持注册事件处理函数
2. 取消事件处理函数
3. 触发事件

例如，对于静默更新错误事件的支持。

```javascript
addSilentRenewError(cb) {
  this._silentRenewError.addHandler(cb);
}
removeSilentRenewError(cb) {
  this._silentRenewError.removeHandler(cb);
}
_raiseSilentRenewError(e) {
  Log.debug("UserManagerEvents._raiseSilentRenewError", e.message);
  this._silentRenewError.raise(e);
}
```



#### 源码链接

https://github.com/IdentityModel/oidc-client-js/blob/dev/src/UserManagerEvents.js
