---
date: 2018-09-26
title: JavaScript运算符：== VS. ===
categories: javascript
---
这篇文章非常简洁明了的解释了 JavaScript 中 == 与 === 的差异以及在不同情况下使用的效果。
<!-- more -->

原文（http://www.w3cplus.com/javascript/which-equals-operator-vs-should-be-used-in-javascript-comparisons.html）
@manxisuo 的《通过一张简单的图，让你彻底地、永久地搞懂JS的==运算》一文中详细的阐述了JavaScript中的==运算符。其实在JavaScript中还有一个另外一个运算符===。那么这两者有何不一样呢？这篇文章就一起来看看JavaScript中==和===有何不同。

## 关系表达式
==和===都是JavaScript中的关系表达式运算符，与对应的还有!=和!==。

==和===运算符主要用于比较两个值是否相等。当然它们对相等的定义不尽相同。两个运算符允许任意类型的操作数，如果操作数相等则返回true，否则返回false。

## ==和===定义
==和===虽然都是关系表达式运算符，但它们的定义是有所不同的：

* ==:称作相等运算符（Equality Operator），它用来检测两个操作是否相等，这里的相等的定义非常宽松，可以允许类型的转换
* ===:称作严格相等运算符(Strict Equality)，也被称之为恒等运算符(Identity Operator)或全等运算符，它用来检测两个操作数是否严格相等

## == 和 ===运算规则
JavaScript中==和===运算符，它们的运算都具有自己的运算规则。

### ==运算规则
==运算符对于两个数比较并不严格。如果两个操作数不是同一类型，那么相等运算符会尝试进行一些类型转换，然后进行比较。

在转换不同的数据类型时，其会遵循下列基本原则：

如果两个操作数的类型相同，则会按照严格相等的比较规则一样，如果严格相等，那么比较结果为相等。如果它们不严格相等，则比较结果为不相等。

如果两个操作数的类型不同，==相等操作符也可能会认为它们相等。检测相等将会遵守下面的规则和类型转换：

如果一个值是null, 另一个是undefined，则它们是相等:

```JavaScript
null == undefined; // => true
1
null == undefined; // => true
```
如果一个值是数字，另一个是字符串，先将字符串转换为数值，然后使用转换后的值进行比较:

```JavaScript
1 == '1'; // => true
1
1 == '1'; // => true
```
如果其中一个值是true，则将其转换为 1 再进行比较。如果其中一个值是 false，则将其转换为 0 再进行比较：

```JavaScript
true == 0;   // => false
false == 1;  // => false
true == 1;   // => true
false == 0;  // => true
true == '1'; // => true
false == '0';// => true
```
如果一个值是对象，另一个值是数字或字符串，将会先使用 toString() 和 valueOf() 将对象转换为原始值，然后再进行比较。

两个操作数在进行比较时则要遵循下列规则：

* null和undefined是相等的
* 要比较相等性之前，不能将null和undefined转换成其他任何值
* 如果有一个操作是NaN，则相等操作符返回false,而不相等操作符返回true。重要提示： 即使两个操作数都是NaN，相等操作符也返回false，因为按照规则 ，NaN不等于NaN
* 如果两个操作数都是对象，则比较它们是不是同一个对象。如果两个操作数都指向同一个对象，则相等操作符返回true，否则返回false

来看一下对象的比较：

