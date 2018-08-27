---
title: 认识 Angular 中的 Attribute      
date: 2018-08-27
categories: angular
---
在 Angular 中，很少人知道 @Attribute 装饰器，也很少人用到，它可以为应用带来性能的跃升。   
@Attribute 返回宿主特定属性的值。
<!-- more -->

## 认识 @Attribute 装饰器

在 Angular 中，很少人知道 @Attribute 装饰器，也很少人用到，它可以为应用带来性能的跃升。

@Attribute 返回宿主特定属性的值。

假设我们有一个按钮组件，它的  class 属性接收名为 type 的值，type 的值可以是 _primary_ 或者 _secondary_ 。

```typescripe
export type ButtonType = 'primary' | 'secondary';

@Component({
  selector: 'app-button',
  template: `
    <button [ngClass]="type">
      <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent {
  @Input() type: ButtonType = 'primary';
}
```

由于是静态字符串，我们可以在模板中这样使用，而不需要使用中括号 ( [] ) 。

```html
<app-button type="secondary" (click)="click()">Click</app-button>
```

这种方式有一个缺点，因为我们使用了 Input()，Angular 仍然会为 type 属性创建绑定，并将在任何变更检测周期中检查它。即使这是一个静态字符串。

让我们看看编译后的代码，来深入理解这一点。

![](https://www.cnblogs.com/images/cnblogs_com/haogj/242334/o_angular-attribute.PNG)

如你所见，当我们点击按钮触发变更检测后，Angular 检测这个值。

在这种情况下，我们可以使用 **@Attribute**  更有效地处理这种情况。

```typescript
import { Component, Attribute } from '@angular/core';

export type ButtonType = 'primary' | 'secondary';

@Component({
  selector: 'app-button',
  template: `
    <button [ngClass]="type">
      <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent {
  constructor(@Attribute('type') public type: ButtonType = 'primary') { }
}
```

使用这种方式，Angular 将仅仅计算一次并忘记它。作为一般性的规则，当字符串是固定值且永不变化的时候，我倾向于使用 @Attribute()。

注意在这种情况下，可能进一步删除这个 **ngClass** 而是用 CSS，但是你应该知道这个技巧。

### see also

* [Attribute](https://angular.io/api/core/Attribute)
* [Getting to Know the @Attribute Decorator in Angular](https://netbasal.com/getting-to-know-the-attribute-decorator-in-angular-4f7c9fb61243)
