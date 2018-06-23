---
title: 添加 Travis 集成!
date: 2018-06-17
categories: others
---
今天添加了 Travis 的自动化构建和部署支持。
1. [Travis 官方网站](https://travis-ci.org/)
2. [用持续集成工具Travis进行构建和部署](http://www.cnblogs.com/blackpuppy/p/use_travis_to_build_and_deploy.html)
3. 自动部署到 Azure [Azure Web App Deployment](https://docs.travis-ci.com/user/deployment/azure-web-apps/)

在 Travis 中，可以使用环境变量来保存用户账号等信息，需要注意的是：Notice that the values are not escaped when your builds are executed. Special characters (for bash) should be escaped accordingly.
