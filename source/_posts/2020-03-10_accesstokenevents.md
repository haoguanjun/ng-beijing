---
title: AccessTokenEvents 对象     
date: 2020-03-10
categories: oidc-client.js
---
分析 AccessTokenEvents 对象   
<!-- more -->


### AccessTokenEvents 对象

用来管理 access token 相关的事件。不过，它并不使用 Event 来定义，而是通过 Timer 来定义。

oidc-client.js 定义了 3 种 access token 事件，不过它们并不基于 Event 定义，而是通过内部的定时器来实现的。外部需要通过对应的方法来进行操作。

1. Load: access token 加载
2. accessTokenExpiring: access token 过期之前
3. accessTokenExpired: access token 过期之后

成员变量 accessTokenExpiringNotificationTime 表示在 access token 过期之前多长时间，触发过期的事件，以秒为单位，默认 60 秒。

```javascript
const DefaultAccessTokenExpiringNotificationTime = 60; // seconds
```

#### 构造函数

通过构造函数可以看到它们之间的关系

```javascript
constructor({
  accessTokenExpiringNotificationTime = DefaultAccessTokenExpiringNotificationTime,
  accessTokenExpiringTimer = new Timer("Access token expiring"),
  accessTokenExpiredTimer = new Timer("Access token expired")
} = {}) {
  this._accessTokenExpiringNotificationTime = accessTokenExpiringNotificationTime;

  this._accessTokenExpiring = accessTokenExpiringTimer;
  this._accessTokenExpired = accessTokenExpiredTimer;
}
```



#### 加载 access token

一旦成功加载了 access token，那么就会自动注册 access token 过期之前和过期之后的事件。

```javascript
load(container) {
  // only register events if there's an access token and it has an expiration
  if (container.access_token && container.expires_in !== undefined) {
    let duration = container.expires_in;
    Log.debug("AccessTokenEvents.load: access token present, remaining duration:", duration);

    if (duration > 0) {
      // only register expiring if we still have time
      let expiring = duration - this._accessTokenExpiringNotificationTime;
      if (expiring <= 0){
        expiring = 1;
      }

      Log.debug("AccessTokenEvents.load: registering expiring timer in:", expiring);
      this._accessTokenExpiring.init(expiring);
    }
    else {
      Log.debug("AccessTokenEvents.load: canceling existing expiring timer becase we're past expiration.");
      this._accessTokenExpiring.cancel();
    }

    // if it's negative, it will still fire
    let expired = duration + 1;
    Log.debug("AccessTokenEvents.load: registering expired timer in:", expired);
    this._accessTokenExpired.init(expired);
  }
  else {
    this._accessTokenExpiring.cancel();
    this._accessTokenExpired.cancel();
  }
}
```

#### 源码链接

https://github.com/IdentityModel/oidc-client-js/blob/dev/src/AccessTokenEvents.js
