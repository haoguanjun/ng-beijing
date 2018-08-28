---
title: Angular 一些内部实现机制     
date: 2018-08-28
categories: angular
---
 Angular 内部对 async 管道，onChanges()，ngDoCheck() 的实现
<!-- more -->

#### async pipe
it subscribe the observable, when a data nexted, async will markForCheck() to update UI.
it call updateLatestValue function as follow:

```typescript
createSubscription(async: Observable<any>, updateLatestValue: any): ISubscription {
    return async.subscribe({next: updateLatestValue, error: (e: any) => { throw e; }});
}
```
[common/src/pipes/async_pipe.ts](https://github.com/angular/angular/blob/4.3.3/packages/common/src/pipes/async_pipe.ts#L43-L145)

in updateLatestValue() function, it do markForCheck().

```typescript
private _updateLatestValue(async: any, value: Object): void {
    if (async === this._obj) {
      this._latestValue = value;
      this._ref.markForCheck();
    }
}
```

#### onChanges()
angular will always do check work, if your @input not changed, it doesn’t call ngOnChanges().

it call checkBinding(), if @input changed, it call ngOnChange();

```javascript
export function checkBinding( view: ViewData, def: NodeDef, bindingIdx: number, value: any): boolean {
  const oldValues = view.oldValues;
  if ((view.state & ViewState.FirstCheck) || !looseIdentical(oldValues[def.bindingIndex + bindingIdx], value)) {
    return true;
  }
  return false;
}
```
looseIdentical defined at [/core/src/util.ts](https://github.com/angular/angular/blob/master/packages/core/src/util.ts)

```javascript
// JS has NaN !== NaN
export function looseIdentical(a: any, b: any): boolean {
  return a === b || typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b);
}
```

after checkBinding(), 
```typescript
if (changes) {
    directive.ngOnChanges(changes);
}
```

#### ngDoCheck()
if you implement DoCheck, component will call DoCheck().

```javascript
if (def.flags & NodeFlags.DoCheck) {
    directive.ngDoCheck();
}
```
