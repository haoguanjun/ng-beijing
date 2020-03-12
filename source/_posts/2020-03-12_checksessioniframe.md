---
title: CheckSessionIframe 源码     
date: 2020-03-12
categories: oidc-client.js
---
分析 CheckSessionIFrame 的实现机制
<!-- more -->

### checksession

CheckSessionIFrame 创建一个内嵌的 iframe 来加载检查 session 的脚本。

#### checksession 的内容来源

使用的 URL 来自 Identity Server 的 /.well-known/openid-configuration API。例如，对于  https://xxxxxx/.well-known/openid-configuration 的访问结果为：

```json
{
  "issuer":"https://xxxxxx",
  "jwks_uri":"https://xxxxxx/.well-known/openid-configuration/jwks",
  "authorization_endpoint":"https://xxxxxx/connect/authorize",
  "token_endpoint":"https://xxxxxx/connect/token",
  "userinfo_endpoint":"https://xxxxxx/connect/userinfo",
  "end_session_endpoint":"https://xxxxxx/connect/endsession",
  "check_session_iframe":"https://xxxxxx/connect/checksession",
  "revocation_endpoint":"https://xxxxxx/connect/revocation",
  "introspection_endpoint":"https://xxxxxx/connect/introspect",
  "device_authorization_endpoint":
      "https://xxxxxx/connect/deviceauthorization",
  "frontchannel_logout_supported":true,
  "frontchannel_logout_session_supported":true,
  "backchannel_logout_supported":true,
  "backchannel_logout_session_supported":true,
  "scopes_supported":[
    "openid","profile","email","apxapi","IdentityServerAdministrator","offline_access"],
  "claims_supported":[
    "sub", "updated_at", "locale", "zoneinfo", "birthdate", "gender", "website", "email", 
    "picture", "preferred_username", "nickname", "middle_name", "given_name", "family_name", 
    "name","profile","email_verified"],
  "grant_types_supported":[
    "authorization_code", "client_credentials", "refresh_token", "implicit", "password", 
    "urn:ietf:params:oauth:grant-type:device_code","WindowsAuth"],
  "response_types_supported":[
    "code", "token", "id_token", "id_token token", "code id_token", "code token",
    "code id_token token"],
  "response_modes_supported":["form_post","query","fragment"],
  "token_endpoint_auth_methods_supported":["client_secret_basic","client_secret_post"],
  "subject_types_supported":["public"],
  "id_token_signing_alg_values_supported":["RS256"],
  "code_challenge_methods_supported":["plain","S256"]
}
```

可以看到提供的 check_session_iframe 的值为 https://xxxxxx/connect/checksession，访问这个地址，则返回一个预定义好的网页。

在请求的响应头中，还指定了内容安全策略

`default-src: 'none'` 禁止加载任何外部资源，需要加引号。

https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/default-src

`script-src 'sha256-ZT3q7lL9GXNGhPTB1Vvrvds2xw/kOV0zoeok2tiV23I=' `  列出允许执行的脚本代码的Hash值，页面内嵌脚本的哈希值只有吻合的情况下，才能执行。

重要的是，这里面的脚本会监听 message 消息，接收一个 origin 和 data，通过计算之后，返回当前会话是否发生了变化：

* 'unchanged' 
* 'changed'

实际的请求如下所示：

```http
GET /connect/checksession HTTP/1.1
Host: cosapxdev14.gencos.com
Connection: keep-alive
Pragma: no-cache
Cache-Control: no-cache
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
Referer: http://xxxxxx/
Accept-Encoding: gzip, deflate
Accept-Language: en-US,en;q=0.9
Cookie: idsrv=......
```

响应头：

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Server: Microsoft-IIS/10.0
Content-Security-Policy: default-src 'none'; script-src 'sha256-ZT3q7lL9GXNGhPTB1Vvrvds2xw/kOV0zoeok2tiV23I='
X-Content-Security-Policy: default-src 'none'; script-src 'sha256-ZT3q7lL9GXNGhPTB1Vvrvds2xw/kOV0zoeok2tiV23I='
Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token,Authorization,X-Correlation-ID
Access-Control-Allow-Origin: *
Date: Thu, 12 Mar 2020 06:50:15 GMT
Content-Length: 12000
```

网页内容如下：

```html
<!DOCTYPE html>
<!--Copyright (c) Brock Allen & Dominick Baier. All rights reserved.-->
<!--Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.-->
<html>
<head>
    <meta http-equiv='X-UA-Compatible' content='IE=edge' />
    <title>Check Session IFrame</title>