```JavaScript
var a = [1,2,3];
var b = [1,2,3];

var c = { x: 1, y: 2 };
var d = { x: 1, y: 2 };

var e = "text";
var f = "te" + "xt";

a == b       // =>false
c == d       // =>false
e == f       // =>true
```
对于两个操作数 var1==var2, 下图能表达的很清楚：
![](https://www.cnblogs.com/images/cnblogs_com/haogj/242334/o_javascript-equalit-1.png)
图中绿色的方框表示返回的值为 `true`，其它的表示返回的值为 `false`。同样可以使用另一张图来表述：
![](https://www.cnblogs.com/images/cnblogs_com/haogj/242334/o_javascript-equalit-3.png)
图中橙色的方框表示返回的值为 `true`，其它的表示返回的值为 `false`。

### ===运算规则
严格相等运算符===首先要计算其操作数的值，然后比较这两个值，比较过程没有任何类型转换。其运算规则遵循下面的规则：

如果两个值类型不相同，则它们不相等

```JavaScript
true === '1'; // => false
```
其中操作数true是布尔值，而’1’是字符串值。

如果两个者都是null或者都是undefined，则它们相等:

```JavaScript
null === null; // => true
undefined === undefined; // => true
null === undefined; // =>false
```
如果两个值都是布尔值true或false，则它们相等：

```JavaScript
true === true;   // =>true
false === false; // =>true
true === 1;      // =>false
true === '1';    // =>false
false === 0;     // =>false
false === '0';   // =>false
```
* 如果其中一个值是NaN,或者两个值都是NaN，则它们不相等。NaN和其他任何值都是不相等的，包括它本身。通过x !== x来判断x是否为NaN，只有在x为NaN的时候，这个表达式的值才为true。
* 如果两个值为数字且数值相等，则它们相等。如果一个值为0，另一个值为-0，则它们同样的相等。
* 如果两个值为字符串，且所含的对应位上的16位数完全相等，则它们相等。如果它们的长度或内容不同，则它们不等。两个字符串可能含义完全一样且所显示出的字符也一样，但且有不同编码的16位值。JavaScript并不对Unicode进行标准化的转换，因此像这样的字符串通过===和==运算符的比较结果也不相等。在JavaScript中字符串的比较提供了一个String.localeCompare()方法。
* 如果两个引用值指向同一个对象，数组或函数，则它们是相等的。如果指向不同的对象，则它们是不等的，尽管两个对象具有完全一样的属性。

```JavaScript
var a = [1,2,3];
var b = [1,2,3];
var c = a;

var ab_eq = (a === b); // false (even though a and b are the same type)
var ac_eq = (a === c); // true

var a = { x: 1, y: 2 };
var b = { x: 1, y: 2 };
var c = a;

var ab_eq = (a === b); // false (even though a and b are the same type)
var ac_eq = (a === c); // true

var a = { };
var b = { };
var c = a;

var ab_eq = (a === b); // false (even though a and b are the same type)
var ac_eq = (a === c); // true
```
同样对于var1 === var2也可以用图来表达：
![](https://www.cnblogs.com/images/cnblogs_com/haogj/242334/o_javascript-equalit-2.png)
上图中绿色的方框表示返回的值为true，白色的方框表示返回的值为false。除了上图之外，下面这张图也表达的是同样的意思：

![](https://www.cnblogs.com/images/cnblogs_com/haogj/242334/o_javascript-equalit-4.png)
上图中橙色的方框表示返回的值为 `true`，白色的方框表示返回的值为 `false`。

在JavaScript中比较运算符不仅仅是==和===。还有其它的比较运算符，比如<=、>=。综合起来，也可以使用一张图表述：

* 红色:===
* 橙色:==
* 黄色:<=和>=同时成立，==不成立
* 蓝色:只有>=
* 绿色：只有<=

![](https://www.cnblogs.com/images/cnblogs_com/haogj/242334/o_javascript-equalit-5.png)
有关于JavaScript中==和===更多的讨论，可以点击[这里](http://stackoverflow.com/questions/359494/which-equals-operator-vs-should-be-used-in-javascript-comparisons)和[这里。](https://www.zhihu.com/question/31442029)

### != 和 !==
在JavaScript中还有两个运算符和==、===类似，它们是!=和!===。在JavaScript中，!=和!==运算符的检测是==和===运算符的求反。如果两个值通过==的比较结果为true，那么通过!=的比较结果则为false。如果两个值通过===的比较结果为true，那么通过!==的比较结果则为false。

## 总结
这篇文章简单的总结了JavaScript中的==和===运算符的规则，以前这两个运算符中不同之处。简单的只需要记住==表示两个操作数相同，===表示来格相等(恒等或全等),!=称为不相等，!==表示不严格相等。
