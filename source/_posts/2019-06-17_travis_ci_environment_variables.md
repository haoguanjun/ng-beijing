---
title: Travis CI 环境变量中转义符
date: 2019-06-17
categories: travis
---
在 Travis CI 中，如果你的密钥值中包含有转义字符，例如 &, 需要通过在其前面加上 \ 来进行转义。$ 也是需要转义的。
<!-- more -->
在 Travis CI 中，使用环境变量可以保护敏感信息，比如密码。在设置环境变量的输入框下面，有一行提示：
> If your secret variable has especial characters like &, escape it by adding \ in front of it. For example ma&w!doc would be typed as ma\&w\!doc.

翻译过来就是：
> 如果你的密钥值中包含有转义字符，例如 &, 需要通过在其前面加上 \ 来进行转义。例如，对于 `ma&w!doc` 来说，需要输入成 `ma\&w`!doc`

注意，其中的 ! 也使用了转义。

但是，在 Travis CI 中，$ 也是需要转义的。

例如，你的用户名是 `a$b`, 其中包含了 $, 那么需要写成 `a\$b`

See also:
* [How to escape $ in a travis ci encrypted environment variable?](https://stackoverflow.com/questions/42608989/how-to-escape-in-a-travis-ci-encrypted-environment-variable)
