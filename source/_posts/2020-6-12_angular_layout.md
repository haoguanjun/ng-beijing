---
title: Angular Flex Layout
date: 2020-06-12
caterigies: angular
tages: [angular]
---
本文说明了如何在 Angular 中如何使用 Angular Layout。
<!-- more -->



# Angular Flex Layout

### 1. GitHub 地址

https://github.com/angular/flex-layout

### 2. 安装

使用 npm 安装

```bash
npm i -s @angular/flex-layout @angular/cdk
```

使用 yarn 安装

```bash
$ yarn add @angular/flex-layout
```

将 Angular Layout 导入应用

```typescript
import { FlexLayoutModule } from '@angular/flex-layout';
...

@NgModule({
    ...
    imports: [ FlexLayoutModule ],
    ...
});
```

然后就可以使用 Angular Layout 了。

### 3. Angular Layout 简介

Angular Layout 提供了一种优雅的方式来使用 Flexbox、CSS Grid 和媒体查询。该模块通过使用定制的 Layout API、媒体查询发现、注入的 DOM flexbox-2016 和 CSS Grid 样式，提供给 Angular 开发者组建布局特性。

布局引擎智能自动处理应用适当的 CSS 到浏览器视图层级的处理。该自动处理同时处理多钟复杂的通常遇到的多种变通方式，手动处理，Flexbox CSS 的纯 CSS 应用程序。

