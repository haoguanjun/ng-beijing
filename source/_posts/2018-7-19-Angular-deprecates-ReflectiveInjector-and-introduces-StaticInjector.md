---
title: Angular 退役了 ReflectiveInjector, 我们怎么办？      
date: 2018-07-19
categories: angular
---
Angular 将 ReflectiveInjector 退役了，它是什么？如果在你的项目中使用了它，又有什么影响呢？
<!-- more -->

### 为什么 ReflectiveInjector 是反射式的？

考虑如下的两个类定义，其中 Class A 注入了 Class B，这意味着，我们在获得 A 的实例的时候，也必须获得 B 的实例。但是，注入器 Injector 如何知道这一点呢？

```typescript
class B {}

class A {
  constructor(@Inject(B) b) { }
}

const i = ReflectiveInjector.resolveAndCreate([A, B]);
const a = i.get(A);
```


