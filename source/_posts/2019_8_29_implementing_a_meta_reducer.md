---
title: 你并不需要中间件
date: 2019-08-29
categories: ngrx
---
ngrx 团队认为我们完全不需要 redux 风格的中间件，多数情况下，我们可以使用 元 reducer (meta-reducer) 来达到同样的效果。
该文通过两个示例演示了它的使用方式。
<!-- more -->

# 在 ngrx/store 中实现 meta-reducer

### 你并不需要中间件

ngrx 团队认为我们完全不需要 redux 风格的中间件，多数情况下，我们可以使用 **元 reducer** (meta-reducer) 来达到同样的效果。

### 什么是元 reducer?

meta-reducer 是高阶 reducer 的时尚名称 (例如函数)

由于 reducer 就是函数，我们可以实现高阶的 reducer - “元 reducer”。

> 高阶函数是可以接收函数作为参数，甚至返回函数的函数。

简单点说：

> 接收传入的 reducer，做任何你需要完成的工作，然后返回新的 reducer。

### 创建日志 reducer

```javascript
export function logger( reducer ) {
  return function newReducer( state, action ) {
   
  }
}
```

这是元 reducer 的基础签名。该函数期望接收一个 reducer 作为参数，然后需要返回一个新的 reducer。

```javascript
export function logger( reducer ) {
  return function newReducer( state, action ) {
    console.group(action.type);
    const nextState = reducer(currentState, action);
    console.log(`%c prev state`, `color: #9E9E9E; font-weight: bold`, state);
    console.log(`%c action`, `color: #03A9F4; font-weight: bold`, action);
    console.log(`%c next state`, `color: #4CAF50; font-weight: bold`, nextState);
    console.groupEnd();
    return nextState;
  }
}
```

该 `logger` reducer 仅仅记录当前的状态，action 以及下一个状态，然后在不进行任何修改的情况下，返回当前 reducer 处理的结果。

现在，让我们将这个 meta-reducer 添加到仓库中。

```javascript
import { compose } from "@ngrx/core";

function todosReducer(state, action) { ... }
function postsReducer(state, action) { ... }

const reducers = { todos: todosReducer, posts: postsReducer };

@NgModule({
  ...
  imports: [
    ...
    StoreModule.provideStore(compose(logger, combineReducers)(reducers)),
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
```

首先，我们需要将 `reducers` 传递给 `combineReducers` 函数。你可能已经知道，`combineReducers` 将会返回新的 reducer，它将会调用所有的子 reducer，然后收集所有的结果，并合并到单个的状态对象中。

基于 `compose` 函数的帮助，我们可以获取 `combineReducer` 函数的结果，然后将其传递给 `logger` 这个 meta-reducer。


如果我们简化掉 `compose` 函数，我们将得到如下的代码：

```javascript
StoreModule.provideStore( logger(combineReducers(reducers)) )
```


现在，我们看看另一个示例。当用户登出之后，重置状态。

### 创建用来重置的 meta-reducer

我们需要在 `LOG_OUT` 这个 action 之后，清理状态。

```javascript
export const LOG_OUT = 'LOG_OUT';

export function reset( reducer ) {
  return function newReducer( state, action ) {

    if( action.type === LOG_OUT ) {
      state = undefined;
    }

    const nextState = reducer(state, action);

    return nextState;

  }
}
```

如果 action 的类型是 `LOG_OUT`，我们将返回一个 `undefined` ，进而所有的 reducers 都将如它们建议的那样，返回初始值。

现在，我们就可以将 `reset` 这个 meta-reducer 添加到到我们的仓库中。

```javascript
StoreModule.provideStore( compose( reset, logger, combineReducers )( reducers )),
```
### ngRx 中的两个实例应用

1. [immutability_reducer.ts](https://github.com/ngrx/platform/blob/master/modules/store/src/meta-reducers/immutability_reducer.ts), 用来将 state 和 actio 进行不变化处理的 reducer.
```javascript
import { ActionReducer } from '../models';
import { isFunction, hasOwnProperty, isObjectLike } from './utils';

export function immutabilityCheckMetaReducer(
  reducer: ActionReducer<any, any>,
  checks: { action: boolean; state: boolean }
): ActionReducer<any, any> {
  return function(state, action) {
    const act = checks.action ? freeze(action) : action;

    const nextState = reducer(state, act);

    return checks.state ? freeze(nextState) : nextState;
  };
}

function freeze(target: any) {
  Object.freeze(target);

  const targetIsFunction = isFunction(target);

  Object.getOwnPropertyNames(target).forEach(prop => {
    if (
      hasOwnProperty(target, prop) &&
      (targetIsFunction
        ? prop !== 'caller' && prop !== 'callee' && prop !== 'arguments'
        : true)
    ) {
      const propValue = target[prop];

      if (
        (isObjectLike(propValue) || isFunction(propValue)) &&
        !Object.isFrozen(propValue)
      ) {
        freeze(propValue);
      }
    }
  });

  return target;
}
```

2. [serialization_reducer.ts](https://github.com/ngrx/platform/blob/master/modules/store/src/meta-reducers/serialization_reducer.ts) 开发时，对 action 和 state 进行可序列化检查的 reducer。

```javascript
import { ActionReducer } from '../models';
import {
  isPlainObject,
  isUndefined,
  isNull,
  isNumber,
  isBoolean,
  isString,
  isArray,
} from './utils';

export function serializationCheckMetaReducer(
  reducer: ActionReducer<any, any>,
  checks: { action: boolean; state: boolean }
): ActionReducer<any, any> {
  return function(state, action) {
    if (checks.action) {
      const unserializableAction = getUnserializable(action);
      throwIfUnserializable(unserializableAction, 'action');
    }

    const nextState = reducer(state, action);

    if (checks.state) {
      const unserializableState = getUnserializable(nextState);
      throwIfUnserializable(unserializableState, 'state');
    }

    return nextState;
  };
}

function getUnserializable(
  target?: any,
  path: string[] = []
): false | { path: string[]; value: any } {
  // Guard against undefined and null, e.g. a reducer that returns undefined
  if ((isUndefined(target) || isNull(target)) && path.length === 0) {
    return {
      path: ['root'],
      value: target,
    };
  }

  const keys = Object.keys(target);
  return keys.reduce<false | { path: string[]; value: any }>((result, key) => {
    if (result) {
      return result;
    }

    const value = (target as any)[key];

    if (
      isUndefined(value) ||
      isNull(value) ||
      isNumber(value) ||
      isBoolean(value) ||
      isString(value) ||
      isArray(value)
    ) {
      return false;
    }

    if (isPlainObject(value)) {
      return getUnserializable(value, [...path, key]);
    }

    return {
      path: [...path, key],
      value,
    };
  }, false);
}

function throwIfUnserializable(
  unserializable: false | { path: string[]; value: any },
  context: 'state' | 'action'
) {
  if (unserializable === false) {
    return;
  }

  const unserializablePath = unserializable.path.join('.');
  const error: any = new Error(
    `Detected unserializable ${context} at "${unserializablePath}"`
  );
  error.value = unserializable.value;
  error.unserializablePath = unserializablePath;
  throw error;
}
```



### See also

* [Implementing a Meta-Reducer in ngrx/store](https://netbasal.com/implementing-a-meta-reducer-in-ngrx-store-4379d7e1020a)