![](https://cloud.githubusercontent.com/assets/210413/20034148/49a4fb62-a382-11e6-9822-42b90dec69be.jpg)

![image-20200611093030176](/Users/whao/Library/Application Support/typora-user-images/image-20200611093030176.png)

Angular Layout 是纯 TypeScript 引擎，与纯 CSS 实现发布的其它 Flexbox 引擎，和使用 JS + CSS 实现的 AngularJS Material Layout 不同。

* Angular Layout 实现独立于 Angular Material (v1 或者 v2)
* 当前的实现仅仅适用于 Angular v4.1 及以上版本

### 4. Static API (指令) 概览 

首先，我们浏览一下需要注意的基本 API。这些 API 也被称为静态 API。我会尽量使用简单的方式进行说明。

我们把这些 API 基于使用的位置和如何使用，分为 3 类：

1. 第一类是用于容器的 API，例如 <div> 
2. 第二类用于容器中的元素，来自第一类容器内部的 HTML 元素。
3. 第三类既可以用于容器，也可以用于容器中的子元素。

> Angular Flex Layout API  通过 Angular 指令的方式使用

#### 4.1  容器元素

##### 4.1.1  fxLayout

该指令首先定义了一个容器，其次，决定包含在容器中的子元素之间的布局关系。它可以赋予 5 个可能值：

1. `row`，表示所有的子元素都将位于同一行中，而不管是否适合在同一行中。
2. `row wrap`，如果一行中不能容纳，该值则允许容器中元素折行到下一行中。
3. `column`， 表示子元素将位于同一列中。由于列可以无限延长，所以没有对应的 `column wrap`
4. `row-reverse`
5. `column-reverse`

如果没有设置值，默认值为 `row`。

例如：

```html
<div fxLayout="row"></div>
<div fxLayout="row wrap"></div>
<div fxLayout="column"></div>
```

##### 4.1.2  fxLayoutAlign

如其名字所提示的，该指令定义容器中子元素的对齐方式。它可以接受 1 个或者 2 个值，第一个值定义主轴方向的对齐，第二个值定义副轴方向的对齐。对于主轴的可选值为：

1. `start`，默认值
2. `center`
3. `end`
4. `space-around`
5. `space-between`
6. `space-evenly` 

对于副轴的可选值为：

1. `start`
2. `center`
3. `end`
4. `stretch`，默认值

例如：

```html
fxLayoutAlign="center center"
<!--align center bother horizontally and vertically. -->
fxLayoutAlign="center end"
<!-- align center horizontally and bottom vertically. -->
```

> 主轴 (main-axis) 和副轴 (cross-axis) 基于使用的布局而不是固定的横向或者纵向。例如，当使用 `row` 布局的时候，副轴  (cross-axis) 表示垂直方向，而当使用 `column` 布局的时候，它就变成了横向。你可以[在这里找到关于主轴和副轴的更多内容](https://developer.mozilla.org/en-US/docs/Glossary/Cross_Axis)。

##### 4.1.3  fxLayoutGap

该指令定义容器中子元素之间的间隔。定义的值可以是 `px,%, vh,或者 vw`。对于该指令没有太多需要说明的内容。

#### 4.2 容器中的子元素

##### 4.2.1 fxFlex

 该指令允许你设置子元素的宽度，既可以使用百分比，像素或者任何可接受的测量单位。如果你使用了该指令而没有赋值，就是仅仅使用了 `fxFlex` 指令。它将会填满父元素的空间。这意味着，如果你的容器中有两个子元素，第一个子元素的宽度固定为 100px，那么第二个元素将会填满剩余的空间。这也意味着，第二个元素的宽度永远是 100%-100px。元素的顺序完全没有影响。而如果你有多个元素，仅仅使用 `fxFlex` 而不赋值，那么这些元素将是等宽的。这仅仅适用于使用 `row` 或者 ``row wrap` 容器中的元素，而不是使用 `column` 方式的容器。对于 `column` 容器来说，其中子元素的默认宽度是 100%，除非使用该指令重新定义。

> 如果你赋值的时候没有指定单位，默认为百分比单位，所以如果仅仅设置了 70，那么将会转换为 70%。

##### 4.2.2 fxFlexOffset

设置 fxLayout 容器中当前的 HTML 元素与最后元素的偏移量。如果是第一个元素，那么设置父元素边框与开始元素之间的距离。可以接受 `%,px, vh 或者 vw`

##### 4.2.3 fxFill 或者 fxFlexFill

该指令将子元素填满父元素的宽和高。

##### 4.2.4 fxFlexOrder

定义当前子元素在父容器中的位置。仅仅接受表示当前元素在其它元素中位置的整数

##### 4.2.5 fxFlexAlign

该指令覆盖容器元素中 fxLayoutAlign 对齐的设置，需要注意的是，它不影响主轴的对齐，仅仅影响副轴的对齐。

#### 4.3 通用 API (指令)

下面的指令可以用于任何元素，不管是容器还是子元素，或者其它元素。

1. `fxHide` 和 `fxShow` ，它们支持显示或者隐藏容器，以及容器中的子元素。
2. `ngClass` 和 `ngStyles`，它们允许设置样式类，或者样式，它们是 angular 同名指令的扩展。
3. `imgSrc`，该指令是原生的 `src` 属性的扩展，用于设置图片元素的源。

### 关于响应式布局

总起来说，上面介绍的指令帮助你定义元素的行为和外观。这一节中，我们介绍如何组合使用上面介绍的指令来支持响应式布局。Angular Flex Layout 对于响应式定义了一系列预定义的中断点。每个中断点有一个名字，通过别名来定义的最小与最大宽度。它使用了媒体查询来判断当前视口的宽度。

这里是 Angular Flex Layout 定义的可用中断点列表

| breakpoint | Media query                                              |
| ---------- | -------------------------------------------------------- |
| xs         | 'screen and (max-width: 599px)'                          |
| sm         | 'screen and (min-width: 600px) and (max-width: 959px)'   |
| md         | 'screen and (min-width: 960px) and (max-width: 1279px)'  |
| lg         | 'screen and (min-width: 1280px) and (max-width: 1919px)' |
| xl         | 'screen and (min-width: 1920px) and (max-width: 5000px)' |
|            |                                                          |
| lt-sm      | 'screen and (max-width: 599px)'                          |
| lt-md      | 'screen and (max-width: 959px)'                          |
| lt-lg      | 'screen and (max-width: 1279px)'                         |
| lt-xl      | 'screen and (max-width: 1919px)'                         |
|            |                                                          |
| gt-xs      | 'screen and (min-width: 600px)'                          |
| gt-sm      | 'screen and (min-width: 960px)'                          |
| gt-md      | 'screen and (min-width: 1280px)'                         |
| gt-lg      | 'screen and (min-width: 1920px)'                         |

为了使用上述断点，可以组合使用静态 API，使用 `. (Dot) ` 分隔，如下所示。

```html
fxLayout.md="row"
```

或者

```html
fxFlex.lt-lg="100%"
```

或者

```html
ngClass.xs="some-css-class"
```

或者

```html
imgSrc.gt-md="url-to-large-image" imgSrc="url-to-normal-size-image"
imgSrc.xs="url-to-very-small-img"
```

> 注意，上面最后一个示例演示了如何根据屏幕尺寸来选择适当的图片尺寸。它使用 `gt-md` 别名来对比中型尺寸更大的设备选择更大尺寸的图片。`xs` 则对小型设备使用特别小尺寸的图片。对于不符合这两种情况的其它设备，使用没有别名的图片。在这个示例中，img 元素所使用的图片将基于设备的视口而不同。这种方式可以用于任何 Angular Flex Layout 静态布局 API 中，而不限于示例所展示的情况。

如前所述，该方式提供了非常灵活和强大的对响应式布局的支持，允许你基于视口的尺寸改变 Flexbox 布局，样式类，样式，图片的源等。这也对你的组件逻辑带来优势，你可以使用这些指令代替静态值。或者这样就不需要涉及任何 CSS 了。它对于适配式设计提供了机会，一种改进的响应式设计。



### Reference

* [Angular Flex Layout - Introduction & Getting Started](https://codinglatte.com/posts/angular/angular-flex-layout-introduction/)
* [Angular Layout](https://github.com/angular/flex-layout/wiki)
* [Declarative API Overview](https://github.com/angular/flex-layout/wiki/Declarative-API-Overview)
* [Online Demos](https://tburleson-layouts-demos.firebaseapp.com/#/docs)


