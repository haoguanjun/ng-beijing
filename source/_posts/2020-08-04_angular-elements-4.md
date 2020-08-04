---
title: Angular Elements：Part IV：在 Angular Elements(>=7) 上使用内容投影     
date: 2020-08-04
categories: angular
---
本文介绍如何使用 Shadow DOM v1 和 `slots`。为了演示起见，这里使用一个组件来展示一张图。<!-- more -->

# Angular Elements: Part IV: 在 Angular Elements(>=7) 上使用内容投影



> 特别感谢 Rob Wormald，Angular 团队中 Angular Elements 的主要

从 Angular 7 开始，我们可以使用 `slots` 来投影标记到组件的模版中。这些 slots 由 Shadow DOM v1 引入，Angular 从 6.1 开始支持。

本文介绍如何使用 Shadow DOM v1 和 `slots`。为了演示起见，这里使用一个组件来展示一张图。



这里底部的 title，description 还有 legend 使用 `slots` 的内容投影。你可以在[这里找到放在 Github 上的源码](https://github.com/manfredsteyer/angular-elements-dashboard/tree/ng7)。在 ng7 的 分支中。

### Shadow DOM v1

Shadow DOM 总是 Angualr Component 概念的核心。默认情况下，Angular 仿真该标准，它用来隔离组件e样式，该思想是一个组件的本地样式不应该影响其它组件。

可以将它关闭，告诉 Angular 依赖于浏览器的实现，这样比仿真模式提供更好的隔离性。

但是，在 Angular 6.0 之前，Angular 支持的标准是 Shadow DOM v0。但是，浏览器的供应商广泛实现的是 v1 版本。在本文编写的时候，Chrome，Safari，FireFox 和 Opera 已经支持它，而 Edge 团队正在实现它。

在 Angular (>=6.1) 版本中使用 Shadow DOM v1，只需要将 `Component` 的 `encapsulation` 属性设置为 `ShadowDom`

```typescript
@Component({
  selector: 'app-dashboard-tile',
  templateUrl: './dashboard-tile.component.html',
  encapsulation: ViewEncapsulation.ShadowDom
})
export class DashboardTileComponent implements OnInit {
  @Input() a: number;
  @Input() b: number;
  @Input() c: number;
  […]
} 
```

不用困惑于 `ViewEncapsulation.ShadowDom` 和 `ViewEncapsulation.Native`。`Native` 从一开始就存在于 Angualr ，它表示 Shadow DOM v0。

 ### Slots for 内容投影

许多 Web Componets，更精确一点，许多 Custom Elements，需要适配将作为元素内容传递的适配性。这也被称为内容投影，因为传递的内容被投影到元素模版的不同位置。

对于这种情况，Shadow DOM v1 引入了 `slot` 元素，每个 `slot` 标记模版中的一个可以被投影到的位置，

```html
<div class="card">
  <div class="header">
    <h1 class="title"><slot name="title">Standardwert</slot></h1>
  </div>
  <div class="content">

    <div style="height:200px">
      <ngx-charts-pie-chart [labels]="true" [results]="data">
      </ngx-charts-pie-chart>
    </div>

    <p><slot>Standardwert</slot></p>
    <i><slot name="legend">Standardwert</slot></i>

  </div>
</div>
```

在 `slot` 的开始和结束标记之间，我们可以放置一些默认的标记，如果调用者没有传递内容话，可以显示出来。可以有一个默认的 `slot` 和一个命名的。

当调用 Custom Elements 的时候，我们可以使用 `slot` 属性来指出模版组件中命名的点。

```html
<div class="col-sm-3">
  <dashboard-tile a="10" b="5" c="15">

    <span slot="title">Important Stuff</span>
    <span slot="legend">A, B and C show the values of A, B and C.</span>
    Only believe in statistics you've faked yourself.

  </dashboard-tile>
</div>
```

任何使用这种方式的内容，都将被投影到它。剩下的放入默认的 slot 中。

### 访问投影内容

为了访问投影内容，Angular 提供了接口，例如：`ngAfterContentChecked` 或者 `ngAfterContentInit` 。同样，投影查询使用 `@ViewChild` 和 `@ViewChildren`。

不出意外的是，它们对于 slots 并不工作。但是我们可以使用 `slotschange` 事件来代替。

```html
<i><slot (slotchange)="slotChange($event)" name="legend">No Legend available.</slot></i>
```

在事件处理器中，我们可以获取投影的元素

```typescript
@Component({
  [...]
  encapsulation: ViewEncapsulation.ShadowDom
})
export class DashboardTileComponent implements OnInit {

  slotChange($event) {
    const assigned = $event.target.assignedNodes();
    if (assigned.length > 0) {
      console.debug('shotchange', assigned[0]);
    }
  }

}
```







### Reference

* https://www.angulararchitects.io/aktuelles/content-projection-with-slots-in-angular-elements-7/
* 
