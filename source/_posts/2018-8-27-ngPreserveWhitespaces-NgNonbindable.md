---
title: ngPreserveWhitespaces和NgNonBindable        
date: 2018-08-27
categories: angular
---
在 Angular 中，我们可能需要精确控制空格的使用，以及希望使用不绑定的 { { } } 的字符串。
这两个指令可以帮助我们方便地进行格式化。
<!-- more -->

我把这两条指令放在一起来讲，因为在实际应用中，当需要对内容进行格式化时，这两条指令往往都会被用到。   
在 Angular 5 中，angularCompilerOptions 里加入了 preserveWhitespaces 选项。如果该选项被设置为 false，编译器会移除所有不必要的空格。这对代码格式会有一些小小的影响，但却可以帮助我们缩小包的大小。   
但是，有时候我们也希望完整地保留空格。如果希望整个组件保留其空格，只需要在组件装饰器中使用如下选项：   

```typescript
@Component({
    selector: 'app',
    templateUrl: './app.component.html',
    preserveWhitespace: true
})
```

有时，我们可能只需要在某个特定的 DOM 元素中保留空格。这时，我们可以使用 ngPreserveWhitespaces 指令，如下所示：
```html
<div ngPreserveWhitespaces>
    <!-- All whitespace here will be preserved -->
</div>
```
另外，我们有时可能需要在文档中使用 { { } }，但 Angular 会把这一符号看作插值，并会计算括号中内容的值。这时，可以将 ngNonBindable 指令插入父元素中，让 Angular 忽略其中的括号。示例用法如下：   
```html
<span ngNonBindable>{ { this will not be evaluated } }</span>
```
