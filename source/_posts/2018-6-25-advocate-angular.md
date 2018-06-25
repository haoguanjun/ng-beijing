---
title: 没错，我就是要吹爆Angular     
date: 2018-06-25
categories: Angular
---
## excerpt
当你站在巨人的肩膀上，完全适应了Angular的编程范式，你才会养成对于优秀实现的不懈追求，并且这些习惯都是有益的。
<!-- more -->

原文地址：[没错，我就是要吹爆Angular](https://zhuanlan.zhihu.com/p/38430368)   
作者：[杜帅](https://www.zhihu.com/people/du-shuai-27-14)

距离新版Angular发布已经过去了超过20个月，社区已经有了相当的规模。前端项目复杂性的加深以及对工程化的推进也让大家越来越重视起这一“**框架**”。
但是毕竟正如查理芒格所说：

   拿着锤子的人，看啥都像钉子
   
对与其它前端库的使用者来说，接受起Angular非常困难，而且即便学习了Angular，也往往不得要领。
科学家发现，**在进行编程时，大脑主要活跃的区域是语言相关的区域**。因此Angular的推广不能直接靠宣传Angular，而是应该从其它框架出发，引申出Angular解决了什么问题，这样才能事半功倍（你不能为了让俄罗斯人学会中文就一直对他说中文吧）。
因此我希望借由其它框架，比如React，Vue出发，结合自己的使用经验，告诉大家Angular的强大之处，以及选择Angular带来的裨益。

React曾今席卷整个前端界，甚至是当时MVVM的唯一选择，Angular也借鉴了很多React的实现方式。
但是在使用React的时候，试着思考几个问题：

### 1.为什么一定要用setState更新状态呢？
合并多次更新可以避免资源的浪费，又或是避免视图更新的副作用？
大神Morgan对此有十分详尽的描述：[setState：这个API设计到底怎么样](https://zhuanlan.zhihu.com/p/25954470)
更深入思考一下，可以避免这种额外的语法开销么？为什么不能只关注实现呢？
React是采用将一段JSX模板语法编译成render函数的方式来实现数据映射的，因此必须促发render函数的重复执行才能更新模板，setState很有效地避免的多次重复执行该函数。
细心的小朋友会发现，**如果我将每一次的render拆分得足够细，比如细到每一个具体的tag，那么当我更新其数据的时候，是不是可以不用setState了呢？**
另外一个问题就是，**我怎么在不主动调用setState的情况下知道哪个tag的哪个属性变更了呢？**当然，即便是setState也需要知道状态是否改变，不过只需要找出是否改变，而另一种需要定位改变项的位置。

第一个问题，Angular采用的模板解析HTML+的方式，将元素节点直接解析为elementRef，每一个elementRef都有updateRenderer，在有变更的时候调用render2函数，而这一函数可以由不同平台定义（框架设计之初就想到了跨平台）
而第二个问题，Angular借鉴了前辈AngularJS的方法——**脏检查！**
什么是脏检查？**就是遍历整个组件找到变化的节点**。但是问题依旧存在，我怎么知道当前组件存在变更呢？AngularJs采用的方式是在setController和绑定ng-事件的时候促发脏检查，必要的时候手动促发脏检查。
这样会出现循环脏检查的情况，而Angular借鉴了React单项数据流的概念，使得变更检测只能自顶向下执行一次，避免手动促发脏检查。

![](https://pic1.zhimg.com/80/v2-37035cc91267adc933e543d343dd9ce3_hd.jpg)

那么问题来了，如何保证所有变更项都会被检测到呢？
##### 大杀器Zone！
新的角度思考，能够引发Dom变更的情况有哪些？不外乎就是Dom事件，ajax，setTimeout等，**Angular借鉴Linux的线程本地存储机制，暴力代理所有可能引发变更的操作**：angular/zone.js，再利用Rxjs的响应式，一旦触发操作，即执行脏检查。
当然，为了提高脏检查性能，Angular还能调整检查策略：
![](https://pic2.zhimg.com/80/v2-b5dbf89da624a747d0ff4f1572051e30_hd.jpg)

Default模式下的脏检查

![](https://pic3.zhimg.com/80/v2-f110935081af22f3e284a45921a27c53_hd.jpg)

onPush模式下的脏检查
onPush模式下一旦某个节点没有变更，则不检查其子节点。

好了，一切水到渠成 —— **Zone代理所有可能引发变更的操作，引发脏检查，定位到了变更之后使用render2更新模板**。
**setState消失了，你在进行编程的时候就只用关注当前组件的数据，至于模板展示，则完全不在你的考虑范围内**。

优雅么？等等，循环的复杂度是很难控制的，一旦使用了脏检查，会不会出现AngularJs的卡顿情况呢？
首先考虑使用场景，*大部分节点的属性绑定都不会超过10个*（毕竟你只会操作class，style，节点属性和text），那么当节点属性少于10个的时候，放弃循环检测：

https://github.com/angular/angular/blob/master/packages/core/src/view/element.ts

```typescript
export function checkAndUpdateElementInline(
    view: ViewData, def: NodeDef, v0: any, v1: any, v2: any, v3: any, v4: any, v5: any, v6: any,
    v7: any, v8: any, v9: any): boolean {
  const bindLen = def.bindings.length;
  let changed = false;
  if (bindLen > 0 && checkAndUpdateElementValue(view, def, 0, v0)) changed = true;
  if (bindLen > 1 && checkAndUpdateElementValue(view, def, 1, v1)) changed = true;
  if (bindLen > 2 && checkAndUpdateElementValue(view, def, 2, v2)) changed = true;
  if (bindLen > 3 && checkAndUpdateElementValue(view, def, 3, v3)) changed = true;
  if (bindLen > 4 && checkAndUpdateElementValue(view, def, 4, v4)) changed = true;
  if (bindLen > 5 && checkAndUpdateElementValue(view, def, 5, v5)) changed = true;
  if (bindLen > 6 && checkAndUpdateElementValue(view, def, 6, v6)) changed = true;
  if (bindLen > 7 && checkAndUpdateElementValue(view, def, 7, v7)) changed = true;
  if (bindLen > 8 && checkAndUpdateElementValue(view, def, 8, v8)) changed = true;
  if (bindLen > 9 && checkAndUpdateElementValue(view, def, 9, v9)) changed = true;
  return changed;
}
```
而在多于10个的情况下采用循环：
```typescript
function checkNoChangesNodeDynamic(view: ViewData, nodeDef: NodeDef, values: any[]): void {
  for (let i = 0; i < values.length; i++) {
    checkBindingNoChanges(view, nodeDef, i, values[i]);
  }
}
```
另外一个优化方向，便是 **webworker！**
**于是，你便得到了性能差不多的（要是遇上不可控的菜鸟，React就会出现性能灾难），设计上更为优雅的Angular**。
Vue便采用了Angular中Dom渲染中解析的那一部分，但是尤大神认为脏检查会增大性能开销，因此采用set，get的proxy模式手动促发变更。
**你是采用 React 的完全手动处理变更？还是采用 Vue 的手动促发变更？抑或是Angular的完全不用考虑变更呢？**
**当你项目复杂到一定程度时，你就知道哪一种更好了~**

### 2.状态管理这么更新会抓狂的？

我们都知道React在进行跨组件传递数据的时候，会采用状态管理机（例如redux），Vue也使用了Vuex的状态管理机制，结合上一节中的Vue响应式模型，也能很优雅地管理状态。
但是问题来了，首先，由于React没有响应式机制，导致一次状态管理的变更简直碎片化地令人抓狂：示例：[Todo List · GitBook](https://link.zhihu.com/?target=http%3A//www.redux.org.cn/docs/basics/ExampleTodoList.html)。这些难道不让人感到痛苦么？
Vue有相应的响应式机制，但是真正在写的时候，一旦项目规模变大，相信很多人都写出过 this.$http://store.xxx.xxx.xxx.xxx的代码，你在每一个”.“的位置都会翻来覆去地查看定义。

而Angular呢？Rxjs和DI才是最终解决方案。
举例说明，假设我有一个需求：需要在用户输入的时候动态搜索，并将搜索结果显示在搜索框下方。使用Vue的时候我们这么做：

```typescript
// computed中处理变更
computed{
    test(){
        return this.$store.search.result
    }
}

// 输入框触发变更
onChange(value){
    this.$store.dispatch('searchFromRemote',value)
} 

// 在action中定义变更
actions:{
    async searchFromRemote(ctx,value){
        const result = await axios.get('xxxxxx',{value:value})
        ctx.commit('changeSearchResult',result)
    }
}

// commit中修改值...
```

这还是用了async await的情况，还没有考虑catch，并且由于debounce的移除，导致用户每敲一次键盘，就需要向后端请求一次，还必须配合lodash等函数库才能实现延时请求的功能。
在这种情况下，还需要你在超过3处区域切换编程上下文。
接下来，**见证响应式编程的威力**:

```typescript
// 直接定义
searchFromRemote(value){
    this.searchResult$ = this.input$.pipe(
      debounce(100),
      switchMap(res=>
        this.http.get('xxxxx',{value:res.value})
      ),
      catch(err=>{
        this.handleError(err)
      })
  )
}

// 直接模板处
<test>result {{searchResult$ | async}}</test>
```

**集成错误处理，集成浏览器并发，一个函数搞定！**
接下来我们再修改一下需求，延时处理请求，并且先请求服务器A，如果服务器A没有结果，再请求服务器B，并且在用户按下ctrl+z组合键时请求服务器C。
还是一个函数：

```typescript
searchFromRemote(value){
    this.searchResult$ = this.input$.pipe(
      combineLatest(this.inputKey$.pipe(pairwise()),(inputRes,inputKeyRes)=>{
        if(inputKeyRes[1][0]===17 && inputKeyRes[1][1]===90){
          return {input:inputRes,type:'c'}
        }else{
          return {input:inputRes,type:'a'}
        }
      }),
      debounce(100),
      switchMap(res=>
        if(res.type==='c'){
          return this.http.get('serverc',{value:res.input.value})
        }else{
          return this.http.get('servera',{value:res.input.value}).pipe(switchMap(res=>{
            if(res.data===undefined){
              return this.http.get('serverb',{value:res.input.value})
            }else{
              return res
            }
          }))
        }
      ),
      catch(err=>{
        this.handleError(err)
      })
  )
}
```
而如果还采用之前的方式，怕是要停下来骂产品经理了。
严格来说状态管理这个说法并不适合Angular，**只有当你操作的时静态的数据时，状态才需要被管理**。但是Angular操作的全是动态的数据，我只用定义我的数据从生成到显示会做何种变换，为什么要在意他被存储在哪里？
适应Rxjs的思维非常高效，比如我要处理用户的输入，我只需要思考：**输入流——>何种方式变换（与其它流交互或是自己改变)**
而采用flux或者redux模式，我们需要定义有哪些数据，哪些操作会引起怎样的改变，还需要兼顾纯函数等语法细节，**编程实现不应该只关注数据么？**
相信接触过HDFS管理的同学很容易接受这种流式的数据处理，**高度抽象往往会带来更高的编程效率和更易维护的代码**。
并且当你搭配使用Redux和mobx的时候，得到的不就是一个只有少数几个运算符的低配版Rx么？为什么不一步到位呢？

### 3.你真的需要TypeScript！

**动态类型一时爽，代码重构火葬场** 的观念我就不多说了。Js的函数式特性的确强大，但是你的工作是繁复的前端编程，不是民兵导弹的制导系统。你的工作还需要面临CodeReview，需要面临人事的调动，需要进行分工合作，甚至需要构造可重用的工程化组件。
你不能一天花10个小时时间用以阅读他人或自己过去的JS代码，然后每天工作14个小时，程序员不是应该只想每天工作4小时然后年薪百万么？
现在就使用TypeScript，告别恶心的代码重构，让自己的编程真正能够面向对象吧。
有了TypeScript，即便是新手，代码也是这样的：
![](https://pic2.zhimg.com/80/v2-fe728e3ab1b479e66c7efc3bdf5ac77b_hd.jpg)

当然，高手的代码会是这样：
![](https://pic4.zhimg.com/80/v2-38fcd1955081cd76a25fa7b1ee9c6507_hd.jpg)

但是不使用TypeScript，管你是谁，代码看起来只能像这样：
![](https://pic1.zhimg.com/80/v2-d81ca3e8d5ec1e5fd0c25914c200bd3f_hd.jpg)

当然你说你是ramda高手，写出来的代码没有一个大括号，当我没说。

### 4.约定既是框架！

一千个人有一千种React代码风格，但是Angular的代码风格只有一种。你会发现Angular的每一处都是最佳实践，设计模式的运用是基于Google多年的Java编程经验的，响应式的应用也是基于微软对于操作系统中异步处理的经验总结。
无数的编程概念都有其历史厚重感，而Angular将他们汇聚到了一起。windows中的linq‘时间上的数组’，spring中的依赖注入，处理HDFS的MR，到linux线程本地存储，再到前端界的MVVM，MVC。
**当你站在巨人的肩膀上，完全适应了Angular的编程范式，你才会养成对于优秀实现的不懈追求，并且这些习惯都是有益的**。
比如我现在借助TypeScript和Rxjs在开发cocos creator项目的时候速度很快，从来没有想到过游戏开发的体验能够如此愉悦。
你能通过学习Angular一览所有前端编程主题，而不用纠结于一些基础概念，记太多名词也是负担，不是么？
并且，当你能熟练使用Angular的时候，React的灵活性，Vue的小而美才能真正被你所利用。
   不了解外语的人也不会理解自己的母语——歌德
Angular相对于React和Vue来说是新事物，对于新事物我们要保持开放的心态，积极去尝试使用Angular，发现他的闪光点，而不是一味地保守，在没有使用过他的情况下就盲目否定。
不过意识到Angular的强大也不代表你可以否定React的一切，就如上文所说，Angular是一个框架而React和Vue不是，脏检查也是十分损耗性能的。
但是Angular能从大局观上给你带来很彻底的改变。你只有彻底搞懂了Angular，才能明白React setState的设计思路。当业务复杂化时你能毫不犹豫地选择Rxjs。你才能将React或者Vue和相应的库结合起来，组成自己的"Angular"。
