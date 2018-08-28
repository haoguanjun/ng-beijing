---
title: 分析变更检测代价     
date: 2018-08-27
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
[enableDebugTools 函数的定义](https://github.com/angular/angular/blob/cf0968f98e844043a0f6c2548201f3c0dfd329a7/packages/platform-browser/src/browser/tools/tools.ts), 该函数需要传入系统中任意一个 Component 的类型。

```javascript
/**
 * Enabled Angular debug tools that are accessible via your browser's
 * developer console.
 *
 * Usage:
 *
 * 1. Open developer console (e.g. in Chrome Ctrl + Shift + j)
 * 1. Type `ng.` (usually the console will show auto-complete suggestion)
 * 1. Try the change detection profiler `ng.profiler.timeChangeDetection()`
 *    then hit Enter.
 */
export function enableDebugTools<T>(ref: ComponentRef<T>): ComponentRef<T> {
  exportNgVar(PROFILER_GLOBAL_NAME, new AngularProfiler(ref));
  return ref;
}

export function disableDebugTools(): void {
  exportNgVar(PROFILER_GLOBAL_NAME, null);
}
```
在 AngularProfiler 的构造函数中，使用它来获取应用的 ApplicationRef。
[AngularProfiler 源码](https://github.com/angular/angular/blob/cf0968f98e844043a0f6c2548201f3c0dfd329a7/packages/platform-browser/src/browser/tools/common_tools.ts)
```javascript
export class AngularProfiler {
  appRef: ApplicationRef;

  constructor(ref: ComponentRef<any>) { this.appRef = ref.injector.get(ApplicationRef); }
```

若要开始进行分析，只需在 DevTools 控制台上运行如下代码：
```javascript
ng.profiler.timeChangeDetection();
```
该方法将会调用 ApplicationRef 的 tick() 方法，触发变更检测。该检测将会执行多次，取平均值。
```javascript
while (numTicks < 5 || (getDOM().performanceNow() - start) < 500) {
      this.appRef.tick();
      numTicks++;
    }
```
该方法还可以传递一个参数，以记录 CPU 的检测。
```javascript
ng.profiler.timeChangeDetection({record: true})
```

![](https://angularfirebase.com/images/change-profile.gif)

