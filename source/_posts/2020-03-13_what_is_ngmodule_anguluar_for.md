---
title: Angular 的 NgModule 是为了解决什么问题？    
date: 2020-03-13
categories: angular
---
从数据驱动设计和领域驱动设计的角度分析了 ngMoudle 解决的问题。
<!-- more -->

作者：DD菜
链接：https://www.zhihu.com/question/376817427/answer/1069081450
来源：知乎
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。

很多React程序员不了解Angular，同样，很多Angular程序员也不了解React，尤其是关于这两个框架的核心 —— module。
引起关于module讨论的主要原因有两个：
* 数据驱动设计 vs 领域驱动设计

* 面向对象 vs 函数式

这两个比较中涉及到的4个理念之间其实都不冲突，开发时都可以使用，但是都很容易形成 **思维惯性**  — 比如，如果你刚开始编程接触到的是数据驱动，那你会很难理解领域驱动，反之亦然。

ngModule就是体现 **领域驱动设计 + 面向对象** 的，你如果用这套思维看，ngModule是必须的，但是如果你按照类似 Redux 的那种 **数据驱动设计 + 函数式** 的方式思考问题，可能就会觉得它多余了。

### 领域驱动设计

这个比较容易说，因为 React 16.8 之后也可以采用领域驱动思想方法。

既然题主提到了Provider，那就由此入手吧：

> Context 主要应用场景在于很多 不同层级的组件需要访问**同样一些的数据**。请谨慎使用，因为这会使得组件的复用性变差。—— React 官方文档

划重点：**同样一些数据**！

是的，重点放在`同样`和`数据`上，这部分 Context.Provider 提供的数据，目的是 —— 

> 目的是为了共享那些对于一个组件树而言是“全局”的数据

从中可知：

* 你需要将全局组件树 **分段**，确定哪些组件树是该Context下，哪些不是，当然，最好的方法是全部放在全局引入，可以防止某些数据问题 —— 单一数据源，Redux模式。
* Provider 提供的是数据，并非 “响应式”数据，数据的变更并不能导致视图的渲染，（你看，Angular程序员同样理解不了为啥值改变了而渲染不出来）。

实际上，React-Redux就是这么做的：

```javascript
// react-redux 源码
  function Provider({ store, context, children }) {
  // ...
  useEffect(() => {
    const { subscription } = contextValue
    subscription.trySubscribe()
    if (previousState !== store.getState()) {
      subscription.notifyNestedSubs()
    }
  }, [contextValue, previousState])
  // ...
  return <Context.Provider value={contextValue}>{children}</Context.Provider>
  }
```

Redux干了哪些事？

监听（useEffect）并 compose **整个应用的数据（store）变更（actions）** ，并变更顶层组件数据，剩下得交给 React 协调处理渲染。

这种单独存储应用数据，行为附加在整个应用数据上的思想方法，叫做**数据驱动设计**。

有没有问题？没有问题！但是完美么？开玩笑，世界上怎么可能又完美的方案？这里引用一篇InfoQ上的文章：

