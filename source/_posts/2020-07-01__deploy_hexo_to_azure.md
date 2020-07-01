---
title: 使用 GitHub Action 将寄宿在 Github 上的 Hexo 博客发布到 Azure App 站点    
date: 2020-07-01
---
详细说明将寄宿在 GitHub 上的 Hexo 站点，通过 Github Action 发布到 Azure Web App 上。
<!-- more -->

# 使用 GitHub Action 将寄宿在 Github 上的 Hexo 博客发布到 Azure App 站点

本文基于 Hexo 4.2.1 版本进行说明。

### 1.  发布 Hexo 博客的原理

基本步骤有 3 个：

* 在构建服务器上拉取寄存在 GitHub 上的 Hexo 站点源码
* 执行 Hexo 的 generate 命令进行构建，生成整个静态网站。
* 将静态网站的内容发布到 Azure 的 Web App 站点。

### 2. 具体的执行步骤

#### 2.1 定义变量

在 Action 中也可以定义变量，这样在 yaml 中可以引用变量的值。变量定义使用 env 节来完成。

```yaml
env:
  AZURE_WEBAPP_NAME: your-app-name        # set this to your application's name
  AZURE_WEBAPP_PACKAGE_PATH: './output'   # set this to the path to your web app project,
  NODE_VERSION: '10.x' 
```

这里的 your-app-name 需要替换为你的应用名字字符串。

#### 2.2 拉取代码到构建服务器

在 GitHub Action 这可以比较简单地实现。

官方提供的 [actions/checkout@master](https://github.com/actions/checkout) 提供了实现。通常我们只需要拉取 master 分支，那就更简单了

```yaml
    steps:
    # checkout the repo
    - name: 'Checkout Github Action' 
      uses: actions/checkout@master
```

#### 2.2 准备 node 环境

Hexo 是基于 node 环境的，所以在构建服务器上，在执行 Hexo 的 generate 命令之前，我们必须准备好 node 环境。[actions/setup-node](https://github.com/actions/setup-node) 就是用来设置 node 环境的。使用参数 node-version 可以指定 node 的版本，比如需要使用最新的 v12 版本，可以这样定义。

```yaml
    - name: Setup Node 10.x
      uses: actions/setup-node@v1
      with:
        node-version: 12
```

如果使用前面定义的变量，则变成如下形式，使用双花括号将变量的名括起来。

```yaml
    - name: Setup Node 10.x
      uses: actions/setup-node@v1
      with:
        node-version: ${{ env.NODE_VERSION }}
```



#### 2.3 构建 Hexo 站点

执行 Hexo 构建的前提是将 Hexo 使用的依赖包要先下载好，这可以通过 npm 的 install 命令将依赖包下载到本地，install 可以简化为 i。这样的命令如下所示。

```bash
npm i
```

然后，可以在根目录的 package.json 中，看到创建的 npm 命令。

```json
  "hexo": {
    "version": "4.2.1"
  },
  "scripts": {
    "build": "hexo generate",
    "clean": "hexo clean",
    "deploy": "hexo deploy",
    "server": "hexo server"
  },
```

这样，我们可以使用 npm 的 run 命令来执行构建过程。例如通过 build 命令来实际执行 Hexo 的 generate

 命令进行构建。

```bash
npm run build
```

构建之后生成的静态网站，默认静态网站目录是 public。这可以在 Hexo 的 [配置文件中设置](https://hexo.io/zh-cn/docs/configuration#目录)。构建的输出目录是使用 public_dir 进行设置的。下面的示例中，将输出目录修改为了 output/wwwrott。

```
public_dir: output/wwwroot
```

综上所述，需要执行 2 个 npm 命令，先拉取依赖包到本地，然后执行 Hexo 的生成命令。

多个命令的格式与单个命令不同，在 run 之后是一个 | 符号，然后各个命令在下一行开始，注意前面的缩进。

```yaml
    - name: 'npm install, build, and test'
      run: |
        npm install
        npm run build
```

#### 2.4 发布到 Azure Web App 站点

[azure/webapps-deploy](https://github.com/Azure/webapps-deploy) 是 Azure 官方提供的部署到 Azure 的 Actions。它使用 Azure 提供的 publish profile 文件。在 Azure 中站点的首页中上方，即可找到下载这个 publish profile 的链接，点击之后，可以得到一个 扩展名为 .PublishSettings 的 xml 配置文件。



使用任何文本编辑软件打开之后，将其中的文本复制出来。不过该文件中包含了站点的账号等等敏感信息。我们需要使用 Github 仓库的 Settings 功能保存并保护起来。

在 GitHub 的 Settings 页面中，可以找到密钥 Secrets 管理。如下所示：



点击  New secret 添加新密钥，Name 设置为 AZURE_WEBAPP_PUBLISH_PROFILE，可以设置其它名字，不过微软的插件默认使用这个名字，Value 中将复制的 publish settings 串粘贴进去即可。

完成之后如下图所示。



准备好密钥之后就简单了，定义如下的 Step。需要注意的是 secrets 是 GitHub 定义的变量，专门用来引用保存在  GitHub Settings 中的内容。

```yaml
    - name: 'Run Azure webapp deploy action using publish profile credentials'
      uses: azure/webapps-deploy@v2
      with: 
        app-name: ${{ env.AZURE_WEBAPP_NAME }}
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: ${{ env.AZURE_WEBAPP_PACKAGE_PATH }}
```





### 3. 完整的构建脚本

本站的完整构建脚本如下。

```yaml
# This is a basic workflow to help you get started with Actions

name: CI

# Controls when the action will run. Triggers the workflow on push or pull request
# events but only for the master branch
on:
  push:
    branches: [ master ]

env:
  AZURE_WEBAPP_NAME: 'ngBeijing-core'     # set this to your application's name
  AZURE_WEBAPP_PACKAGE_PATH: './output'   # set this to the path to your web app project,
  NODE_VERSION: '10.x'   
  
# A workflow run is made up of one or more jobs that can run sequentially or in parallel
jobs:
  # This workflow contains a single job called "build"
  build:
    # The type of runner that the job will run on
    runs-on: ubuntu-latest

    # Steps represent a sequence of tasks that will be executed as part of the job
    steps:
    # Checks-out your repository under $GITHUB_WORKSPACE, so your job can access it
    - uses: actions/checkout@v2

    # Runs a single command using the runners shell
    - name: Run a one-line script
      run: echo Hello, world!
      
    - name: Setup Node 10.x
      uses: actions/setup-node@v1
      with:
        node-version: ${{ env.NODE_VERSION }}

    # Runs a set of commands using the runners shell
    - name: 'npm install, build, and test'
      run: |
        npm install
        npm run build

    - name: 'Run Azure webapp deploy action using publish profile credentials'
      uses: azure/webapps-deploy@v2
      with: 
        app-name: ${{ env.AZURE_WEBAPP_NAME }}
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: ${{ env.AZURE_WEBAPP_PACKAGE_PATH }}

```



### 4. 检查构建的输出

构建过程中，可以随时检查构建的输出。

切换到 Actions Tab 后，选择你的 workflow。

![](https://www.wangbase.com/blogimg/asset/201909/bg2019091108.jpg)




参考资料：

* [GitHub Actions 入门教程 - 阮一峰](http://www.ruanyifeng.com/blog/2019/09/getting-started-with-github-actions.html)


