---
date: 2018-10-22
title: Angular 7 发布
categories: angular
---
Angular 7 发布
<!-- more -->

# Angular 7 - CLI 提示，虚拟卷绕，拖拽以及其它

Angular 7.0.0 已经发布了！这是跨越整个平台的主要发布，包括核心框架、Angular Material 和同步版本号的 CLI。该发布包含用于工具链的心功能，支持伙伴运行。



## 如何升级到版本 7

请访问 [update.angular.io](https://update.angular.io/) 获取升级您的应用的详细信息和指导，但是，感谢我们在版本 6 中的工作，对于大多数开发者来说，升级到版本 7 只需要一个命令：

> ng update @angular/cli @angular/core

版本 7 的早期使用者报告说，该升级比以往更快，许多应用只需要少于 10 分钟的时间进行升级。

## CLI 提示

在运行像 ng new 或者 ng add @angular/material 命令的时候，CLI 将会提示用户，以帮助你发现类似路由或者 SCSS 支持之类的内置功能。

CLI 提示已经被添加到了 [Schematics](https://blog.angular.io/schematics-an-introduction-dc1dfbc2a2b2) 中，所以，任何发布了 Schematics 的包都可以通过添加 `x-prompt` 键到 Schematics 集合中从中获得好处。

```javascript
"routing": {
  "type": "boolean",
  "description": "Generates a routing module.",
  "default": false,
  "x-prompt": "Would you like to add Angular routing?"
},
```

## 应用程序性能

持续我们对性能的关注，我们分析了整个生态的常见错误。我们发现许多开发者在产品中包含了 `reflect-metadata` 包，它仅仅在开发中才需要。

为了处理该问题，作为版本 7 升级的一部分，将会自动从你的 `polyfills.ts` 中删除它，在 JIT 模式构建应用的时候会作为其中一步包含，默认会从产品构建中删除该 `polyfile`。

对于版本 7，我们还对 CLI 中的新项目获得打包的好处。在初始包大于 2M 的时候，新的应用将会警告，如果是 5M 则会报错。这些限额可以在 `angular.json` 中很容易修改。

```javascript
"budgets": [{
  "type": "initial",
  "maximumWarning": "2mb",
  "maximumError": "5mb"
}]
```

这些限额可以获益于 Chrome 的 [Data Saver](https://support.google.com/chrome/answer/2392284) 特性并显示给用户。

## Angular Material & the CDK

Material Design 在 2018 年获得一个大的升级。Angular Material 用户升级到版本 7 会与 material Design 规范有些小的变化。

新加入到 CDK 中，你可以通过导入 `DragDropModule` 或者 `ScrollingModule` 对虚拟卷绕和拖拽获益。

### 虚拟卷绕

虚拟卷绕从可视部分列表中 DOM 中加载和卸载元素，使得可以对于非常大的可卷绕列表构建非常快速的用户体验。

```html
<cdk-virtual-scroll-viewport itemSize="50" class="example-viewport">
  <div *cdkVirtualFor="let item of items" class="example-item">{{item}}</div>
</cdk-virtual-scroll-viewport>
```

[更多关于虚拟卷绕的信息](https://material.angular.io/cdk/scrolling/overview)

### 拖拽

CDK 已经支持了拖拽，包含自动在用户移动项目时的渲染，记录列表的方法 (`moveItemInArray`)，以及在列表中传输项目 (`transferArrayItem`)。

```html
<div cdkDropList class="list" (cdkDropListDropped)="drop($event)">
  <div class="box" *ngFor="let movie of movies" cdkDrag>{{movie}}</div>
</div>
```

代码：

```javascript
  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.movies, event.previousIndex, event.currentIndex);
  }
```

[更多关于拖拽信息](https://material.angular.io/cdk/drag-drop/overview)

## 选择的改进

通过在 `mat-form-field`  中本地的 `select` 元素改进应用程序的访问性。本地的 select 拥有性能、可访问性和使用性的优势，但是，我们仍然保留 `mat-select` 给予展示的完全控制。

[关于 `mat-select` 和 `mat-form-field` 的更多信息](https://material.angular.io/components/select/overview)

## Angular Elements

Angular Elements 现在支持使用对于自定义元素的 Web 标准进行内容投影。

```html
<my-custom-element>This content can be projected!</my-custom-element>
```

## Partner Lunches

Angular在社区中取得了巨大的成功，为此我们一直致力于与最近推出的几个社区项目合作。

* [Angular Console](https://angularconsole.com/) — A downloadable console for starting and running Angular projects on your local machine
* [@angular/fire](https://github.com/angular/angularfire2) — AngularFire has a new home on npm, and has its first stable release for Angular
* [NativeScript](https://docs.nativescript.org/code-sharing/intro) — It’s now possible to have a single project that builds for both web and installed mobile with NativeScript
* [StackBlitz](https://stackblitz.com/fork/angular) — StackBlitz 2.0 has been released and now includes the Angular Language Service, and more features like tabbed editing

## 文档更新

我们一直努力改进我们的指南和引用材料。在 angular.io 的文档现在包含 [reference material for the Angular CLI](https://angular.io/cli)。

## 依赖的升级

我们已经升级了对于第三方项目的依赖。

* [TypeScript 3.1](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-1.html)
* [RxJS 6.3](https://github.com/ReactiveX/rxjs/blob/master/CHANGELOG.md#630-2018-08-30)
* [Node 10](https://nodejs.org/en/blog/release/v10.0.0/) — We’ve added support for Node 10, and we still support 8

## Ivy 呢？

[我们在继续工作于 Ivy](https://youtu.be/dIxknqPOWms?t=1360) - 我们下一代的渲染管线。Ivy 当前处于开发中，并不是版本 7 发布的一部分。我们已经开始验证对于现有应用程序的后向兼容性，将会作为一个可选的 Ivy 预览尽快在随后数月内完成。
