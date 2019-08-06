---
title: NgRx - 企业级 Angular 应用最佳实践
date: 2019-08-06
categories: angular
---
下面我将介绍在工作中构建一系列企业级 Angular 应用程序之后，我使用 `NgRx` 开发的模式. 我发现多数的在线教程在帮助你从 `store` 起步的时候非常棒，但是对于如何在你的 `store` 功能分片，根 `store` ，以及用户接口等方面，则缺少最佳实践的说明，

使用下面的模式，您的应用程序的根状态，以及根应用程序的每个分片状态，被分隔到 `RootStoreModule` 和每个功能的 `MyFeatureStoreModule` 中。
<!-- more -->  
# NgRx - 企业级 Angular 应用最佳实践

![](https://wesleygrimes.com/assets/post_headers/ngrx_best_practices_header.png)

## 开始之前

本文不是 `NgRx` 的教程。现在已经由一系列的教程存在，它们由比我聪明得多的专家编写。在开始实现下面这些概念之前，我强烈建议你花点时间学习 `NgRx` 和 `Redux` 模式。

* [Ultimate Angular — NgRx Store & Effects](https://platform.ultimatecourses.com/p/ngrx-store-effects?affcode=76683_ttll_neb)
* [Pluralsight — Play by Play Angular NgRx](https://www.pluralsight.com/courses/play-by-play-angular-ngrx)
* [NgRx Blog on Medium.com](https://medium.com/ngrx)
* [NgRx.io Docs](https://ngrx.io/docs)
* [NgRx.io Resources](https://ngrx.io/resources)

## 背景

下面我将介绍在工作中构建一系列企业级 Angular 应用程序之后，我使用 `NgRx` 开发的模式. 我发现多数的在线教程在帮助你从 `store` 起步的时候非常棒，但是对于如何在你的 `store` 功能分片，根 `store` ，以及用户接口等方面，则缺少最佳实践的说明，

使用下面的模式，您的应用程序的根状态，以及根应用程序的每个分片状态，被分隔到 `RootStoreModule` 和每个功能的 `MyFeatureStoreModule` 中。

## 预备知识

本文假设你使用 Angular v7 CLI 生成应用程序。

## 安装 NgRx 依赖

在我们使用生成的代码之前，让我们确认我们已经安装了必要的 `NgRx` 模块。

```bash
$ npm install @ngrx/{store,store-devtools,entity,effects}
```



## 最佳实践 1 - 根 Store 模块

创建根 `store` 模块作为一个完整的 Angular 模块，与 `NgRx` 的 `store` 逻辑绑定在一起。功能 `store` 模块将被导入到根 `store` 中，这样唯一的根 `store` 模块将被导入到应用程序的主 `App Module` 模块中。

### 建议的实现

1. 使用 Angular CLI 生成 `RootStoreModule`

   ```bash
   $ng g module root-store --flat false --module app.module.ts
   ```

   注：--flat false 表示不要在项目的顶级目录创建文件，其实默认就是 false。--module 表示将新创建的模板导入的模块。

2. 使用 Angular CLI 生成表示整个应用程序状态的 `RootState` 接口

   ```bash
   $ ng g interface root-store/root-state
   ```

   这将会创建名为 `RootState` 的接口，但是你需要在生成的 .ts 文件中将其重新命名为 `State`，因为我们希望在后面这样使用它 `RootStoreState.State`

请注意，后面我们会回到这里，将每个功能模块添加为其属性。

## 最佳实践 2 - 创建功能 Store 模块

创建功能 `store` 模块作为标准的 Angular 模块，将分片的 `store` 打包在一起，包括 `state`, `actions`, `reducer`, `selectors` 以及 `effects`。功能模块会被导入根模块 `RootStoreModule`。这样可以帮助你的每个功能 `store` 代码被清晰地组织到子目录中。同时，本文后面将会介绍到，公共的 `actions`， `selectors` 以及 `state` 以功能 `store` 前缀分隔到命名控件中。

### 命名你的功能 `store`

我们下面示例中的实现将使用功能名称 `MyFeature`，但是，对于不同的功能模块将使用不同的名称，该名称应该镜像到 `RootState` 的属性名。例如，如果你构建一个博客应用程序，功能模块的名称可能就是 `Post`。

### 使用实体功能模块还是标准的功能模块？

基于你正在构建的功能类型，你可能会也可能不会从  [NgRx Entity](https://medium.com/ngrx/introducing-ngrx-entity-598176456e15) 中得到助益。如果你的功能片将会与类型化的数组打交道，我建议你遵循下面的 `Entity Feature Module` 实现。如果你的功能片没有特定类型的数组，我建议你遵循下面的 `Standard Feature MOdule` 实现。

### 建议实现 - Entity Feature Module

1. 使用 Angular CLI 生成 `MyFeatureSToreModule`  

   ```bash
   $ng g module root-store/my-feature-store --flat false --module root-store/root-store.module.ts
   ```

   

2. 定义 `Actions`, 在 `app/root-store/my-feature-store` 目录中创建 `actions.ts` 文件

   ```javascript
   import { Action } from @ngrx/store;
   import { MyModel } from '../../models';
   
   export enum ActionTypes {
     LOAD_REQUEST = '[My Feature] Load Request',
     LOAD_FAILURE = '[My Feature] Load Failure',
     LOAD_SUCCESS = '[My Feature] Load Success'
   }
   
   export class LoadRequestAction implements Action {
     readonly type = ActionTypes.LOAD_REQUEST;
   }
   
   export class LoadFailureAction implements Action {
     readonly type = ActionTypes.LOAD_FAILURE;
     constructor(public payload: { error: string }) {}
   }
   
   export class LoadSuccessAction implements Action {
     readonly type = ActionTypes.LOAD_SUCCESS;
     constructor(public payload: { items: MyModel[] }) {}
   }
   
   export type Actions = LoadRequestAction | LoadFailureAction | LoadSuccessAction;
   ```

   

3. 创建 `State` ，在 `app/root-store/my-feature-store` 目录中创建 `state.ts` 文件

   ```javascript
   import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
   import { MyModel } from '../../models';
   
   export const featureAdapter: EntityAdapter<MyModel> = createEntityAdapter<
     MyModel
   >({
     selectId: model => model.id,
     sortComparer: (a: MyModel, b: MyModel): number =>
       b.someDate.toString().localeCompare(a.someDate.toString())
   });
   
   export interface State extends EntityState<MyModel> {
     isLoading?: boolean;
     error?: any;
   }
   
   export const initialState: State = featureAdapter.getInitialState({
     isLoading: false,
     error: null
   });
   ```

   

4. 创建 `Reducer`, 在 `app/root-store/my-feature-store` 目录中创建 `reducer.ts` 文件

   ```javascript
   import { Actions, ActionTypes } from './actions';
   import { featureAdapter, initialState, State } from './state';
   
   export function featureReducer(state = initialState, action: Actions): State {
     switch (action.type) {
       case ActionTypes.LOAD_REQUEST: {
         return {
           ...state,
           isLoading: true,
           error: null
         };
       }
       case ActionTypes.LOAD_SUCCESS: {
         return featureAdapter.addAll(action.payload.items, {
           ...state,
           isLoading: false,
           error: null
         });
       }
       case ActionTypes.LOAD_FAILURE: {
         return {
           ...state,
           isLoading: false,
           error: action.payload.error
         };
       }
       default: {
         return state;
       }
     }
   }
   ```

   

5. 创建 `Selector`，在  `app/root-store/my-feature-store` 目录中创建 `selectors.ts` 文件

   ```javascript
   import {
     createFeatureSelector,
     createSelector,
     MemoizedSelector
   } from '@ngrx/store';
   
   import { MyModel } from '../models';
   import { featureAdapter, State } from './state';
   
   export const getError = (state: State): any => state.error;
   
   export const getIsLoading = (state: State): boolean => state.isLoading;
   
   export const selectMyFeatureState: MemoizedSelector<
     object,
     State
   > = createFeatureSelector<State>('myFeature');
   
   export const selectAllMyFeatureItems: (
     state: object
   ) => MyModel[] = featureAdapter.getSelectors(selectMyFeatureState).selectAll;
   
   export const selectMyFeatureById = (id: string) =>
     createSelector(
       this.selectAllMyFeatureItems,
       (allMyFeatures: MyModel[]) => {
         if (allMyFeatures) {
           return allMyFeatures.find(p => p.id === id);
         } else {
           return null;
         }
       }
     );
   
   export const selectMyFeatureError: MemoizedSelector<
     object,
     any
   > = createSelector(
     selectMyFeatureState,
     getError
   );
   
   export const selectMyFeatureIsLoading: MemoizedSelector<
     object,
     boolean
   > = createSelector(
     selectMyFeatureState,
     getIsLoading
   );
   ```

   

6. 创建 `Effects`, 在  `app/root-store/my-feature-store` 目录中创建 `effects.ts` 文件

   ```typescript
   import { Injectable } from '@angular/core';
   import { Actions, Effect, ofType } from '@ngrx/effects';
   import { Action } from '@ngrx/store';
   import { Observable, of as observableOf } from 'rxjs';
   import { catchError, map, startWith, switchMap } from 'rxjs/operators';
   import { DataService } from '../../services/data.service';
   import * as featureActions from './actions';
   
   @Injectable()
   export class MyFeatureStoreEffects {
     constructor(private dataService: DataService, private actions$: Actions) {}
   
     @Effect()
     loadRequestEffect$: Observable<Action> = this.actions$.pipe(
       ofType<featureActions.LoadRequestAction>(
         featureActions.ActionTypes.LOAD_REQUEST
       ),
       startWith(new featureActions.LoadRequestAction()),
       switchMap(action =>
         this.dataService.getItems().pipe(
           map(
             items =>
               new featureActions.LoadSuccessAction({
                 items
               })
           ),
           catchError(error =>
             observableOf(new featureActions.LoadFailureAction({ error }))
           )
         )
       )
     );
   }
   ```

### 建议实现 - 标准的功能模块

1. 使用 Angular CLI 生成 `MyFeatureStoreModule`

   ```bash
   ng g module root-store/my-feature-store --flat false --module root-store/root-store.module.ts
   ```

   

2. 创建 `actions` , 在  `app/root-store/my-feature-store` 目录中创建 `actions.ts` 文件

   ```javascript
   import { Action } from '@ngrx/store';
   import { User } from '../../models';
   
   export enum ActionTypes {
     LOGIN_REQUEST = '[My Feature] Login Request',
     LOGIN_FAILURE = '[My Feature] Login Failure',
     LOGIN_SUCCESS = '[My Feature] Login Success'
   }
   
   export class LoginRequestAction implements Action {
     readonly type = ActionTypes.LOGIN_REQUEST;
     constructor(public payload: { userName: string; password: string }) {}
   }
   
   export class LoginFailureAction implements Action {
     readonly type = ActionTypes.LOGIN_FAILURE;
     constructor(public payload: { error: string }) {}
   }
   
   export class LoginSuccessAction implements Action {
     readonly type = ActionTypes.LOGIN_SUCCESS;
     constructor(public payload: { user: User }) {}
   }
   
   export type Actions =
     | LoginRequestAction
     | LoginFailureAction
     | LoginSuccessAction;
   ```

   

3. 创建 `State` , 在  `app/root-store/my-feature-store` 目录中创建 `state.ts` 文件

   ```javascript
   import { User } from '../../models';
   
   export interface State {
     user: User | null;
     isLoading: boolean;
     error: string;
   }
   
   export const initialState: State = {
     user: null,
     isLoading: false,
     error: null
   };
   ```

   

4. 创建 `Reducer` , 在  `app/root-store/my-feature-store` 目录中创建 `reducer.ts` 文件

   ```javascript
   import { Actions, ActionTypes } from './actions';
   import { initialState, State } from './state';
   
   export function featureReducer(state = initialState, action: Actions): State {
     switch (action.type) {
       case ActionTypes.LOGIN_REQUEST:
         return {
           ...state,
           error: null,
           isLoading: true
         };
       case ActionTypes.LOGIN_SUCCESS:
         return {
           ...state,
           user: action.payload.user,
           error: null,
           isLoading: false
         };
       case ActionTypes.LOGIN_FAILURE:
         return {
           ...state,
           error: action.payload.error,
           isLoading: false
         };
       default: {
         return state;
       }
     }
   }
   ```

   

5. 创建 `Selector` , 在  `app/root-store/my-feature-store` 目录中创建 `selectors.ts` 文件

   ```typescript
   import {
     createFeatureSelector,
     createSelector,
     MemoizedSelector
   } from '@ngrx/store';
   
   import { User } from '../../models';
   
   import { State } from './state';
   
   const getError = (state: State): any => state.error;
   
   const getIsLoading = (state: State): boolean => state.isLoading;
   
   const getUser = (state: State): any => state.user;
   
   export const selectMyFeatureState: MemoizedSelector<
     object,
     State
   > = createFeatureSelector<State>('myFeature');
   
   export const selectMyFeatureError: MemoizedSelector<
     object,
     any
   > = createSelector(
     selectMyFeatureState,
     getError
   );
   
   export const selectMyFeatureIsLoading: MemoizedSelector<
     object,
     boolean
   > = createSelector(
     selectMyFeatureState,
     getIsLoading
   );
   
   export const selectMyFeatureUser: MemoizedSelector<
     object,
     User
   > = createSelector(
     selectMyFeatureState,
     getUser
   );
   ```

6. 创建 `Effects` , 在  `app/root-store/my-feature-store` 目录中创建 `effects.ts` 文件

   ```typescript
   import { Injectable } from '@angular/core';
   import { Actions, Effect, ofType } from '@ngrx/effects';
   import { Action } from '@ngrx/store';
   import { Observable, of as observableOf } from 'rxjs';
   import { catchError, map, startWith, switchMap } from 'rxjs/operators';
   import { DataService } from '../../services/data.service';
   import * as featureActions from './actions';
   
   @Injectable()
   export class MyFeatureStoreEffects {
     constructor(private dataService: DataService, private actions$: Actions) {}
   
     @Effect()
     loginRequestEffect$: Observable<Action> = this.actions$.pipe(
       ofType<featureActions.LoginRequestAction>(
         featureActions.ActionTypes.LOGIN_REQUEST
       ),
       switchMap(action =>
         this.dataService
           .login(action.payload.userName, action.payload.password)
           .pipe(
             map(
               user =>
                 new featureActions.LoginSuccessAction({
                   user
                 })
             ),
             catchError(error =>
               observableOf(new featureActions.LoginFailureAction({ error }))
             )
           )
       )
     );
   }
   ```

### 建议实现 - Entity 和 Standard 功能模块

现在我们已经创建了功能模块，不管是实体功能模块或是标准类型的功能模块，我们需要将它们 ( `state`, `actions`, `reducer`, `effects`, `selectors`) 导入 Angular ,另外，我们需要创建，以便在 Component 中的导入更加清晰和有序，使用声明的命名空间。

1. 使用下面代码更新 `app/root-store/my-feature/my-feature-store.module.ts`

   ```typescript
   import { CommonModule } from '@angular/common';
   import { NgModule } from '@angular/core';
   import { EffectsModule } from '@ngrx/effects';
   import { StoreModule } from '@ngrx/store';
   import { MyFeatureStoreEffects } from './effects';
   import { featureReducer } from './reducer';
   
   @NgModule({
     imports: [
       CommonModule,
       StoreModule.forFeature('myFeature', featureReducer),
       EffectsModule.forFeature([MyFeatureStoreEffects])
     ],
     providers: [MyFeatureStoreEffects]
   })
   export class MyFeatureStoreModule {}
   ```

   

2. 创建文件 `app/root-store/my-feature-store/index.ts` 文件来统一导出，你需要注意到我们导入定义的 `store` 组件，然后在重新导出之前进行了重命名。这是 **`名称空间化`** 我们的 `store` 组件。

   ```javascript
   import * as MyFeatureStoreActions from './actions';
   import * as MyFeatureStoreSelectors from './selectors';
   import * as MyFeatureStoreState from './state';
   
   export { MyFeatureStoreModule } from './my-feature-store.module';
   
   export { MyFeatureStoreActions, MyFeatureStoreSelectors, MyFeatureStoreState };
   ```

   

## 最佳实践 - 根 Store 模块

### 建议实现

1. 更新 `app/root-store/root-state.ts`, 添加我们前面创建的每个功能。

   ```typescript
   import { MyFeatureStoreState } from './my-feature-store';
   import { MyOtherFeatureStoreState } from './my-other-feature-store';
   
   export interface State {
     myFeature: MyFeatureStoreState.State;
     myOtherFeature: MyOtherFeatureStoreState.State;
   }
   ```

   

2. 更新 `app/root-store/root-store.module.ts`, 导入所有的功能模块，再导入下面的 `NgRx` 模块：`StoreModule.forRoot({})` 和 `EffectsModule.forRoot([])`

   ```typescript
   import { CommonModule } from '@angular/common';
   import { NgModule } from '@angular/core';
   import { EffectsModule } from '@ngrx/effects';
   import { StoreModule } from '@ngrx/store';
   import { MyFeatureStoreModule } from './my-feature-store/';
   import { MyOtherFeatureStoreModule } from './my-other-feature-store/';
   
   @NgModule({
     imports: [
       CommonModule,
       MyFeatureStoreModule,
       MyOtherFeatureStoreModule,
       StoreModule.forRoot({}),
       EffectsModule.forRoot([])
     ],
     declarations: []
   })
   export class RootStoreModule {}
   ```

   

3. 创建 `app/root-store/selectors.ts` 文件，这里持有所有根状态级别的选择器，比如 Loading 属性，或者聚合的 Error 属性。

   ```javascript
   import { createSelector, MemoizedSelector } from '@ngrx/store';
   import { MyFeatureStoreSelectors } from './my-feature-store';
   
   import { MyOtherFeatureStoreSelectors } from './my-other-feature-store';
   
   export const selectError: MemoizedSelector<object, string> = createSelector(
     MyFeatureStoreSelectors.selectMyFeatureError,
     MyOtherFeatureStoreSelectors.selectMyOtherFeatureError,
     (myFeatureError: string, myOtherFeatureError: string) => {
       return myFeature || myOtherFeature;
     }
   );
   
   export const selectIsLoading: MemoizedSelector<
     object,
     boolean
   > = createSelector(
     MyFeatureStoreSelectors.selectMyFeatureIsLoading,
     MyOtherFeatureStoreSelectors.selectMyOtherFeatureIsLoading,
     (myFeature: boolean, myOtherFeature: boolean) => {
       return myFeature || myOtherFeature;
     }
   );
   ```

   

4. 创建 `app/root-store/index.ts` 文件，使用下面代码统一导出 `store`

   ```typescript
   import { RootStoreModule } from './root-store.module';
   import * as RootStoreSelectors from './selectors';
   import * as RootStoreState from './state';
   export * from './my-feature-store';
   export * from './my-other-feature-store';
   export { RootStoreState, RootStoreSelectors, RootStoreModule };
   ```

## 将根 Store 模块装配到应用程序中

现在已经构建了我们的根 Store 模块，组合了功能 `Store` 模块，我们将其添加到 `app.module.ts` 中，该过程简洁而清晰。

1. 将 `RootStoreModule` 添加到应用程序的 `NgModule.imports` 数组中，确保已经将根模块导入

   ```javascript
   import { RootStoreModule } from './root-store';
   ```

   

2. 下面是在示例的 `container` 组件中使用我们定义的 `store`

   ```typescript
   import { Component, OnInit } from '@angular/core';
   import { Store } from '@ngrx/store';
   import { Observable } from 'rxjs';
   import { MyModel } from '../../models';
   import {
     RootStoreState,
     MyFeatureStoreActions,
     MyFeatureStoreSelectors
   } from '../../root-store';
   
   @Component({
     selector: 'app-my-feature',
     styleUrls: ['my-feature.component.css'],
     templateUrl: './my-feature.component.html'
   })
   export class MyFeatureComponent implements OnInit {
     myFeatureItems$: Observable<MyModel[]>;
     error$: Observable<string>;
     isLoading$: Observable<boolean>;
   
     constructor(private store$: Store<RootStoreState.State>) {}
   
     ngOnInit() {
       this.myFeatureItems$ = this.store$.select(
         MyFeatureStoreSelectors.selectAllMyFeatureItems
       );
   
       this.error$ = this.store$.select(
         MyFeatureStoreSelectors.selectUnProcessedDocumentError
       );
   
       this.isLoading$ = this.store$.select(
         MyFeatureStoreSelectors.selectUnProcessedDocumentIsLoading
       );
   
       this.store$.dispatch(new MyFeatureStoreActions.LoadRequestAction());
     }
   }
   ```

   

## 完成的应用程序结构

完成上面的最佳实践之后，我们的 Angular 应用程序结构应该非常类似下面的结构：

> ```shell
> ├── app
>  │ ├── app-routing.module.ts
>  │ ├── app.component.css
>  │ ├── app.component.html
>  │ ├── app.component.ts
>  │ ├── app.module.ts
>  │ ├── components
>  │ ├── containers
>  │ │    └── my-feature
>  │ │         ├── my-feature.component.css
>  │ │         ├── my-feature.component.html
>  │ │         └── my-feature.component.ts
>  │ ├── models
>  │ │    ├── index.ts
>  │ │    └── my-model.ts
>  │ │    └── user.ts
>  │ ├── root-store
>  │ │    ├── index.ts
>  │ │    ├── root-store.module.ts
>  │ │    ├── selectors.ts
>  │ │    ├── state.ts
>  │ │    └── my-feature-store
>  │ │    |    ├── actions.ts
>  │ │    |    ├── effects.ts
>  │ │    |    ├── index.ts
>  │ │    |    ├── reducer.ts
>  │ │    |    ├── selectors.ts
>  │ │    |    ├── state.ts
>  │ │    |    └── my-feature-store.module.ts
>  │ │    └── my-other-feature-store
>  │ │         ├── actions.ts
>  │ │         ├── effects.ts
>  │ │         ├── index.ts
>  │ │         ├── reducer.ts
>  │ │         ├── selectors.ts
>  │ │         ├── state.ts
>  │ │         └── my-other-feature-store.module.ts
>  │ └── services
>  │      └── data.service.ts
>  ├── assets
>  ├── browserslist
>  ├── environments
>  │ ├── environment.prod.ts
>  │ └── environment.ts
>  ├── index.html
>  ├── main.ts
>  ├── polyfills.ts
>  ├── styles.css
>  ├── test.ts
>  ├── tsconfig.app.json
>  ├── tsconfig.spec.json
>  └── tslint.json
> ```

```typescript

```

## 完整示例

### GitHub

<https://github.com/wesleygrimes/angular-ngrx-chuck-norris>

### Stackblitz

在线示例： [https://angular-ngrx-chuck-norris.stackblitz.io](https://angular-ngrx-chuck-norris.stackblitz.io/)

## 结论

该最佳实践来自我多个真实项目的实现。该最佳实践非常有帮助且可维护。



## See also

* [NgRx - Best Practices for Enterprise Angular Applications](<https://wesleygrimes.com/angular/2018/05/30/ngrx-best-practices-for-enterprise-angular-applications>)
* [NgRx Selectors](<https://ngrx.io/guide/store/selectors>)
* [NgRx Meta-reducers](<https://ngrx.io/guide/store/metareducers>)
