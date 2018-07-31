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

你可能已经猜到或者知道，秘密来自 Inject 装饰器，该装饰器使用了库 Reflect 来讲一些元数据连接到类 A，Inject 的一些关键实现如下：
```javascript
function ParamDecorator(cls: any, unusedKey: any, index: number) {
  ...
  // parameters here will be [ {token: B} ]
  Reflect.defineMetadata('parameters', parameters, cls);
  return cls;
}
```
所以，你可以看到，在 Inject 执行的时候，我们可以得到关于连接到该类的依赖信息。
反过来说，当我们将 providers 传递给 resolveAndCreate 方法的时候，注入器将遍历每个 provider 来收集使用了类似 Reflect 对象的所有依赖信息。这些发生在 resolveRefectiveFactory 函数内。
```javascript
function resolveReflectiveFactory(provider) {
  // ...
  if (provider.useClass) {
    var useClass = resolveForwardRef(provider.useClass);
    factoryFn = reflector.factory(useClass);
    resolvedDeps = _dependenciesFor(useClass);
  }
}

export class ReflectionCapabilities {
  ...
  private _ownParameters(type, parentCtor) {
     ...
     // R is Reflect
     const paramAnnotations = R.getOwnMetadata('parameters', type);
  }
}
``````
这些代码展示了 ReflectiveInjector 当前通过 Reflect 垫片提供的反射能力，来隐式抽取依赖信息。

### StaticInjector 有何不同？
新的 Static 注入器完全不抽取隐式依赖信息。相反，它需要开发者显式针对每个 provider 指定出来。所以，对于 ReflectiveInjector 我们这样做：
```typescript
class B {}
class A { constructor(@Inject(B) b) {} }

const i = ReflectiveInjector.resolveAndCreate([A, B]);
const a = i.get(A);
``````

当使用 StaticInjector 的时候，我们需要改成如下形式：
```typescript
class B {}
class A { constructor(b) {} }
const i = Injector.create([{provide: A, useClass: A, deps: [B]]};
const a = i.get(A);
```
你可以看到，在这里我显式指定了 A 依赖 B，该新的 provider 类型被称为 StaticClassProvider，由如下接口定义：
```typescript
export interface StaticClassProvider {
  provide: any;
  useClass: Type<any>;
  deps: any[];
  multi?: boolean;
}
``````
下面是所有支持的 provider 类的静态版本
```typescript
export type StaticProvider = ValueProvider | 
                             ExistingProvider |
                             StaticClassProvider |  
                             ConstructorProvider |
                             FactoryProvider | any[];
``````

### StaticInjector 好在哪里？
对于静态注入器来说，最主要的好处是速度。ReflectiveInjector 依赖于反射。由于浏览器当前并不支持所以现在使用 Reflect 库垫片。
它保存所有你使用装饰器修饰的类信息到一个映射中，类似如下代码：
```javascript
// core-js/library/modules/_metadata.js
var Map     = require('./es6.map')
  , $export = require('./_export')
  , shared  = require('./_shared')('metadata')
  , store   = shared.store || (shared.store = new (require('./es6.weak-map')));
var getOrCreateMetadataMap = function(target, targetKey, create){
  var targetMetadata = store.get(target);
  if(!targetMetadata){
    if(!create)return undefined;
    store.set(target, targetMetadata = new Map);
  }
``````

这意味着，如果你使用了上千的类，你将会得到一个巨大的映射。在这个映射中进行查询变得代价高昂。静态的注入器并不适用 Reflect，也不需要这个查询。   
除了速度之外，静态注入器也省去了对 Reflect 的依赖。

### 对你来说需要什么？
Angular 5 引入了一些破坏性的升级，但是大多数的开发者并不需要做什么就可以成功迁移。这是因为多数的开发者使用 Module 和 Component 所创建的注入器，而 ReflectiveInjectors 并不用于此处。但是 Angular 还为 Platform、Compiler 和 NgZone 创建了 3 个注入器，它们使用了 RefectiveInjector ，将会被变更所影响。
不过，开发者如何与其互动呢？好，记住你在 main.ts 中常用的下述代码：
```javascript
platformBrowserDynamic().bootstrapModule(AppModule);
``````
第一个函数调用创建了 platform，并取得 platform provider，第二个函数实例化了 JIT 编译器并获取了 compiler 的 provider。NgZoneJnjector 不适用任何 provider，所以不受影响。

我说过，你可以为 platform 传递如下的 provider 
```typescript
class B {}
class A { constructor(@Inject(B) b) {} }

platformBrowserDynamic([A, B])
``````
对于编译器，类似如下所示：
```typescript
class B {}
class A { constructor(@Inject(B) b) {} }
bootstrapModule(AppModule, {providers: [A, B]});
``````
由于 platform 将会迁移到 StaticInjector，它将不能从隐式的元数据中获取依赖信息，所以，你需要将代码重构为如下形式：
```typescript
class B {}
class A { constructor(b) {} }
platformBrowserDynamic([{ provide: A, useClass: A, deps: [B] }, B])
``````
对于编译器
```typescript
class B {}
class A { constructor(b) {} }
bootstrapModule(AppModule,
  {
    providers: 
      [
        {provide: A, useClass: A, deps: [B]},
        B
      ]
  });
``````

由于 ReflectiveInjector 并废弃了，所以，如果你在代码中使用了它，最好开始迁移到新的 Static 注入器上来。