</head>
<body>
    <script id='cookie-name' type='application/json'>idsrv.session</script>
    <script>
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  SHA-256 implementation in JavaScript                (c) Chris Veness 2002-2014 / MIT Licence  */
/*                                                                                                */
/*  - see http://csrc.nist.gov/groups/ST/toolkit/secure_hashing.html                              */
/*        http://csrc.nist.gov/groups/ST/toolkit/examples.html                                    */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* jshint node:true *//* global define, escape, unescape */
'use strict';


/**
 * SHA-256 hash function reference implementation.
 *
 * @namespace
 */
var Sha256 = {};


/**
 * Generates SHA-256 hash of string.
 *
 * @param   {string} msg - String to be hashed
 * @returns {string} Hash of msg as hex character string
 */
Sha256.hash = function(msg) {
    // convert string to UTF-8, as SHA only deals with byte-streams
    msg = msg.utf8Encode();
    
    // constants [§4.2.2]
    var K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2 ];
    // initial hash value [§5.3.1]
    var H = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19 ];

    // PREPROCESSING 
 
    msg += String.fromCharCode(0x80);  // add trailing '1' bit (+ 0's padding) to string [§5.1.1]

    // convert string msg into 512-bit/16-integer blocks arrays of ints [§5.2.1]
    var l = msg.length/4 + 2; // length (in 32-bit integers) of msg + ‘1’ + appended length
    var N = Math.ceil(l/16);  // number of 16-integer-blocks required to hold 'l' ints
    var M = new Array(N);

    for (var i=0; i<N; i++) {
        M[i] = new Array(16);
        for (var j=0; j<16; j++) {  // encode 4 chars per integer, big-endian encoding
            M[i][j] = (msg.charCodeAt(i*64+j*4)<<24) | (msg.charCodeAt(i*64+j*4+1)<<16) | 
                      (msg.charCodeAt(i*64+j*4+2)<<8) | (msg.charCodeAt(i*64+j*4+3));
        } // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
    }
    // add length (in bits) into final pair of 32-bit integers (big-endian) [§5.1.1]
    // note: most significant word would be (len-1)*8 >>> 32, but since JS converts
    // bitwise-op args to 32 bits, we need to simulate this by arithmetic operators
    M[N-1][14] = ((msg.length-1)*8) / Math.pow(2, 32); M[N-1][14] = Math.floor(M[N-1][14]);
    M[N-1][15] = ((msg.length-1)*8) & 0xffffffff;


    // HASH COMPUTATION [§6.1.2]

    var W = new Array(64); var a, b, c, d, e, f, g, h;
    for (var i=0; i<N; i++) {

        // 1 - prepare message schedule 'W'
        for (var t=0;  t<16; t++) W[t] = M[i][t];
        for (var t=16; t<64; t++) W[t] = (Sha256.σ1(W[t-2]) + W[t-7] + Sha256.σ0(W[t-15]) + W[t-16]) & 0xffffffff;

        // 2 - initialise working variables a, b, c, d, e, f, g, h with previous hash value
        a = H[0]; b = H[1]; c = H[2]; d = H[3]; e = H[4]; f = H[5]; g = H[6]; h = H[7];

        // 3 - main loop (note 'addition modulo 2^32')
        for (var t=0; t<64; t++) {
            var T1 = h + Sha256.Σ1(e) + Sha256.Ch(e, f, g) + K[t] + W[t];
            var T2 =     Sha256.Σ0(a) + Sha256.Maj(a, b, c);
            h = g;
            g = f;
            f = e;
            e = (d + T1) & 0xffffffff;
            d = c;
            c = b;
            b = a;
            a = (T1 + T2) & 0xffffffff;
        }
         // 4 - compute the new intermediate hash value (note 'addition modulo 2^32')
        H[0] = (H[0]+a) & 0xffffffff;
        H[1] = (H[1]+b) & 0xffffffff; 
        H[2] = (H[2]+c) & 0xffffffff; 
        H[3] = (H[3]+d) & 0xffffffff; 
        H[4] = (H[4]+e) & 0xffffffff;
        H[5] = (H[5]+f) & 0xffffffff;
        H[6] = (H[6]+g) & 0xffffffff; 
        H[7] = (H[7]+h) & 0xffffffff; 
    }

    return Sha256.toHexStr(H[0]) + Sha256.toHexStr(H[1]) + Sha256.toHexStr(H[2]) + Sha256.toHexStr(H[3]) + 
           Sha256.toHexStr(H[4]) + Sha256.toHexStr(H[5]) + Sha256.toHexStr(H[6]) + Sha256.toHexStr(H[7]);
};


