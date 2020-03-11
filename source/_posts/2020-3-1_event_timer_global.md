---
title: event, global & timer 
date: 2020-03-10
categories: oidc-client.js
---
本文剖析了 oidc-client.js 中 event, global 和 timer 的实现。
<!-- more -->

### Event 管理

每个 Event 内部有一个所管理事件的名称，一个回调函数列表。从构造函数可以看到


```javascript
constructor(name) {
  this._name = name;
  this._callbacks = [];
}
```

#### 处理器的注册和取消

注册新的处理器就是将处理函数添加到回调列表的末尾。

而取消注册则是将匹配的处理函数从列表中删除。

```javascript
addHandler(cb) {
  this._callbacks.push(cb);
}

removeHandler(cb) {
  var idx = this._callbacks.findIndex(item => item === cb);
  if (idx >= 0) {
    this._callbacks.splice(idx, 1);
  }
}
```

#### 触发事件

触发事件则通过遍历这个回调列表，依次调用各个回调函数来实现。调用的顺序是按照注册的先后顺序。

```javascript
raise(...params) {
  Log.debug("Event: Raising event: " + this._name);
  for (let i = 0; i < this._callbacks.length; i++) {
    this._callbacks[i](...params);
  }
}
```

#### 源码链接

https://github.com/IdentityModel/oidc-client-js/blob/dev/src/Event.js

### 定时器 Timer

定时器是从 Event 派生的。所以可以在定时器上注册和取消注册处理函数。

```javascript
export class Timer extends Event
```

定时器内部使用了 Global 对象。

#### Global

Global 对原生的系统功能进行了封装，通过静态属性的方式暴露出来。例如

* location
* localStorage
* sessionStorage
* XMLHttpRequest
* timer

 其中 timer 是对 setInterval() 和 clearInterval() 函数进行了封装。

```javascript
const timer = {
  setInterval: function (cb, duration) {
    return setInterval(cb, duration);
  },
  clearInterval: function (handle) {
    return clearInterval(handle);
  }
};
```

源码链接：https://github.com/IdentityModel/oidc-client-js/blob/dev/src/Global.js

#### 构造定时器

每个定时器有一个名字，和一个名为 newFunc() 的函数实例，用来返回当前的时间。

```javascript
constructor(name, timer = Global.timer, nowFunc = undefined) {
  super(name);
  this._timer = timer;

  if (nowFunc) {
    this._nowFunc = nowFunc;
  }
  else {
    this._nowFunc = () => Date.now() / 1000;
  }
}
```

#### 取消定时操作

检查当前是否有注册的处理器，如果有的话，取消定时器处理，并删除当前的处理器。

```javascript
cancel() {
  if (this._timerHandle) {
    Log.debug("Timer.cancel: ", this._name);
    this._timer.clearInterval(this._timerHandle);
    this._timerHandle = null;
  }
}
```

#### 执行回调函数

检查当前到设置的过期时间差值，如果已经到达或者超过了设置的过期时间，那么取消定时器，并执行回调函数。

```javascript
_callback() {
  var diff = this._expiration - this.now;
  Log.debug("Timer.callback; " + this._name + " timer expires in:", diff);

  if (this._expiration <= this.now) {
    this.cancel();
    super.raise();
  }
}
```

#### 初始化定时器

在初始化定时器的时候，指定该定时器的触发间隔。根据此间隔计算出过期时间。

如果在这个时间点上已经定义过处理，那么直接返回。

否则，先把原来的定义取消掉，重新注册新的定时器。

需要注意的是，这里并没有直接使用过期时间，而是使用了一个 5ms 的检查间隔来定义。

```javascript
const TimerDuration = 5; // seconds
```

然后在 _callback() 中不断检查过期时间，来决定事件触发的时机。

```javascript
init(duration) {
  if (duration <= 0) {
    duration = 1;
  }
  duration = parseInt(duration);

  var expiration = this.now + duration;
  if (this.expiration === expiration && this._timerHandle) {
    // no need to reinitialize to same expiration, so bail out
    Log.debug("Timer.init timer " + this._name + " skipping initialization since already initialized for expiration:", this.expiration);
    return;
  }

  this.cancel();

  Log.debug("Timer.init timer " + this._name + " for duration:", duration);
  this._expiration = expiration;

  // we're using a fairly short timer and then checking the expiration in the
  // callback to handle scenarios where the browser device sleeps, and then
  // the timers end up getting delayed.
  var timerDuration = TimerDuration;
  if (duration < timerDuration) {
    timerDuration = duration;
  }
  this._timerHandle = this._timer.setInterval(this._callback.bind(this), timerDuration * 1000);
}
```

#### 源码链接

https://github.com/IdentityModel/oidc-client-js/blob/dev/src/Timer.js