[从数据驱动开发到领域驱动设计的经验 InfoQ](https://www.infoq.cn/article/2013/10/data-driven-to-ddd)

假设面对一个很复杂的应用，由于**再复杂的应用也不可能处处复杂！**，这时需要：

> 对于复杂行为和 CRUD 的结合部分，Julie 建议识别出复杂部分，并将其分解为独立的有界上下文，并对它们运用 DDD

数据驱动分层的最大问题就是 —**聚焦困难**，对代码有侵入式破坏,比如：

我明明要select组件展开 —

* 为啥要dispatch一个SELECT_EXPAND事件？
* 为啥还要在另一个文件里写个switch？
* React 本身就有渲染树，为啥自己还要实现一个状态树？

### 为啥要将一个本组件的逻辑写在另一个地方？

那我们来看看DDD，什么是DDD —领域驱动呢？

> 分析你的需求，找到你的问题，将其封装成边界清晰的模块

React 可以么？React 现在可以！Hook 使你在无需修改组件结构的情况下复用状态逻辑。这使得在组件间或社区内共享 Hook 变得更便捷。React 16.8 之前的 state，setState 是**很难复用的**，挂在在 this 上，一旦需要通过 Context 共享状态，需要你自己实现观察者模式，导致数据驱动分层比“模块化”效用更高。

而现在，DDD很方便，你只需要将hooks作为Provider的值即可。

```javascript
const Context = createContext(null)
  <Context.Provider value={useState('')}}> ... </Context.Provider>
```

只要在 Context 的作用范围以内，都可以随意 **获取** 和 **变更** context 的值。

大家知道，**获取 + 变更 = 响应式**，因此，React 自此之后 **处处** 响应式，复用不再成为问题。

好了，假设你现在将 **当前** Context 内的数据和组件封装起来，可能为如下形式：

```javascript
const Context = createContext(null)

const [value,setValue] = useState('')
const [value2,setValue2] = useState('')
function test(){
  // ...
}
<Context.Provider value={{value,setValue,value2,setValue2,test ...}} />
```
在经过一系列猛如虎的操作，变成了：
```javascript
@Inject({
    value,setValue,value2,setValue2,test
})
function SomeComponent (){
    // ...
}

// ====>
declare module {
    component: SomeComponent,
    providers: {value,setValue,value2,setValue2,test}
}
```

恭喜你，你得到了丐版的类ngModule。

为啥不是完全版？因为这里的useState解析的数据，都是—

> **具体数据！**

### 面向对象 —— 把相关的数据和方法组织为一个整体来看待

对象是具体的某一事务

而类 —— 是具有相同特性（数据元素）和行为（功能）的对象的抽象

注意，类是**抽象**的，不是具体的，它是没有运行的函数 （prototype），因此，假设你的代码在面向对象的设计原则中符合 **抽象构建，实现扩展**（开闭原则），就**必须面临实例化问题**。

这便是 ngModule 官方文档中说的：

* NgModule 只绑定了_可声明的类_，这些可声明的类只是_供Angular 编译器_用的。
* 与 JavaScript 类把它所有的成员类都放在一个巨型文件中不同，你要把该模块的类列在它的@NgModule.declarations列表中。
* NgModule 只能导出_可声明的类_。这可能是它自己拥有的也可能是从其它模块中导入的。它不会声明或导出任何其它类型的类。
* 与 JavaScript 模块不同，NgModule 可以通过把服务提供商加到@NgModule.providers列表中，来用服务扩展整个应用。

ngModule全是抽象数据，相当于为某个类框定了可实现的边界。

在 app 没有运行起来之前，里面什么都没有。

其实 Angular 一旦跑起来，你可以观察，Angular 的 ivy 和 react 的 fiberNode 有异曲同工之妙，但是在没有跑起来之前，Angular 的 module 却和 React 的 provider 有完全不同的思想。

诚然 Angular 更复杂，但是 Angular 更合理，即 —— 

**不仅跑得起来，还说得通** 

—— 能够用类似Compodoc等工具输出工程文档：https://compodoc.github.io/compodoc-demo-todomvc-angular/。<img src="https://pic4.zhimg.com/50/v2-0a3b2243ae8ab6e300646ab6334eae97_hd.jpg" data-rawwidth="1312" data-rawheight="381" data-size="normal" data-caption="" data-default-watermark-src="https://pic3.zhimg.com/50/v2-ac551d4aa7558742f0f5a31bbccd9c94_hd.jpg" class="origin_image zh-lightbox-thumb" width="1312" data-original="https://pic4.zhimg.com/v2-0a3b2243ae8ab6e300646ab6334eae97_r.jpg"/>

**说得通** 这个特性，在快速迭代的时候没有用，但是，在大范围协同工作的时候非常有用，这也是为什么很多人说 Angular 适合大项目的原因。

React 呢？

对于 React 16.8 之前的版本，恕我直言...... （算了，友善些）

但是 16.8 之后的 React 版本 ——

**强烈向 Angular 程序员 推荐！！！！！**

这就不得不说另一个编程方式了 ——

### 函数式 —— 计算的一般抽象

任何一个应用都是一个函数

也就是说，任何功能都能分解成一系列函数的执行

React 的 vm 实现就是如此，每个 React 组件都是函数，每个函数中都有 monad 可以进行传递，简直就是理想的敏捷开发体验。

正因为这个 monad 的加入，React 可以很方便地实现控制反转，很方便实现 **状态提升**，某种情况下来说，比 Angular 的 service 还要方便， 因为 **函数参数是天生的声明**，而Angular 需要改声明文件。

同样，React 由于 hooks 的加入，组件树本身就能很方便地处理 数据， 根本用不着 redux 之流， 还需要实现一个状态树。

所以，推荐一下个人开发的一个基于 React Hooks 的工具库 —— hooxus：[DD菜：Hooxus 更简单地使用hooks](https://zhuanlan.zhihu.com/p/111005458,) 

当然，"说得通"这个问题，还是没有根本解决，不过——

绝大部分情况下，开发人员不需要向别人说明什么。

嘻嘻，所以，这种场景下，React 简直就是神器。

如果在 React 中，你采用了领域驱动，有意无意间你也创建了一个module，如果你认为 module 无用，只能说明你只有一种软件架构理论而已，遇到某些具体问题时，方法论单一会导致你付出更多的时间成本。

如果你掌握了更多方法论，不同框架就变成了不同侧重点的工具，也不会再有类似的问题了。

当然，也可以很快下班了～