/**
 * Rotates right (circular right shift) value x by n positions [§3.2.4].
 * @private
 */
Sha256.ROTR = function(n, x) {
    return (x >>> n) | (x << (32-n));
};

/**
 * Logical functions [§4.1.2].
 * @private
 */
Sha256.Σ0  = function(x) { return Sha256.ROTR(2,  x) ^ Sha256.ROTR(13, x) ^ Sha256.ROTR(22, x); };
Sha256.Σ1  = function(x) { return Sha256.ROTR(6,  x) ^ Sha256.ROTR(11, x) ^ Sha256.ROTR(25, x); };
Sha256.σ0  = function(x) { return Sha256.ROTR(7,  x) ^ Sha256.ROTR(18, x) ^ (x>>>3);  };
Sha256.σ1  = function(x) { return Sha256.ROTR(17, x) ^ Sha256.ROTR(19, x) ^ (x>>>10); };
Sha256.Ch  = function(x, y, z) { return (x & y) ^ (~x & z); };
Sha256.Maj = function(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); };


/**
 * Hexadecimal representation of a number.
 * @private
 */
Sha256.toHexStr = function(n) {
    // note can't use toString(16) as it is implementation-dependant,
    // and in IE returns signed numbers when used on full words
    var s='', v;
    for (var i=7; i>=0; i--) { v = (n>>>(i*4)) & 0xf; s += v.toString(16); }
    return s;
};


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


/** Extend String object with method to encode multi-byte string to utf8
 *  - monsur.hossa.in/2012/07/20/utf-8-in-javascript.html */
if (typeof String.prototype.utf8Encode == 'undefined') {
    String.prototype.utf8Encode = function() {
        return unescape( encodeURIComponent( this ) );
    };
}

