---
title: ng-bootstrap 组件集中 tabset 组件的实现分析
date: 2019-07-30
categories: angular
---
本文介绍了 ng-bootstrap 项目中，tabset 的实现分析。
<!-- more -->

### 使用方式

`<ngb-tabset>` 作为容器元素，其中的每个页签以一个 `<ngb-tab>` 元素定义，在 `<ngb-tabset>` 中包含若干个 `<ngb-tab>` 子元素。

在 `<ngb-tab>` 元素中，使用 `<ng-template>` 模板来定义内容，内容分为两种：标题和内容。

标题使用 `[ngbTabTitle]` 指令来声明，或者在 `<ngb-tab>` 元素上使用 `title` 属性声明。

内容使用 `[ngbTabContent]` 指令声明。

```html
<ngb-tabset>
  <ngb-tab title="Simple">
    <ng-template ngbTabContent>
      <p>Raw denim you probably haven't heard of them jean shorts Austin. Nesciunt tofu stumptown aliqua, retro synth
      master cleanse. Mustache cliche tempor, williamsburg carles vegan helvetica. Reprehenderit butcher retro keffiyeh
      dreamcatcher synth. Cosby sweater eu banh mi, qui irure terry richardson ex squid. Aliquip placeat salvia cillum
      iphone. Seitan aliquip quis cardigan american apparel, butcher voluptate nisi qui.</p>
    </ng-template>
  </ngb-tab>
  <ngb-tab>
    <ng-template ngbTabTitle><b>Fancy</b> title</ng-template>
    <ng-template ngbTabContent>Food truck fixie locavore, accusamus mcsweeney's marfa nulla single-origin coffee squid.
      <p>Exercitation +1 labore velit, blog sartorial PBR leggings next level wes anderson artisan four loko farm-to-table
      craft beer twee. Qui photo booth letterpress, commodo enim craft beer mlkshk aliquip jean shorts ullamco ad vinyl
      cillum PBR. Homo nostrud organic, assumenda labore aesthetic magna delectus mollit. Keytar helvetica VHS salvia
      yr, vero magna velit sapiente labore stumptown. Vegan fanny pack odio cillum wes anderson 8-bit, sustainable jean
      shorts beard ut DIY ethical culpa terry richardson biodiesel. Art party scenester stumptown, tumblr butcher vero
      sint qui sapiente accusamus tattooed echo park.</p>
    </ng-template>
  </ngb-tab>
  <ngb-tab title="Disabled" [disabled]="true">
    <ng-template ngbTabContent>
      <p>Sed commodo, leo at suscipit dictum, quam est porttitor sapien, eget sodales nibh elit id diam. Nulla facilisi. Donec egestas ligula vitae odio interdum aliquet. Duis lectus turpis, luctus eget tincidunt eu, congue et odio. Duis pharetra et nisl at faucibus. Quisque luctus pulvinar arcu, et molestie lectus ultrices et. Sed diam urna, egestas ut ipsum vel, volutpat volutpat neque. Praesent fringilla tortor arcu. Vivamus faucibus nisl enim, nec tristique ipsum euismod facilisis. Morbi ut bibendum est, eu tincidunt odio. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Mauris aliquet odio ac lorem aliquet ultricies in eget neque. Phasellus nec tortor vel tellus pulvinar feugiat.</p>
    </ng-template>
  </ngb-tab>
</ngb-tabset>
```

可以看到，外层元素是 `<ngb-tabset>`。

每个 tab 使用元素 `<ngb-tab>` 定义，tab 的内容使用 `<ng-template>` 模板定义， tab 中的内容分为两个部分：标题和内容。

下面是使用模板的标题

```html
<ng-template ngbTabTitle><b>Fancy</b> title</ng-template>
```


标题也可以在 ngb-tab 上使用 [title] 属性定义。例如：

```html
<ngb-tab title="Disabled" [disabled]="true">
```

内容部分定义，这里使用了指令 [ngbTabContent] 便于识别。

```html
<ng-template ngbTabContent>
    <p>Sed commodo, leo at suscipit dictum, quam est porttitor sapien, eget sodales nibh elit id diam. 
    </p>
</ng-template>
```

### TabSet 组件定义

从前面的使用可以看出，所有 tab 的定义都是 `<ngb-tabset>` 元素的内容，它们在使用时定义，而不是在 `<ngb-tabset>` 组件自己的模板中定义。

所以找到它们需要使用 `ContentChildren` 来找到。

