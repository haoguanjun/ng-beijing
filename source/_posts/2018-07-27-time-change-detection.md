---   
title: 分析变更检测代价     
date: 2018-07-27
categories: angular
---
通过调用这个函数，我们在 window.ng 对象上会获得一个额外的工具，叫做 profiler。profiler 中有一个函数叫做 timeChangeDetection。当这个函数被调用时，会在控制台打印出变更检测的周期和每个周期的运行时间。
<!-- more -->

我想大家一定都知道，在所有 Angular CLI 项目中，main.ts 文件都会调用 enableProdMode 函数。其实，该文件还可以调用 enableDebugMode 函数。你可能会想，如果代码不在生产模式下运行，一定是在调试模式下运行，但事实并非如此（至少在调用本函数时不是这样的）。   
通过调用这个函数，我们在 window.ng 对象上会获得一个额外的工具，叫做 profiler。profiler 中有一个函数叫做 timeChangeDetection。当这个函数被调用时，会在控制台打印出变更检测的周期和每个周期的运行时间。   
当需要分析性能较差的应用时，这个函数尤其有用。要调用这一函数，只需在引导代码中添加如下片段：   
```javascript
platformBrowserDynamic().bootstrapModule(AppModule).then(ref => {
  const applicationRef = ref.injector.get(ApplicationRef);
  const appComponent = applicationRef.components[0];
  enableDebugTools(appComponent);
});
```

若要开始进行分析，只需在 DevTools 控制台上运行如下代码：
```javascript
ng.profiler.timeChangeDetection();
```