/** Extend String object with method to decode utf8 string to multi-byte */
if (typeof String.prototype.utf8Decode == 'undefined') {
    String.prototype.utf8Decode = function() {
        try {
            return decodeURIComponent( escape( this ) );
        } catch (e) {
            return this; // invalid UTF-8? return as-is
        }
    };
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (typeof module != 'undefined' && module.exports) module.exports = Sha256; // CommonJs export
if (typeof define == 'function' && define.amd) define([], function() { return Sha256; }); // AMD

////////////////////////////////////////////////////////////////////
///////////// IdentityServer JS Code Starts here ///////////////////
////////////////////////////////////////////////////////////////////

        function getCookies() {
            var allCookies = document.cookie;
            var cookies = allCookies.split(';');
            return cookies.map(function(value) {
                var parts = value.trim().split('=');
                if (parts.length === 2) {
                    return {
                        name: parts[0].trim(),
                        value: parts[1].trim()
                    };
                }
            }).filter(function(item) {
                return item && item.name && item.value;
            });
        }

        function getBrowserSessionId() {
            var cookies = getCookies().filter(function(cookie) {
                return (cookie.name === cookieName);
            });
            return cookies[0] && cookies[0].value;
        }

        /*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/ */
        var b64map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        var b64pad = '=';

        function hex2b64(h) {
            var i;
            var c;
            var ret = '';
            for (i = 0; i + 3 <= h.length; i += 3) {
                c = parseInt(h.substring(i, i + 3), 16);
                ret += b64map.charAt(c >> 6) + b64map.charAt(c & 63);
            }
            if (i + 1 == h.length) {
                c = parseInt(h.substring(i, i + 1), 16);
                ret += b64map.charAt(c << 2);
            }
            else if (i + 2 == h.length) {
                c = parseInt(h.substring(i, i + 2), 16);
                ret += b64map.charAt(c >> 2) + b64map.charAt((c & 3) << 4);
            }
            if (b64pad) while ((ret.length & 3) > 0) ret += b64pad;
            return ret;
        }

        function base64UrlEncode(s){
            var val = hex2b64(s);

            val = val.replace(/=/g, ''); // Remove any trailing '='s
            val = val.replace(/\+/g, '-'); // '+' => '-'
            val = val.replace(/\//g, '_'); // '/' => '_'

            return val;
        }

        function hash(value) {
            var hash = Sha256.hash(value);
            return base64UrlEncode(hash);
        }

        function computeSessionStateHash(clientId, origin, sessionId, salt) {
            return hash(clientId + origin + sessionId + salt);
        }

        function calculateSessionStateResult(origin, message) {
            try {
                if (!origin || !message) {
                    return 'error';
                }

                var idx = message.lastIndexOf(' ');
                if (idx < 0 || idx >= message.length) {
                    return 'error';
                }

                var clientId = message.substring(0, idx);
                var sessionState = message.substring(idx + 1);

                if (!clientId || !sessionState) {
                    return 'error';
                }

                var sessionStateParts = sessionState.split('.');
                if (sessionStateParts.length !== 2) {
                    return 'error';
                }

                var clientHash = sessionStateParts[0];
                var salt = sessionStateParts[1];
                if (!clientHash || !salt) {
                    return 'error';
                }

                var currentSessionId = getBrowserSessionId();
                var expectedHash = computeSessionStateHash(clientId, origin, currentSessionId, salt);
                return clientHash === expectedHash ? 'unchanged' : 'changed';
            }
            catch (e) {
                return 'error';
            }
        }

        var cookieNameElem = document.getElementById('cookie-name');
        if (cookieNameElem) {
            var cookieName = cookieNameElem.textContent.trim();
        }

        if (cookieName && window.parent !== window) {
            window.addEventListener('message', function(e) {
                var result = calculateSessionStateResult(e.origin, e.data);
                e.source.postMessage(result, e.origin);
            }, false);
        }
    </script>
</body>
</html>
```

CheckSessionIFrame 用来管理这个 iframe 的创建和通讯。

#### 创建 checksession 的 iframe

构造函数中，使用提供的构造函数参数创建该 iframe。

```javascript
constructor(callback, client_id, url, interval, stopOnError = true) {
  this._callback = callback;
  this._client_id = client_id;
  this._url = url;
  this._interval = interval || DefaultInterval;
  this._stopOnError = stopOnError;

  var idx = url.indexOf("/", url.indexOf("//") + 2);
  this._frame_origin = url.substr(0, idx);

  this._frame = window.document.createElement("iframe");

  // shotgun approach
  this._frame.style.visibility = "hidden";
  this._frame.style.position = "absolute";
  this._frame.style.display = "none";
  this._frame.style.width = 0;
  this._frame.style.height = 0;

  this._frame.src = url;
}
```

#### 订阅来自 checksession 的消息

Oidc-client.js 通过消息机制与 checksession 这个内嵌的子页面通讯。

在 CheckSessionIFrame 的 load() 函数中，订阅了来自这个 iframe 的消息。

```javascript
load() {
  return new Promise((resolve) => {
    this._frame.onload = () => {
      resolve();
    }

    window.document.body.appendChild(this._frame);
    this._boundMessageEvent = this._message.bind(this);
    window.addEventListener("message", this._boundMessageEvent, false);
  });
}
```

收到检查的结果之后，通过 _message() 进行处理。如果发生了变化，则会调用注册的回调函数。

```javascript
_message(e) {
  if (e.origin === this._frame_origin &&
      e.source === this._frame.contentWindow
     ) {
    if (e.data === "error") {
      Log.error("CheckSessionIFrame: error message from check session op iframe");
      if (this._stopOnError) {
        this.stop();
      }
    }
    else if (e.data === "changed") {
      Log.debug("CheckSessionIFrame: changed message from check session op iframe");
      this.stop();
      this._callback();
    }
    else {
      Log.debug("CheckSessionIFrame: " + e.data + " message from check session op iframe");
    }
  }
}
```



#### 启动检查

检查通过一个 send 变量所引用的匿名函数来处理，通过发送消息的方式将当前的状态发送过去。默认的间隔是 2 秒钟。由于使用了 setInterval()，所以，启动之后，每 2 秒钟会检查一次。

```javascript
const DefaultInterval = 2000;
```

实际的处理函数。

```javascript
start(session_state) {
  if (this._session_state !== session_state) {
    Log.debug("CheckSessionIFrame.start");

    this.stop();

    this._session_state = session_state;

    let send = () => {
      this._frame.contentWindow.postMessage(this._client_id + " " + this._session_state, this._frame_origin);
    };

    // trigger now
    send();

    // and setup timer
    this._timer = window.setInterval(send, this._interval);
  }
}
```

#### 源码链接

https://github.com/IdentityModel/oidc-client-js/blob/release/src/CheckSessionIFrame.js

https://github.com/IdentityModel/oidc-client-js/blob/dev/src/SessionMonitor.js

#### 参考资料

http://www.ruanyifeng.com/blog/2016/09/csp.html