```typescript
@ContentChildren(NgbTab) tabs: QueryList<NgbTab>;
```

在 bootstrap 中，每个页签 实际上渲染成两个部分，一个标题的列表，和当前显示的内容。

标题列表使用 `<ul>` 元素来处理。其中使用循环来将所有的标题显示出来。

而 `titleTpl` 是由模板定义的，所以，使用了 `[ngTemplateOutlet]` 来渲染出来。

```html
<ul [class]="'nav nav-' + type + (orientation == 'horizontal'?  ' ' + justifyClass : ' flex-column')" role="tablist">
    <li class="nav-item" *ngFor="let tab of tabs">
        <a [id]="tab.id" class="nav-link" 
           [class.active]="tab.id === activeId" 
           [class.disabled]="tab.disabled"
           href (click)="select(tab.id); $event.preventDefault()" 
           role="tab" 
           [attr.tabindex]="(tab.disabled ? '-1': undefined)"
           [attr.aria-controls]="(!destroyOnHide || tab.id === activeId ? tab.id + '-panel' : null)"
          [attr.aria-selected]="tab.id === activeId" [attr.aria-disabled]="tab.disabled">
          {{tab.title}}<ng-template [ngTemplateOutlet]="tab.titleTpl?.templateRef"></ng-template>
        </a>
    </li>
</ul>
```

title 部分并列使用了两种来源

```html
{{tab.title}}<ng-template [ngTemplateOutlet]="tab.titleTpl?.templateRef"></ng-template>
```

内容部分，由于具体内容也是使用模板定义出来，所以这里也是使用 `[ngTemplateOutlet]` 渲染出来。

```html
<div class="tab-content">
    <ng-template ngFor let-tab [ngForOf]="tabs">
        <div
          class="tab-pane {{tab.id === activeId ? 'active' : null}}"
          *ngIf="!destroyOnHide || tab.id === activeId"
          role="tabpanel"
          [attr.aria-labelledby]="tab.id" id="{{tab.id}}-panel">
          <ng-template [ngTemplateOutlet]="tab.contentTpl?.templateRef"></ng-template>
        </div>
    </ng-template>
</div>
```

由于内容是通过投影来完成的，投影内容需要在 Content 类型的事件中处理。

```typescript
ngAfterContentChecked() {
    // auto-correct activeId that might have been set incorrectly as input
    let activeTab = this._getTabById(this.activeId);
    this.activeId = 
        activeTab ? activeTab.id : (this.tabs.length ? this.tabs.first.id : null);
}
```



### 两个指令定义

指令的定义非常简单，就是获取模板的引用，以便后继使用。

可以看到属性名称为 templateRef

```typescript
@Directive({selector: 'ng-template[ngbTabTitle]'})
export class NgbTabTitle {
  constructor(public templateRef: TemplateRef<any>) {}
}
```


这是 [ngbTabContent] 的定义，与上面相同，依然是定义了属性 templateRef。

```typescript
@Directive({selector: 'ng-template[ngbTabContent]'})
export class NgbTabContent {
  constructor(public templateRef: TemplateRef<any>) {}
}


```

### Tab 定义

元素型的指令，所以连模板都没有了。

```typescript
@Directive({selector: 'ngb-tab'})
```


内容是投影进来的。

由于在 tab 中使用了模板，并且使用指令来标识出来，它们定义在组件的模板之内，所以这里使用了 ContentChildren 来识别。

```typescript
@ContentChildren(NgbTabTitle, {descendants: false}) titleTpls: QueryList<NgbTabTitle>;
@ContentChildren(NgbTabContent, {descendants: false}) contentTpls: QueryList<NgbTabContent>
```

不使用 `ContentChild` 的原因是它没有提供 descendants 的支持。


以后就可以使用 titleTpls 和 contentTpls 来使用模板了。

由于是内容，需要在 content 的事件中处理，实际上，在每个页签中，我们只有一个标题和一个内容的声明。

```typescript
ngAfterContentChecked() {
    // We are using @ContentChildren instead of @ContentChild as in the Angular version being used
    // only @ContentChildren allows us to specify the {descendants: false} option.
    // Without {descendants: false} we are hitting bugs described in:
    // https://github.com/ng-bootstrap/ng-bootstrap/issues/2240
    this.titleTpl = this.titleTpls.first;
    this.contentTpl = this.contentTpls.first;
}
```


### See also

* [tabset](https://github.com/ng-bootstrap/ng-bootstrap/blob/master/src/tabset/tabset.ts)
