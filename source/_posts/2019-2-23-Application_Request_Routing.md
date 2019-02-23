---
title: 获取真实用户 IP 地址     
date: 2019-02-23
categories: http
---
在有代理存在的情况下，需要考虑 X-Forwarded-For 请求头。它是当前的事实标准，各种服务器当前都支持这个标准。
<!-- more -->

# 如何获取用户的真实 IP 地址

在客户端访问服务器的过程中，如果需要经过HTTP代理或者负载均衡服务器，

X-Forwarded-For (XFF) ，可以被用来获取最初发起请求的客户端的IP地址，这个消息头成为事实上的标准。在消息流从客户端流向服务器的过程中被拦截的情况下，服务器端的访问日志只能记录代理服务器或者负载均衡服务器的IP地址。如果想要获得最初发起请求的客户端的IP地址的话，那么 X-Forwarded-For 就派上了用场。

> X-Forwarded-For: \<client>, \<proxy1>, \<proxy2>

例如，在微软的 [Application Request Router](https://docs.microsoft.com/en-us/iis/extensions/planning-for-arr/application-request-routing-version-2-overview) 中，可以通过配置这个 `X-Forwarded-For` 头来传递客户端的真实 IP 地址。
![](https://docs.microsoft.com/en-us/iis/extensions/configuring-application-request-routing-arr/creating-a-forward-proxy-using-application-request-routing/_static/image5.jpg)

* X-Forwarded-For ：这是一个 Squid 开发的字段，只有在通过了HTTP代理或者负载均衡服务器时才会添加该项。
格式为X-Forwarded-For:client1,proxy1,proxy2，一般情况下，第一个ip为客户端真实ip，后面的为经过的代理服务器ip。现在大部分的代理都会加上这个请求头。See: [Squid configuration directive forwarded_for](http://www.squid-cache.org/Doc/config/forwarded_for/)
* Proxy-Client-IP：这个一般是经过 apache http 服务器的请求才会有，用apache http 做代理时一般会加上 Proxy-Client-IP 求头，
* WL-Proxy-Client-IP是 Oracle 的 Weblogic 插件加上的头。See: [WebLogic Server Configuration Reference](https://docs.oracle.com/cd/E13222_01/wls/docs81/config_xml/Server.html)
* X-Real-IP  ：nginx 代理一般会加上此请求头。See: [Module ngx_http_realip_module](http://nginx.org/en/docs/http/ngx_http_realip_module.html)
* HTTP_CLIENT_IP ：有些代理服务器会加上此请求头。

## 在代码中，如何获取到这个请求头呢？

### 通过请求头

直接通过请求对象来访问，例如，在 .NET 程序中。
```csharp
/** 
* 获取用户真实IP地址，不使用request.getRemoteAddr()的原因是有可能用户使用了代理软件方式避免真实IP地址, 
* 可是，如果通过了多级反向代理的话，X-Forwarded-For的值并不止一个，而是一串IP值 
*/
private String getIpAddr(HttpServletRequest request) {
    String ip = request.getHeader("x-forwarded-for"); 
    System.out.println("x-forwarded-for ip: " + ip);
    if (ip != null && ip.length() != 0 && !"unknown".equalsIgnoreCase(ip)) {  
        // 多次反向代理后会有多个ip值，第一个ip才是真实ip
        if( ip.indexOf(",")!=-1 ){
            ip = ip.split(",")[0];
        }
    }  
    if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {  
        ip = request.getHeader("Proxy-Client-IP");  
        System.out.println("Proxy-Client-IP ip: " + ip);
    }  
    if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {  
        ip = request.getHeader("WL-Proxy-Client-IP");  
        System.out.println("WL-Proxy-Client-IP ip: " + ip);
    }  
    if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {  
        ip = request.getHeader("HTTP_CLIENT_IP");  
        System.out.println("HTTP_CLIENT_IP ip: " + ip);
    }  
    if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {  
        ip = request.getHeader("HTTP_X_FORWARDED_FOR");  
        System.out.println("HTTP_X_FORWARDED_FOR ip: " + ip);
    }  
    if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {  
        ip = request.getHeader("X-Real-IP");  
        System.out.println("X-Real-IP ip: " + ip);
    }  
    if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {  
        ip = request.getRemoteAddr();  
        System.out.println("getRemoteAddr ip: " + ip);
    } 
    System.out.println("获取客户端ip: " + ip);
    return ip;  
}
```


### 通过服务器变量

在 Web 开发中，服务器变量提供了关于 Web 服务器、访问的客户端、当前请求连接，以及其它信息。所以，也可以通过服务器变量来获取。不过需要注意的是，服务器变量的名称是添加了 `HTTP_` 前缀的。名称变成了 `HTTP_X_FORWARDED_FOR`。

例如，在 PHP 中，$_SERVER 是一个包含诸如头信息（header）、路径（path）和脚本位置（script locations）的数组。它是 PHP 中一个超级全局变量，我们可以在 PHP 程序的任何地方直接访问它。
```php
if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
	$forwardedIP = $_SERVER['HTTP_X_FORWARDED_FOR'];
	//Log $forwardedIP here
}
```

## See also
* [X-Forwarded-For](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For)
* [Creating a Forward Proxy Using Application Request Routing](https://docs.microsoft.com/en-us/iis/extensions/configuring-application-request-routing-arr/creating-a-forward-proxy-using-application-request-routing)
* [Application Request Routing Version 2 Overview](https://docs.microsoft.com/en-us/iis/extensions/planning-for-arr/application-request-routing-version-2-overview)
* [获取客户端真实IP地址](https://www.cnblogs.com/wang1001/p/9605761.html)
* [如何获取客户端真实IP](https://help.aliyun.com/document_detail/54007.html)
