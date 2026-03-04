
import {Buffer} from "node:buffer";
globalThis.Buffer = Buffer;

import {AsyncLocalStorage} from "node:async_hooks";
globalThis.AsyncLocalStorage = AsyncLocalStorage;


const defaultDefineProperty = Object.defineProperty;
Object.defineProperty = function(o, p, a) {
  if(p=== '__import_unsupported' && Boolean(globalThis.__import_unsupported)) {
    return;
  }
  return defaultDefineProperty(o, p, a);
};

  
  
  globalThis.openNextDebug = false;globalThis.openNextVersion = "3.9.16";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/@opennextjs/aws/dist/utils/error.js
function isOpenNextError(e) {
  try {
    return "__openNextInternal" in e;
  } catch {
    return false;
  }
}
var init_error = __esm({
  "node_modules/@opennextjs/aws/dist/utils/error.js"() {
  }
});

// node_modules/@opennextjs/aws/dist/adapters/logger.js
function debug(...args) {
  if (globalThis.openNextDebug) {
    console.log(...args);
  }
}
function warn(...args) {
  console.warn(...args);
}
function error(...args) {
  if (args.some((arg) => isDownplayedErrorLog(arg))) {
    return debug(...args);
  }
  if (args.some((arg) => isOpenNextError(arg))) {
    const error2 = args.find((arg) => isOpenNextError(arg));
    if (error2.logLevel < getOpenNextErrorLogLevel()) {
      return;
    }
    if (error2.logLevel === 0) {
      return console.log(...args.map((arg) => isOpenNextError(arg) ? `${arg.name}: ${arg.message}` : arg));
    }
    if (error2.logLevel === 1) {
      return warn(...args.map((arg) => isOpenNextError(arg) ? `${arg.name}: ${arg.message}` : arg));
    }
    return console.error(...args);
  }
  console.error(...args);
}
function getOpenNextErrorLogLevel() {
  const strLevel = process.env.OPEN_NEXT_ERROR_LOG_LEVEL ?? "1";
  switch (strLevel.toLowerCase()) {
    case "debug":
    case "0":
      return 0;
    case "error":
    case "2":
      return 2;
    default:
      return 1;
  }
}
var DOWNPLAYED_ERROR_LOGS, isDownplayedErrorLog;
var init_logger = __esm({
  "node_modules/@opennextjs/aws/dist/adapters/logger.js"() {
    init_error();
    DOWNPLAYED_ERROR_LOGS = [
      {
        clientName: "S3Client",
        commandName: "GetObjectCommand",
        errorName: "NoSuchKey"
      }
    ];
    isDownplayedErrorLog = (errorLog) => DOWNPLAYED_ERROR_LOGS.some((downplayedInput) => downplayedInput.clientName === errorLog?.clientName && downplayedInput.commandName === errorLog?.commandName && (downplayedInput.errorName === errorLog?.error?.name || downplayedInput.errorName === errorLog?.error?.Code));
  }
});

// node_modules/@opennextjs/aws/node_modules/cookie/dist/index.js
var require_dist = __commonJS({
  "node_modules/@opennextjs/aws/node_modules/cookie/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseCookie = parseCookie;
    exports.parse = parseCookie;
    exports.stringifyCookie = stringifyCookie;
    exports.stringifySetCookie = stringifySetCookie;
    exports.serialize = stringifySetCookie;
    exports.parseSetCookie = parseSetCookie;
    exports.stringifySetCookie = stringifySetCookie;
    exports.serialize = stringifySetCookie;
    var cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
    var cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;
    var domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
    var pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
    var maxAgeRegExp = /^-?\d+$/;
    var __toString = Object.prototype.toString;
    var NullObject = /* @__PURE__ */ (() => {
      const C = function() {
      };
      C.prototype = /* @__PURE__ */ Object.create(null);
      return C;
    })();
    function parseCookie(str, options) {
      const obj = new NullObject();
      const len = str.length;
      if (len < 2)
        return obj;
      const dec = options?.decode || decode;
      let index = 0;
      do {
        const eqIdx = eqIndex(str, index, len);
        if (eqIdx === -1)
          break;
        const endIdx = endIndex(str, index, len);
        if (eqIdx > endIdx) {
          index = str.lastIndexOf(";", eqIdx - 1) + 1;
          continue;
        }
        const key = valueSlice(str, index, eqIdx);
        if (obj[key] === void 0) {
          obj[key] = dec(valueSlice(str, eqIdx + 1, endIdx));
        }
        index = endIdx + 1;
      } while (index < len);
      return obj;
    }
    function stringifyCookie(cookie, options) {
      const enc = options?.encode || encodeURIComponent;
      const cookieStrings = [];
      for (const name of Object.keys(cookie)) {
        const val = cookie[name];
        if (val === void 0)
          continue;
        if (!cookieNameRegExp.test(name)) {
          throw new TypeError(`cookie name is invalid: ${name}`);
        }
        const value = enc(val);
        if (!cookieValueRegExp.test(value)) {
          throw new TypeError(`cookie val is invalid: ${val}`);
        }
        cookieStrings.push(`${name}=${value}`);
      }
      return cookieStrings.join("; ");
    }
    function stringifySetCookie(_name, _val, _opts) {
      const cookie = typeof _name === "object" ? _name : { ..._opts, name: _name, value: String(_val) };
      const options = typeof _val === "object" ? _val : _opts;
      const enc = options?.encode || encodeURIComponent;
      if (!cookieNameRegExp.test(cookie.name)) {
        throw new TypeError(`argument name is invalid: ${cookie.name}`);
      }
      const value = cookie.value ? enc(cookie.value) : "";
      if (!cookieValueRegExp.test(value)) {
        throw new TypeError(`argument val is invalid: ${cookie.value}`);
      }
      let str = cookie.name + "=" + value;
      if (cookie.maxAge !== void 0) {
        if (!Number.isInteger(cookie.maxAge)) {
          throw new TypeError(`option maxAge is invalid: ${cookie.maxAge}`);
        }
        str += "; Max-Age=" + cookie.maxAge;
      }
      if (cookie.domain) {
        if (!domainValueRegExp.test(cookie.domain)) {
          throw new TypeError(`option domain is invalid: ${cookie.domain}`);
        }
        str += "; Domain=" + cookie.domain;
      }
      if (cookie.path) {
        if (!pathValueRegExp.test(cookie.path)) {
          throw new TypeError(`option path is invalid: ${cookie.path}`);
        }
        str += "; Path=" + cookie.path;
      }
      if (cookie.expires) {
        if (!isDate(cookie.expires) || !Number.isFinite(cookie.expires.valueOf())) {
          throw new TypeError(`option expires is invalid: ${cookie.expires}`);
        }
        str += "; Expires=" + cookie.expires.toUTCString();
      }
      if (cookie.httpOnly) {
        str += "; HttpOnly";
      }
      if (cookie.secure) {
        str += "; Secure";
      }
      if (cookie.partitioned) {
        str += "; Partitioned";
      }
      if (cookie.priority) {
        const priority = typeof cookie.priority === "string" ? cookie.priority.toLowerCase() : void 0;
        switch (priority) {
          case "low":
            str += "; Priority=Low";
            break;
          case "medium":
            str += "; Priority=Medium";
            break;
          case "high":
            str += "; Priority=High";
            break;
          default:
            throw new TypeError(`option priority is invalid: ${cookie.priority}`);
        }
      }
      if (cookie.sameSite) {
        const sameSite = typeof cookie.sameSite === "string" ? cookie.sameSite.toLowerCase() : cookie.sameSite;
        switch (sameSite) {
          case true:
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError(`option sameSite is invalid: ${cookie.sameSite}`);
        }
      }
      return str;
    }
    function parseSetCookie(str, options) {
      const dec = options?.decode || decode;
      const len = str.length;
      const endIdx = endIndex(str, 0, len);
      const eqIdx = eqIndex(str, 0, endIdx);
      const setCookie = eqIdx === -1 ? { name: "", value: dec(valueSlice(str, 0, endIdx)) } : {
        name: valueSlice(str, 0, eqIdx),
        value: dec(valueSlice(str, eqIdx + 1, endIdx))
      };
      let index = endIdx + 1;
      while (index < len) {
        const endIdx2 = endIndex(str, index, len);
        const eqIdx2 = eqIndex(str, index, endIdx2);
        const attr = eqIdx2 === -1 ? valueSlice(str, index, endIdx2) : valueSlice(str, index, eqIdx2);
        const val = eqIdx2 === -1 ? void 0 : valueSlice(str, eqIdx2 + 1, endIdx2);
        switch (attr.toLowerCase()) {
          case "httponly":
            setCookie.httpOnly = true;
            break;
          case "secure":
            setCookie.secure = true;
            break;
          case "partitioned":
            setCookie.partitioned = true;
            break;
          case "domain":
            setCookie.domain = val;
            break;
          case "path":
            setCookie.path = val;
            break;
          case "max-age":
            if (val && maxAgeRegExp.test(val))
              setCookie.maxAge = Number(val);
            break;
          case "expires":
            if (!val)
              break;
            const date = new Date(val);
            if (Number.isFinite(date.valueOf()))
              setCookie.expires = date;
            break;
          case "priority":
            if (!val)
              break;
            const priority = val.toLowerCase();
            if (priority === "low" || priority === "medium" || priority === "high") {
              setCookie.priority = priority;
            }
            break;
          case "samesite":
            if (!val)
              break;
            const sameSite = val.toLowerCase();
            if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
              setCookie.sameSite = sameSite;
            }
            break;
        }
        index = endIdx2 + 1;
      }
      return setCookie;
    }
    function endIndex(str, min, len) {
      const index = str.indexOf(";", min);
      return index === -1 ? len : index;
    }
    function eqIndex(str, min, max) {
      const index = str.indexOf("=", min);
      return index < max ? index : -1;
    }
    function valueSlice(str, min, max) {
      let start = min;
      let end = max;
      do {
        const code = str.charCodeAt(start);
        if (code !== 32 && code !== 9)
          break;
      } while (++start < end);
      while (end > start) {
        const code = str.charCodeAt(end - 1);
        if (code !== 32 && code !== 9)
          break;
        end--;
      }
      return str.slice(start, end);
    }
    function decode(str) {
      if (str.indexOf("%") === -1)
        return str;
      try {
        return decodeURIComponent(str);
      } catch (e) {
        return str;
      }
    }
    function isDate(val) {
      return __toString.call(val) === "[object Date]";
    }
  }
});

// node_modules/@opennextjs/aws/dist/http/util.js
function parseSetCookieHeader(cookies) {
  if (!cookies) {
    return [];
  }
  if (typeof cookies === "string") {
    return cookies.split(/(?<!Expires=\w+),/i).map((c) => c.trim());
  }
  return cookies;
}
function getQueryFromIterator(it) {
  const query = {};
  for (const [key, value] of it) {
    if (key in query) {
      if (Array.isArray(query[key])) {
        query[key].push(value);
      } else {
        query[key] = [query[key], value];
      }
    } else {
      query[key] = value;
    }
  }
  return query;
}
var init_util = __esm({
  "node_modules/@opennextjs/aws/dist/http/util.js"() {
    init_logger();
  }
});

// node_modules/@opennextjs/aws/dist/overrides/converters/utils.js
function getQueryFromSearchParams(searchParams) {
  return getQueryFromIterator(searchParams.entries());
}
var init_utils = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/converters/utils.js"() {
    init_util();
  }
});

// node_modules/@opennextjs/aws/dist/overrides/converters/edge.js
var edge_exports = {};
__export(edge_exports, {
  default: () => edge_default
});
import { Buffer as Buffer2 } from "node:buffer";
var import_cookie, NULL_BODY_STATUSES, converter, edge_default;
var init_edge = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/converters/edge.js"() {
    import_cookie = __toESM(require_dist(), 1);
    init_util();
    init_utils();
    NULL_BODY_STATUSES = /* @__PURE__ */ new Set([101, 103, 204, 205, 304]);
    converter = {
      convertFrom: async (event) => {
        const url = new URL(event.url);
        const searchParams = url.searchParams;
        const query = getQueryFromSearchParams(searchParams);
        const headers = {};
        event.headers.forEach((value, key) => {
          headers[key] = value;
        });
        const rawPath = url.pathname;
        const method = event.method;
        const shouldHaveBody = method !== "GET" && method !== "HEAD";
        const body = shouldHaveBody ? Buffer2.from(await event.arrayBuffer()) : void 0;
        const cookieHeader = event.headers.get("cookie");
        const cookies = cookieHeader ? import_cookie.default.parse(cookieHeader) : {};
        return {
          type: "core",
          method,
          rawPath,
          url: event.url,
          body,
          headers,
          remoteAddress: event.headers.get("x-forwarded-for") ?? "::1",
          query,
          cookies
        };
      },
      convertTo: async (result) => {
        if ("internalEvent" in result) {
          const request = new Request(result.internalEvent.url, {
            body: result.internalEvent.body,
            method: result.internalEvent.method,
            headers: {
              ...result.internalEvent.headers,
              "x-forwarded-host": result.internalEvent.headers.host
            }
          });
          if (globalThis.__dangerous_ON_edge_converter_returns_request === true) {
            return request;
          }
          const cfCache = (result.isISR || result.internalEvent.rawPath.startsWith("/_next/image")) && process.env.DISABLE_CACHE !== "true" ? { cacheEverything: true } : {};
          return fetch(request, {
            // This is a hack to make sure that the response is cached by Cloudflare
            // See https://developers.cloudflare.com/workers/examples/cache-using-fetch/#caching-html-resources
            // @ts-expect-error - This is a Cloudflare specific option
            cf: cfCache
          });
        }
        const headers = new Headers();
        for (const [key, value] of Object.entries(result.headers)) {
          if (key === "set-cookie" && typeof value === "string") {
            const cookies = parseSetCookieHeader(value);
            for (const cookie of cookies) {
              headers.append(key, cookie);
            }
            continue;
          }
          if (Array.isArray(value)) {
            for (const v of value) {
              headers.append(key, v);
            }
          } else {
            headers.set(key, value);
          }
        }
        const body = NULL_BODY_STATUSES.has(result.statusCode) ? null : result.body;
        return new Response(body, {
          status: result.statusCode,
          headers
        });
      },
      name: "edge"
    };
    edge_default = converter;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/wrappers/cloudflare-edge.js
var cloudflare_edge_exports = {};
__export(cloudflare_edge_exports, {
  default: () => cloudflare_edge_default
});
var cfPropNameMapping, handler, cloudflare_edge_default;
var init_cloudflare_edge = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/wrappers/cloudflare-edge.js"() {
    cfPropNameMapping = {
      // The city name is percent-encoded.
      // See https://github.com/vercel/vercel/blob/4cb6143/packages/functions/src/headers.ts#L94C19-L94C37
      city: [encodeURIComponent, "x-open-next-city"],
      country: "x-open-next-country",
      regionCode: "x-open-next-region",
      latitude: "x-open-next-latitude",
      longitude: "x-open-next-longitude"
    };
    handler = async (handler3, converter2) => async (request, env, ctx) => {
      globalThis.process = process;
      for (const [key, value] of Object.entries(env)) {
        if (typeof value === "string") {
          process.env[key] = value;
        }
      }
      const internalEvent = await converter2.convertFrom(request);
      const cfProperties = request.cf;
      for (const [propName, mapping] of Object.entries(cfPropNameMapping)) {
        const propValue = cfProperties?.[propName];
        if (propValue != null) {
          const [encode, headerName] = Array.isArray(mapping) ? mapping : [null, mapping];
          internalEvent.headers[headerName] = encode ? encode(propValue) : propValue;
        }
      }
      const response = await handler3(internalEvent, {
        waitUntil: ctx.waitUntil.bind(ctx)
      });
      const result = await converter2.convertTo(response);
      return result;
    };
    cloudflare_edge_default = {
      wrapper: handler,
      name: "cloudflare-edge",
      supportStreaming: true,
      edgeRuntime: true
    };
  }
});

// node_modules/@opennextjs/aws/dist/overrides/originResolver/pattern-env.js
var pattern_env_exports = {};
__export(pattern_env_exports, {
  default: () => pattern_env_default
});
function initializeOnce() {
  if (initialized)
    return;
  cachedOrigins = JSON.parse(process.env.OPEN_NEXT_ORIGIN ?? "{}");
  const functions = globalThis.openNextConfig.functions ?? {};
  for (const key in functions) {
    if (key !== "default") {
      const value = functions[key];
      const regexes = [];
      for (const pattern of value.patterns) {
        const regexPattern = `/${pattern.replace(/\*\*/g, "(.*)").replace(/\*/g, "([^/]*)").replace(/\//g, "\\/").replace(/\?/g, ".")}`;
        regexes.push(new RegExp(regexPattern));
      }
      cachedPatterns.push({
        key,
        patterns: value.patterns,
        regexes
      });
    }
  }
  initialized = true;
}
var cachedOrigins, cachedPatterns, initialized, envLoader, pattern_env_default;
var init_pattern_env = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/originResolver/pattern-env.js"() {
    init_logger();
    cachedPatterns = [];
    initialized = false;
    envLoader = {
      name: "env",
      resolve: async (_path) => {
        try {
          initializeOnce();
          for (const { key, patterns, regexes } of cachedPatterns) {
            for (const regex of regexes) {
              if (regex.test(_path)) {
                debug("Using origin", key, patterns);
                return cachedOrigins[key];
              }
            }
          }
          if (_path.startsWith("/_next/image") && cachedOrigins.imageOptimizer) {
            debug("Using origin", "imageOptimizer", _path);
            return cachedOrigins.imageOptimizer;
          }
          if (cachedOrigins.default) {
            debug("Using default origin", cachedOrigins.default, _path);
            return cachedOrigins.default;
          }
          return false;
        } catch (e) {
          error("Error while resolving origin", e);
          return false;
        }
      }
    };
    pattern_env_default = envLoader;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/assetResolver/dummy.js
var dummy_exports = {};
__export(dummy_exports, {
  default: () => dummy_default
});
var resolver, dummy_default;
var init_dummy = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/assetResolver/dummy.js"() {
    resolver = {
      name: "dummy"
    };
    dummy_default = resolver;
  }
});

// node_modules/@opennextjs/aws/dist/utils/stream.js
import { ReadableStream } from "node:stream/web";
function toReadableStream(value, isBase64) {
  return new ReadableStream({
    pull(controller) {
      controller.enqueue(Buffer.from(value, isBase64 ? "base64" : "utf8"));
      controller.close();
    }
  }, { highWaterMark: 0 });
}
function emptyReadableStream() {
  if (process.env.OPEN_NEXT_FORCE_NON_EMPTY_RESPONSE === "true") {
    return new ReadableStream({
      pull(controller) {
        maybeSomethingBuffer ??= Buffer.from("SOMETHING");
        controller.enqueue(maybeSomethingBuffer);
        controller.close();
      }
    }, { highWaterMark: 0 });
  }
  return new ReadableStream({
    start(controller) {
      controller.close();
    }
  });
}
var maybeSomethingBuffer;
var init_stream = __esm({
  "node_modules/@opennextjs/aws/dist/utils/stream.js"() {
  }
});

// node_modules/@opennextjs/aws/dist/overrides/proxyExternalRequest/fetch.js
var fetch_exports = {};
__export(fetch_exports, {
  default: () => fetch_default
});
var fetchProxy, fetch_default;
var init_fetch = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/proxyExternalRequest/fetch.js"() {
    init_stream();
    fetchProxy = {
      name: "fetch-proxy",
      // @ts-ignore
      proxy: async (internalEvent) => {
        const { url, headers: eventHeaders, method, body } = internalEvent;
        const headers = Object.fromEntries(Object.entries(eventHeaders).filter(([key]) => key.toLowerCase() !== "cf-connecting-ip"));
        const response = await fetch(url, {
          method,
          headers,
          body
        });
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        return {
          type: "core",
          headers: responseHeaders,
          statusCode: response.status,
          isBase64Encoded: true,
          body: response.body ?? emptyReadableStream()
        };
      }
    };
    fetch_default = fetchProxy;
  }
});

// .next/prerender-manifest.js
var require_prerender_manifest = __commonJS({
  ".next/prerender-manifest.js"() {
    "use strict";
    self.__PRERENDER_MANIFEST = '{"version":4,"routes":{"/api/bookings":{"initialHeaders":{"content-type":"application/json","x-next-cache-tags":"_N_T_/layout,_N_T_/api/layout,_N_T_/api/bookings/layout,_N_T_/api/bookings/route,_N_T_/api/bookings"},"experimentalBypassFor":[{"type":"header","key":"Next-Action"},{"type":"header","key":"content-type","value":"multipart/form-data;.*"}],"initialRevalidateSeconds":false,"srcRoute":"/api/bookings","dataRoute":null},"/":{"experimentalBypassFor":[{"type":"header","key":"Next-Action"},{"type":"header","key":"content-type","value":"multipart/form-data;.*"}],"initialRevalidateSeconds":false,"srcRoute":"/","dataRoute":"/index.rsc"}},"dynamicRoutes":{},"notFoundRoutes":[],"preview":{"previewModeId":"process.env.__NEXT_PREVIEW_MODE_ID","previewModeSigningKey":"process.env.__NEXT_PREVIEW_MODE_SIGNING_KEY","previewModeEncryptionKey":"process.env.__NEXT_PREVIEW_MODE_ENCRYPTION_KEY"}}';
  }
});

// .next/server/edge-runtime-webpack.js
var require_edge_runtime_webpack = __commonJS({
  ".next/server/edge-runtime-webpack.js"() {
    "use strict";
    (() => {
      "use strict";
      var e = {}, r = {};
      function t(o) {
        var n = r[o];
        if (void 0 !== n) return n.exports;
        var i = r[o] = { exports: {} }, a = true;
        try {
          e[o](i, i.exports, t), a = false;
        } finally {
          a && delete r[o];
        }
        return i.exports;
      }
      t.m = e, t.amdO = {}, (() => {
        var e2 = [];
        t.O = (r2, o, n, i) => {
          if (o) {
            i = i || 0;
            for (var a = e2.length; a > 0 && e2[a - 1][2] > i; a--) e2[a] = e2[a - 1];
            e2[a] = [o, n, i];
            return;
          }
          for (var l = 1 / 0, a = 0; a < e2.length; a++) {
            for (var [o, n, i] = e2[a], u = true, f = 0; f < o.length; f++) l >= i && Object.keys(t.O).every((e3) => t.O[e3](o[f])) ? o.splice(f--, 1) : (u = false, i < l && (l = i));
            if (u) {
              e2.splice(a--, 1);
              var s = n();
              void 0 !== s && (r2 = s);
            }
          }
          return r2;
        };
      })(), t.n = (e2) => {
        var r2 = e2 && e2.__esModule ? () => e2.default : () => e2;
        return t.d(r2, { a: r2 }), r2;
      }, t.d = (e2, r2) => {
        for (var o in r2) t.o(r2, o) && !t.o(e2, o) && Object.defineProperty(e2, o, { enumerable: true, get: r2[o] });
      }, t.g = function() {
        if ("object" == typeof globalThis) return globalThis;
        try {
          return this || Function("return this")();
        } catch (e2) {
          if ("object" == typeof window) return window;
        }
      }(), t.o = (e2, r2) => Object.prototype.hasOwnProperty.call(e2, r2), t.r = (e2) => {
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e2, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(e2, "__esModule", { value: true });
      }, (() => {
        var e2 = { 993: 0 };
        t.O.j = (r3) => 0 === e2[r3];
        var r2 = (r3, o2) => {
          var n, i, [a, l, u] = o2, f = 0;
          if (a.some((r4) => 0 !== e2[r4])) {
            for (n in l) t.o(l, n) && (t.m[n] = l[n]);
            if (u) var s = u(t);
          }
          for (r3 && r3(o2); f < a.length; f++) i = a[f], t.o(e2, i) && e2[i] && e2[i][0](), e2[i] = 0;
          return t.O(s);
        }, o = self.webpackChunk_N_E = self.webpackChunk_N_E || [];
        o.forEach(r2.bind(null, 0)), o.push = r2.bind(null, o.push.bind(o));
      })();
    })();
  }
});

// node-built-in-modules:node:async_hooks
var node_async_hooks_exports = {};
import * as node_async_hooks_star from "node:async_hooks";
var init_node_async_hooks = __esm({
  "node-built-in-modules:node:async_hooks"() {
    __reExport(node_async_hooks_exports, node_async_hooks_star);
  }
});

// node-built-in-modules:node:buffer
var node_buffer_exports = {};
import * as node_buffer_star from "node:buffer";
var init_node_buffer = __esm({
  "node-built-in-modules:node:buffer"() {
    __reExport(node_buffer_exports, node_buffer_star);
  }
});

// .next/server/src/middleware.js
var require_middleware = __commonJS({
  ".next/server/src/middleware.js"() {
    "use strict";
    (self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([[727], { 67: (e) => {
      "use strict";
      e.exports = (init_node_async_hooks(), __toCommonJS(node_async_hooks_exports));
    }, 195: (e) => {
      "use strict";
      e.exports = (init_node_buffer(), __toCommonJS(node_buffer_exports));
    }, 363: (e, t, r) => {
      "use strict";
      let n, i, s, a, o, l, c, u;
      r.r(t), r.d(t, { default: () => lr });
      var d = {};
      async function h() {
        let e10 = "_ENTRIES" in globalThis && _ENTRIES.middleware_instrumentation && (await _ENTRIES.middleware_instrumentation).register;
        if (e10) try {
          await e10();
        } catch (e11) {
          throw e11.message = `An error occurred while loading instrumentation hook: ${e11.message}`, e11;
        }
      }
      r.r(d), r.d(d, { config: () => o9, default: () => o8 });
      let p = null;
      function f() {
        return p || (p = h()), p;
      }
      function g(e10) {
        return `The edge runtime does not support Node.js '${e10}' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime`;
      }
      process !== r.g.process && (process.env = r.g.process.env, r.g.process = process), Object.defineProperty(globalThis, "__import_unsupported", { value: function(e10) {
        let t10 = new Proxy(function() {
        }, { get(t11, r10) {
          if ("then" === r10) return {};
          throw Error(g(e10));
        }, construct() {
          throw Error(g(e10));
        }, apply(r10, n10, i10) {
          if ("function" == typeof i10[0]) return i10[0](t10);
          throw Error(g(e10));
        } });
        return new Proxy({}, { get: () => t10 });
      }, enumerable: false, configurable: false }), f();
      class m extends Error {
        constructor({ page: e10 }) {
          super(`The middleware "${e10}" accepts an async API directly with the form:
  
  export function middleware(request, event) {
    return NextResponse.redirect('/new-location')
  }
  
  Read more: https://nextjs.org/docs/messages/middleware-new-signature
  `);
        }
      }
      class y extends Error {
        constructor() {
          super(`The request.page has been deprecated in favour of \`URLPattern\`.
  Read more: https://nextjs.org/docs/messages/middleware-request-page
  `);
        }
      }
      class b extends Error {
        constructor() {
          super(`The request.ua has been removed in favour of \`userAgent\` function.
  Read more: https://nextjs.org/docs/messages/middleware-parse-user-agent
  `);
        }
      }
      function _(e10) {
        let t10 = {}, r10 = [];
        if (e10) for (let [n10, i10] of e10.entries()) "set-cookie" === n10.toLowerCase() ? (r10.push(...function(e11) {
          var t11, r11, n11, i11, s10, a10 = [], o10 = 0;
          function l2() {
            for (; o10 < e11.length && /\s/.test(e11.charAt(o10)); ) o10 += 1;
            return o10 < e11.length;
          }
          for (; o10 < e11.length; ) {
            for (t11 = o10, s10 = false; l2(); ) if ("," === (r11 = e11.charAt(o10))) {
              for (n11 = o10, o10 += 1, l2(), i11 = o10; o10 < e11.length && "=" !== (r11 = e11.charAt(o10)) && ";" !== r11 && "," !== r11; ) o10 += 1;
              o10 < e11.length && "=" === e11.charAt(o10) ? (s10 = true, o10 = i11, a10.push(e11.substring(t11, n11)), t11 = o10) : o10 = n11 + 1;
            } else o10 += 1;
            (!s10 || o10 >= e11.length) && a10.push(e11.substring(t11, e11.length));
          }
          return a10;
        }(i10)), t10[n10] = 1 === r10.length ? r10[0] : r10) : t10[n10] = i10;
        return t10;
      }
      function v(e10) {
        try {
          return String(new URL(String(e10)));
        } catch (t10) {
          throw Error(`URL is malformed "${String(e10)}". Please use only absolute URLs - https://nextjs.org/docs/messages/middleware-relative-urls`, { cause: t10 });
        }
      }
      let w = Symbol("response"), k = Symbol("passThrough"), S = Symbol("waitUntil");
      class T {
        constructor(e10) {
          this[S] = [], this[k] = false;
        }
        respondWith(e10) {
          this[w] || (this[w] = Promise.resolve(e10));
        }
        passThroughOnException() {
          this[k] = true;
        }
        waitUntil(e10) {
          this[S].push(e10);
        }
      }
      class x extends T {
        constructor(e10) {
          super(e10.request), this.sourcePage = e10.page;
        }
        get request() {
          throw new m({ page: this.sourcePage });
        }
        respondWith() {
          throw new m({ page: this.sourcePage });
        }
      }
      function E(e10) {
        return e10.replace(/\/$/, "") || "/";
      }
      function O(e10) {
        let t10 = e10.indexOf("#"), r10 = e10.indexOf("?"), n10 = r10 > -1 && (t10 < 0 || r10 < t10);
        return n10 || t10 > -1 ? { pathname: e10.substring(0, n10 ? r10 : t10), query: n10 ? e10.substring(r10, t10 > -1 ? t10 : void 0) : "", hash: t10 > -1 ? e10.slice(t10) : "" } : { pathname: e10, query: "", hash: "" };
      }
      function C(e10, t10) {
        if (!e10.startsWith("/") || !t10) return e10;
        let { pathname: r10, query: n10, hash: i10 } = O(e10);
        return "" + t10 + r10 + n10 + i10;
      }
      function I(e10, t10) {
        if (!e10.startsWith("/") || !t10) return e10;
        let { pathname: r10, query: n10, hash: i10 } = O(e10);
        return "" + r10 + t10 + n10 + i10;
      }
      function P(e10, t10) {
        if ("string" != typeof e10) return false;
        let { pathname: r10 } = O(e10);
        return r10 === t10 || r10.startsWith(t10 + "/");
      }
      function A(e10, t10) {
        let r10;
        let n10 = e10.split("/");
        return (t10 || []).some((t11) => !!n10[1] && n10[1].toLowerCase() === t11.toLowerCase() && (r10 = t11, n10.splice(1, 1), e10 = n10.join("/") || "/", true)), { pathname: e10, detectedLocale: r10 };
      }
      let R = /(?!^https?:\/\/)(127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}|\[::1\]|localhost)/;
      function N(e10, t10) {
        return new URL(String(e10).replace(R, "localhost"), t10 && String(t10).replace(R, "localhost"));
      }
      let U = Symbol("NextURLInternal");
      class M {
        constructor(e10, t10, r10) {
          let n10, i10;
          "object" == typeof t10 && "pathname" in t10 || "string" == typeof t10 ? (n10 = t10, i10 = r10 || {}) : i10 = r10 || t10 || {}, this[U] = { url: N(e10, n10 ?? i10.base), options: i10, basePath: "" }, this.analyze();
        }
        analyze() {
          var e10, t10, r10, n10, i10;
          let s10 = function(e11, t11) {
            var r11, n11;
            let { basePath: i11, i18n: s11, trailingSlash: a11 } = null != (r11 = t11.nextConfig) ? r11 : {}, o11 = { pathname: e11, trailingSlash: "/" !== e11 ? e11.endsWith("/") : a11 };
            i11 && P(o11.pathname, i11) && (o11.pathname = function(e12, t12) {
              if (!P(e12, t12)) return e12;
              let r12 = e12.slice(t12.length);
              return r12.startsWith("/") ? r12 : "/" + r12;
            }(o11.pathname, i11), o11.basePath = i11);
            let l2 = o11.pathname;
            if (o11.pathname.startsWith("/_next/data/") && o11.pathname.endsWith(".json")) {
              let e12 = o11.pathname.replace(/^\/_next\/data\//, "").replace(/\.json$/, "").split("/"), r12 = e12[0];
              o11.buildId = r12, l2 = "index" !== e12[1] ? "/" + e12.slice(1).join("/") : "/", true === t11.parseData && (o11.pathname = l2);
            }
            if (s11) {
              let e12 = t11.i18nProvider ? t11.i18nProvider.analyze(o11.pathname) : A(o11.pathname, s11.locales);
              o11.locale = e12.detectedLocale, o11.pathname = null != (n11 = e12.pathname) ? n11 : o11.pathname, !e12.detectedLocale && o11.buildId && (e12 = t11.i18nProvider ? t11.i18nProvider.analyze(l2) : A(l2, s11.locales)).detectedLocale && (o11.locale = e12.detectedLocale);
            }
            return o11;
          }(this[U].url.pathname, { nextConfig: this[U].options.nextConfig, parseData: true, i18nProvider: this[U].options.i18nProvider }), a10 = function(e11, t11) {
            let r11;
            if ((null == t11 ? void 0 : t11.host) && !Array.isArray(t11.host)) r11 = t11.host.toString().split(":", 1)[0];
            else {
              if (!e11.hostname) return;
              r11 = e11.hostname;
            }
            return r11.toLowerCase();
          }(this[U].url, this[U].options.headers);
          this[U].domainLocale = this[U].options.i18nProvider ? this[U].options.i18nProvider.detectDomainLocale(a10) : function(e11, t11, r11) {
            if (e11) for (let s11 of (r11 && (r11 = r11.toLowerCase()), e11)) {
              var n11, i11;
              if (t11 === (null == (n11 = s11.domain) ? void 0 : n11.split(":", 1)[0].toLowerCase()) || r11 === s11.defaultLocale.toLowerCase() || (null == (i11 = s11.locales) ? void 0 : i11.some((e12) => e12.toLowerCase() === r11))) return s11;
            }
          }(null == (t10 = this[U].options.nextConfig) ? void 0 : null == (e10 = t10.i18n) ? void 0 : e10.domains, a10);
          let o10 = (null == (r10 = this[U].domainLocale) ? void 0 : r10.defaultLocale) || (null == (i10 = this[U].options.nextConfig) ? void 0 : null == (n10 = i10.i18n) ? void 0 : n10.defaultLocale);
          this[U].url.pathname = s10.pathname, this[U].defaultLocale = o10, this[U].basePath = s10.basePath ?? "", this[U].buildId = s10.buildId, this[U].locale = s10.locale ?? o10, this[U].trailingSlash = s10.trailingSlash;
        }
        formatPathname() {
          var e10;
          let t10;
          return t10 = function(e11, t11, r10, n10) {
            if (!t11 || t11 === r10) return e11;
            let i10 = e11.toLowerCase();
            return !n10 && (P(i10, "/api") || P(i10, "/" + t11.toLowerCase())) ? e11 : C(e11, "/" + t11);
          }((e10 = { basePath: this[U].basePath, buildId: this[U].buildId, defaultLocale: this[U].options.forceLocale ? void 0 : this[U].defaultLocale, locale: this[U].locale, pathname: this[U].url.pathname, trailingSlash: this[U].trailingSlash }).pathname, e10.locale, e10.buildId ? void 0 : e10.defaultLocale, e10.ignorePrefix), (e10.buildId || !e10.trailingSlash) && (t10 = E(t10)), e10.buildId && (t10 = I(C(t10, "/_next/data/" + e10.buildId), "/" === e10.pathname ? "index.json" : ".json")), t10 = C(t10, e10.basePath), !e10.buildId && e10.trailingSlash ? t10.endsWith("/") ? t10 : I(t10, "/") : E(t10);
        }
        formatSearch() {
          return this[U].url.search;
        }
        get buildId() {
          return this[U].buildId;
        }
        set buildId(e10) {
          this[U].buildId = e10;
        }
        get locale() {
          return this[U].locale ?? "";
        }
        set locale(e10) {
          var t10, r10;
          if (!this[U].locale || !(null == (r10 = this[U].options.nextConfig) ? void 0 : null == (t10 = r10.i18n) ? void 0 : t10.locales.includes(e10))) throw TypeError(`The NextURL configuration includes no locale "${e10}"`);
          this[U].locale = e10;
        }
        get defaultLocale() {
          return this[U].defaultLocale;
        }
        get domainLocale() {
          return this[U].domainLocale;
        }
        get searchParams() {
          return this[U].url.searchParams;
        }
        get host() {
          return this[U].url.host;
        }
        set host(e10) {
          this[U].url.host = e10;
        }
        get hostname() {
          return this[U].url.hostname;
        }
        set hostname(e10) {
          this[U].url.hostname = e10;
        }
        get port() {
          return this[U].url.port;
        }
        set port(e10) {
          this[U].url.port = e10;
        }
        get protocol() {
          return this[U].url.protocol;
        }
        set protocol(e10) {
          this[U].url.protocol = e10;
        }
        get href() {
          let e10 = this.formatPathname(), t10 = this.formatSearch();
          return `${this.protocol}//${this.host}${e10}${t10}${this.hash}`;
        }
        set href(e10) {
          this[U].url = N(e10), this.analyze();
        }
        get origin() {
          return this[U].url.origin;
        }
        get pathname() {
          return this[U].url.pathname;
        }
        set pathname(e10) {
          this[U].url.pathname = e10;
        }
        get hash() {
          return this[U].url.hash;
        }
        set hash(e10) {
          this[U].url.hash = e10;
        }
        get search() {
          return this[U].url.search;
        }
        set search(e10) {
          this[U].url.search = e10;
        }
        get password() {
          return this[U].url.password;
        }
        set password(e10) {
          this[U].url.password = e10;
        }
        get username() {
          return this[U].url.username;
        }
        set username(e10) {
          this[U].url.username = e10;
        }
        get basePath() {
          return this[U].basePath;
        }
        set basePath(e10) {
          this[U].basePath = e10.startsWith("/") ? e10 : `/${e10}`;
        }
        toString() {
          return this.href;
        }
        toJSON() {
          return this.href;
        }
        [Symbol.for("edge-runtime.inspect.custom")]() {
          return { href: this.href, origin: this.origin, protocol: this.protocol, username: this.username, password: this.password, host: this.host, hostname: this.hostname, port: this.port, pathname: this.pathname, search: this.search, searchParams: this.searchParams, hash: this.hash };
        }
        clone() {
          return new M(String(this), this[U].options);
        }
      }
      var L = r(701);
      let q = Symbol("internal request");
      class D extends Request {
        constructor(e10, t10 = {}) {
          let r10 = "string" != typeof e10 && "url" in e10 ? e10.url : String(e10);
          v(r10), e10 instanceof Request ? super(e10, t10) : super(r10, t10);
          let n10 = new M(r10, { headers: _(this.headers), nextConfig: t10.nextConfig });
          this[q] = { cookies: new L.q(this.headers), geo: t10.geo || {}, ip: t10.ip, nextUrl: n10, url: n10.toString() };
        }
        [Symbol.for("edge-runtime.inspect.custom")]() {
          return { cookies: this.cookies, geo: this.geo, ip: this.ip, nextUrl: this.nextUrl, url: this.url, bodyUsed: this.bodyUsed, cache: this.cache, credentials: this.credentials, destination: this.destination, headers: Object.fromEntries(this.headers), integrity: this.integrity, keepalive: this.keepalive, method: this.method, mode: this.mode, redirect: this.redirect, referrer: this.referrer, referrerPolicy: this.referrerPolicy, signal: this.signal };
        }
        get cookies() {
          return this[q].cookies;
        }
        get geo() {
          return this[q].geo;
        }
        get ip() {
          return this[q].ip;
        }
        get nextUrl() {
          return this[q].nextUrl;
        }
        get page() {
          throw new y();
        }
        get ua() {
          throw new b();
        }
        get url() {
          return this[q].url;
        }
      }
      let j = Symbol("internal response"), B = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
      function H(e10, t10) {
        var r10;
        if (null == e10 ? void 0 : null == (r10 = e10.request) ? void 0 : r10.headers) {
          if (!(e10.request.headers instanceof Headers)) throw Error("request.headers must be an instance of Headers");
          let r11 = [];
          for (let [n10, i10] of e10.request.headers) t10.set("x-middleware-request-" + n10, i10), r11.push(n10);
          t10.set("x-middleware-override-headers", r11.join(","));
        }
      }
      class K extends Response {
        constructor(e10, t10 = {}) {
          super(e10, t10), this[j] = { cookies: new L.n(this.headers), url: t10.url ? new M(t10.url, { headers: _(this.headers), nextConfig: t10.nextConfig }) : void 0 };
        }
        [Symbol.for("edge-runtime.inspect.custom")]() {
          return { cookies: this.cookies, url: this.url, body: this.body, bodyUsed: this.bodyUsed, headers: Object.fromEntries(this.headers), ok: this.ok, redirected: this.redirected, status: this.status, statusText: this.statusText, type: this.type };
        }
        get cookies() {
          return this[j].cookies;
        }
        static json(e10, t10) {
          let r10 = Response.json(e10, t10);
          return new K(r10.body, r10);
        }
        static redirect(e10, t10) {
          let r10 = "number" == typeof t10 ? t10 : (null == t10 ? void 0 : t10.status) ?? 307;
          if (!B.has(r10)) throw RangeError('Failed to execute "redirect" on "response": Invalid status code');
          let n10 = "object" == typeof t10 ? t10 : {}, i10 = new Headers(null == n10 ? void 0 : n10.headers);
          return i10.set("Location", v(e10)), new K(null, { ...n10, headers: i10, status: r10 });
        }
        static rewrite(e10, t10) {
          let r10 = new Headers(null == t10 ? void 0 : t10.headers);
          return r10.set("x-middleware-rewrite", v(e10)), H(t10, r10), new K(null, { ...t10, headers: r10 });
        }
        static next(e10) {
          let t10 = new Headers(null == e10 ? void 0 : e10.headers);
          return t10.set("x-middleware-next", "1"), H(e10, t10), new K(null, { ...e10, headers: t10 });
        }
      }
      function $(e10, t10) {
        let r10 = "string" == typeof t10 ? new URL(t10) : t10, n10 = new URL(e10, t10), i10 = r10.protocol + "//" + r10.host;
        return n10.protocol + "//" + n10.host === i10 ? n10.toString().replace(i10, "") : n10.toString();
      }
      let z = [["RSC"], ["Next-Router-State-Tree"], ["Next-Router-Prefetch"]];
      r(387);
      let F = { client: "client", server: "server", edgeServer: "edge-server" };
      F.client, F.server, F.edgeServer, Symbol("polyfills");
      let J = ["__nextFallback", "__nextLocale", "__nextInferredLocaleFromDefault", "__nextDefaultLocale", "__nextIsNotFound", "_rsc"], V = ["__nextDataReq"], W = "nxtP", G = { shared: "shared", reactServerComponents: "rsc", serverSideRendering: "ssr", actionBrowser: "action-browser", api: "api", middleware: "middleware", instrument: "instrument", edgeAsset: "edge-asset", appPagesBrowser: "app-pages-browser", appMetadataRoute: "app-metadata-route", appRouteHandler: "app-route-handler" };
      ({ ...G, GROUP: { serverOnly: [G.reactServerComponents, G.actionBrowser, G.appMetadataRoute, G.appRouteHandler, G.instrument], clientOnly: [G.serverSideRendering, G.appPagesBrowser], nonClientServerTarget: [G.middleware, G.api], app: [G.reactServerComponents, G.actionBrowser, G.appMetadataRoute, G.appRouteHandler, G.serverSideRendering, G.appPagesBrowser, G.shared, G.instrument] } });
      var X = r(226), Y = r(991);
      !function(e10) {
        e10.handleRequest = "BaseServer.handleRequest", e10.run = "BaseServer.run", e10.pipe = "BaseServer.pipe", e10.getStaticHTML = "BaseServer.getStaticHTML", e10.render = "BaseServer.render", e10.renderToResponseWithComponents = "BaseServer.renderToResponseWithComponents", e10.renderToResponse = "BaseServer.renderToResponse", e10.renderToHTML = "BaseServer.renderToHTML", e10.renderError = "BaseServer.renderError", e10.renderErrorToResponse = "BaseServer.renderErrorToResponse", e10.renderErrorToHTML = "BaseServer.renderErrorToHTML", e10.render404 = "BaseServer.render404";
      }(aa || (aa = {})), function(e10) {
        e10.loadDefaultErrorComponents = "LoadComponents.loadDefaultErrorComponents", e10.loadComponents = "LoadComponents.loadComponents";
      }(ao || (ao = {})), function(e10) {
        e10.getRequestHandler = "NextServer.getRequestHandler", e10.getServer = "NextServer.getServer", e10.getServerRequestHandler = "NextServer.getServerRequestHandler", e10.createServer = "createServer.createServer";
      }(al || (al = {})), function(e10) {
        e10.compression = "NextNodeServer.compression", e10.getBuildId = "NextNodeServer.getBuildId", e10.createComponentTree = "NextNodeServer.createComponentTree", e10.clientComponentLoading = "NextNodeServer.clientComponentLoading", e10.getLayoutOrPageModule = "NextNodeServer.getLayoutOrPageModule", e10.generateStaticRoutes = "NextNodeServer.generateStaticRoutes", e10.generateFsStaticRoutes = "NextNodeServer.generateFsStaticRoutes", e10.generatePublicRoutes = "NextNodeServer.generatePublicRoutes", e10.generateImageRoutes = "NextNodeServer.generateImageRoutes.route", e10.sendRenderResult = "NextNodeServer.sendRenderResult", e10.proxyRequest = "NextNodeServer.proxyRequest", e10.runApi = "NextNodeServer.runApi", e10.render = "NextNodeServer.render", e10.renderHTML = "NextNodeServer.renderHTML", e10.imageOptimizer = "NextNodeServer.imageOptimizer", e10.getPagePath = "NextNodeServer.getPagePath", e10.getRoutesManifest = "NextNodeServer.getRoutesManifest", e10.findPageComponents = "NextNodeServer.findPageComponents", e10.getFontManifest = "NextNodeServer.getFontManifest", e10.getServerComponentManifest = "NextNodeServer.getServerComponentManifest", e10.getRequestHandler = "NextNodeServer.getRequestHandler", e10.renderToHTML = "NextNodeServer.renderToHTML", e10.renderError = "NextNodeServer.renderError", e10.renderErrorToHTML = "NextNodeServer.renderErrorToHTML", e10.render404 = "NextNodeServer.render404", e10.startResponse = "NextNodeServer.startResponse", e10.route = "route", e10.onProxyReq = "onProxyReq", e10.apiResolver = "apiResolver", e10.internalFetch = "internalFetch";
      }(ac || (ac = {})), (au || (au = {})).startServer = "startServer.startServer", function(e10) {
        e10.getServerSideProps = "Render.getServerSideProps", e10.getStaticProps = "Render.getStaticProps", e10.renderToString = "Render.renderToString", e10.renderDocument = "Render.renderDocument", e10.createBodyResult = "Render.createBodyResult";
      }(ad || (ad = {})), function(e10) {
        e10.renderToString = "AppRender.renderToString", e10.renderToReadableStream = "AppRender.renderToReadableStream", e10.getBodyResult = "AppRender.getBodyResult", e10.fetch = "AppRender.fetch";
      }(ah || (ah = {})), (ap || (ap = {})).executeRoute = "Router.executeRoute", (af || (af = {})).runHandler = "Node.runHandler", (ag || (ag = {})).runHandler = "AppRouteRouteHandlers.runHandler", function(e10) {
        e10.generateMetadata = "ResolveMetadata.generateMetadata", e10.generateViewport = "ResolveMetadata.generateViewport";
      }(am || (am = {})), (ay || (ay = {})).execute = "Middleware.execute";
      let Q = ["Middleware.execute", "BaseServer.handleRequest", "Render.getServerSideProps", "Render.getStaticProps", "AppRender.fetch", "AppRender.getBodyResult", "Render.renderDocument", "Node.runHandler", "AppRouteRouteHandlers.runHandler", "ResolveMetadata.generateMetadata", "ResolveMetadata.generateViewport", "NextNodeServer.createComponentTree", "NextNodeServer.findPageComponents", "NextNodeServer.getLayoutOrPageModule", "NextNodeServer.startResponse", "NextNodeServer.clientComponentLoading"], Z = ["NextNodeServer.findPageComponents", "NextNodeServer.createComponentTree", "NextNodeServer.clientComponentLoading"], { context: ee, propagation: et, trace: er, SpanStatusCode: en, SpanKind: ei, ROOT_CONTEXT: es } = n = r(692), ea = (e10) => null !== e10 && "object" == typeof e10 && "function" == typeof e10.then, eo = (e10, t10) => {
        (null == t10 ? void 0 : t10.bubble) === true ? e10.setAttribute("next.bubble", true) : (t10 && e10.recordException(t10), e10.setStatus({ code: en.ERROR, message: null == t10 ? void 0 : t10.message })), e10.end();
      }, el = /* @__PURE__ */ new Map(), ec = n.createContextKey("next.rootSpanId"), eu = 0, ed = () => eu++;
      class eh {
        getTracerInstance() {
          return er.getTracer("next.js", "0.0.1");
        }
        getContext() {
          return ee;
        }
        getActiveScopeSpan() {
          return er.getSpan(null == ee ? void 0 : ee.active());
        }
        withPropagatedContext(e10, t10, r10) {
          let n10 = ee.active();
          if (er.getSpanContext(n10)) return t10();
          let i10 = et.extract(n10, e10, r10);
          return ee.with(i10, t10);
        }
        trace(...e10) {
          var t10;
          let [r10, n10, i10] = e10, { fn: s10, options: a10 } = "function" == typeof n10 ? { fn: n10, options: {} } : { fn: i10, options: { ...n10 } }, o10 = a10.spanName ?? r10;
          if (!Q.includes(r10) && "1" !== process.env.NEXT_OTEL_VERBOSE || a10.hideSpan) return s10();
          let l2 = this.getSpanContext((null == a10 ? void 0 : a10.parentSpan) ?? this.getActiveScopeSpan()), c2 = false;
          l2 ? (null == (t10 = er.getSpanContext(l2)) ? void 0 : t10.isRemote) && (c2 = true) : (l2 = (null == ee ? void 0 : ee.active()) ?? es, c2 = true);
          let u2 = ed();
          return a10.attributes = { "next.span_name": o10, "next.span_type": r10, ...a10.attributes }, ee.with(l2.setValue(ec, u2), () => this.getTracerInstance().startActiveSpan(o10, a10, (e11) => {
            let t11 = "performance" in globalThis ? globalThis.performance.now() : void 0, n11 = () => {
              el.delete(u2), t11 && process.env.NEXT_OTEL_PERFORMANCE_PREFIX && Z.includes(r10 || "") && performance.measure(`${process.env.NEXT_OTEL_PERFORMANCE_PREFIX}:next-${(r10.split(".").pop() || "").replace(/[A-Z]/g, (e12) => "-" + e12.toLowerCase())}`, { start: t11, end: performance.now() });
            };
            c2 && el.set(u2, new Map(Object.entries(a10.attributes ?? {})));
            try {
              if (s10.length > 1) return s10(e11, (t13) => eo(e11, t13));
              let t12 = s10(e11);
              if (ea(t12)) return t12.then((t13) => (e11.end(), t13)).catch((t13) => {
                throw eo(e11, t13), t13;
              }).finally(n11);
              return e11.end(), n11(), t12;
            } catch (t12) {
              throw eo(e11, t12), n11(), t12;
            }
          }));
        }
        wrap(...e10) {
          let t10 = this, [r10, n10, i10] = 3 === e10.length ? e10 : [e10[0], {}, e10[1]];
          return Q.includes(r10) || "1" === process.env.NEXT_OTEL_VERBOSE ? function() {
            let e11 = n10;
            "function" == typeof e11 && "function" == typeof i10 && (e11 = e11.apply(this, arguments));
            let s10 = arguments.length - 1, a10 = arguments[s10];
            if ("function" != typeof a10) return t10.trace(r10, e11, () => i10.apply(this, arguments));
            {
              let n11 = t10.getContext().bind(ee.active(), a10);
              return t10.trace(r10, e11, (e12, t11) => (arguments[s10] = function(e13) {
                return null == t11 || t11(e13), n11.apply(this, arguments);
              }, i10.apply(this, arguments)));
            }
          } : i10;
        }
        startSpan(...e10) {
          let [t10, r10] = e10, n10 = this.getSpanContext((null == r10 ? void 0 : r10.parentSpan) ?? this.getActiveScopeSpan());
          return this.getTracerInstance().startSpan(t10, r10, n10);
        }
        getSpanContext(e10) {
          return e10 ? er.setSpan(ee.active(), e10) : void 0;
        }
        getRootSpanAttributes() {
          let e10 = ee.active().getValue(ec);
          return el.get(e10);
        }
      }
      let ep = (() => {
        let e10 = new eh();
        return () => e10;
      })(), ef = "__prerender_bypass";
      Symbol("__next_preview_data"), Symbol(ef);
      class eg {
        constructor(e10, t10, r10, n10) {
          var i10;
          let s10 = e10 && function(e11, t11) {
            let r11 = X.h.from(e11.headers);
            return { isOnDemandRevalidate: r11.get("x-prerender-revalidate") === t11.previewModeId, revalidateOnlyGenerated: r11.has("x-prerender-revalidate-if-generated") };
          }(t10, e10).isOnDemandRevalidate, a10 = null == (i10 = r10.get(ef)) ? void 0 : i10.value;
          this.isEnabled = !!(!s10 && a10 && e10 && a10 === e10.previewModeId), this._previewModeId = null == e10 ? void 0 : e10.previewModeId, this._mutableCookies = n10;
        }
        enable() {
          if (!this._previewModeId) throw Error("Invariant: previewProps missing previewModeId this should never happen");
          this._mutableCookies.set({ name: ef, value: this._previewModeId, httpOnly: true, sameSite: "none", secure: true, path: "/" });
        }
        disable() {
          this._mutableCookies.set({ name: ef, value: "", httpOnly: true, sameSite: "none", secure: true, path: "/", expires: /* @__PURE__ */ new Date(0) });
        }
      }
      let em = { wrap(e10, { req: t10, res: r10, renderOpts: n10 }, i10) {
        let s10;
        function a10(e11) {
          r10 && r10.setHeader("Set-Cookie", e11);
        }
        n10 && "previewProps" in n10 && (s10 = n10.previewProps);
        let o10 = {}, l2 = { get headers() {
          return o10.headers || (o10.headers = function(e11) {
            let t11 = X.h.from(e11);
            for (let e12 of z) t11.delete(e12.toString().toLowerCase());
            return X.h.seal(t11);
          }(t10.headers)), o10.headers;
        }, get cookies() {
          return o10.cookies || (o10.cookies = function(e11) {
            let t11 = new L.q(X.h.from(e11));
            return Y.Qb.seal(t11);
          }(t10.headers)), o10.cookies;
        }, get mutableCookies() {
          return o10.mutableCookies || (o10.mutableCookies = function(e11, t11) {
            let r11 = new L.q(X.h.from(e11));
            return Y.vr.wrap(r11, t11);
          }(t10.headers, (null == n10 ? void 0 : n10.onUpdateCookies) || (r10 ? a10 : void 0))), o10.mutableCookies;
        }, get draftMode() {
          return o10.draftMode || (o10.draftMode = new eg(s10, t10, this.cookies, this.mutableCookies)), o10.draftMode;
        }, reactLoadableManifest: (null == n10 ? void 0 : n10.reactLoadableManifest) || {}, assetPrefix: (null == n10 ? void 0 : n10.assetPrefix) || "" };
        return e10.run(l2, i10, l2);
      } };
      var ey = r(369);
      class eb extends D {
        constructor(e10) {
          super(e10.input, e10.init), this.sourcePage = e10.page;
        }
        get request() {
          throw new m({ page: this.sourcePage });
        }
        respondWith() {
          throw new m({ page: this.sourcePage });
        }
        waitUntil() {
          throw new m({ page: this.sourcePage });
        }
      }
      let e_ = { keys: (e10) => Array.from(e10.keys()), get: (e10, t10) => e10.get(t10) ?? void 0 }, ev = (e10, t10) => ep().withPropagatedContext(e10.headers, t10, e_), ew = false;
      async function ek(e10) {
        let t10, n10;
        !function() {
          if (!ew && (ew = true, "true" === process.env.NEXT_PRIVATE_TEST_PROXY)) {
            let { interceptTestApis: e11, wrapRequestHandler: t11 } = r(311);
            e11(), ev = t11(ev);
          }
        }(), await f();
        let i10 = void 0 !== self.__BUILD_MANIFEST, s10 = "string" == typeof self.__PRERENDER_MANIFEST ? JSON.parse(self.__PRERENDER_MANIFEST) : void 0;
        e10.request.url = e10.request.url.replace(/\.rsc($|\?)/, "$1");
        let a10 = new M(e10.request.url, { headers: e10.request.headers, nextConfig: e10.request.nextConfig });
        for (let e11 of [...a10.searchParams.keys()]) {
          let t11 = a10.searchParams.getAll(e11);
          if (e11 !== W && e11.startsWith(W)) {
            let r10 = e11.substring(W.length);
            for (let e12 of (a10.searchParams.delete(r10), t11)) a10.searchParams.append(r10, e12);
            a10.searchParams.delete(e11);
          }
        }
        let o10 = a10.buildId;
        a10.buildId = "";
        let l2 = e10.request.headers["x-nextjs-data"];
        l2 && "/index" === a10.pathname && (a10.pathname = "/");
        let c2 = function(e11) {
          let t11 = new Headers();
          for (let [r10, n11] of Object.entries(e11)) for (let e12 of Array.isArray(n11) ? n11 : [n11]) void 0 !== e12 && ("number" == typeof e12 && (e12 = e12.toString()), t11.append(r10, e12));
          return t11;
        }(e10.request.headers), u2 = /* @__PURE__ */ new Map();
        if (!i10) for (let e11 of z) {
          let t11 = e11.toString().toLowerCase();
          c2.get(t11) && (u2.set(t11, c2.get(t11)), c2.delete(t11));
        }
        let d2 = new eb({ page: e10.page, input: function(e11, t11) {
          let r10 = "string" == typeof e11, n11 = r10 ? new URL(e11) : e11;
          for (let e12 of J) n11.searchParams.delete(e12);
          if (t11) for (let e12 of V) n11.searchParams.delete(e12);
          return r10 ? n11.toString() : n11;
        }(a10, true).toString(), init: { body: e10.request.body, geo: e10.request.geo, headers: c2, ip: e10.request.ip, method: e10.request.method, nextConfig: e10.request.nextConfig, signal: e10.request.signal } });
        l2 && Object.defineProperty(d2, "__isData", { enumerable: false, value: true }), !globalThis.__incrementalCache && e10.IncrementalCache && (globalThis.__incrementalCache = new e10.IncrementalCache({ appDir: true, fetchCache: true, minimalMode: true, fetchCacheKeyPrefix: "", dev: false, requestHeaders: e10.request.headers, requestProtocol: "https", getPrerenderManifest: () => ({ version: -1, routes: {}, dynamicRoutes: {}, notFoundRoutes: [], preview: { previewModeId: "development-id" } }) }));
        let h2 = new x({ request: d2, page: e10.page });
        if ((t10 = await ev(d2, () => "/middleware" === e10.page || "/src/middleware" === e10.page ? ep().trace(ay.execute, { spanName: `middleware ${d2.method} ${d2.nextUrl.pathname}`, attributes: { "http.target": d2.nextUrl.pathname, "http.method": d2.method } }, () => em.wrap(ey.O, { req: d2, renderOpts: { onUpdateCookies: (e11) => {
          n10 = e11;
        }, previewProps: (null == s10 ? void 0 : s10.preview) || { previewModeId: "development-id", previewModeEncryptionKey: "", previewModeSigningKey: "" } } }, () => e10.handler(d2, h2))) : e10.handler(d2, h2))) && !(t10 instanceof Response)) throw TypeError("Expected an instance of Response to be returned");
        t10 && n10 && t10.headers.set("set-cookie", n10);
        let p2 = null == t10 ? void 0 : t10.headers.get("x-middleware-rewrite");
        if (t10 && p2) {
          let r10 = new M(p2, { forceLocale: true, headers: e10.request.headers, nextConfig: e10.request.nextConfig });
          r10.host === d2.nextUrl.host && (r10.buildId = o10 || r10.buildId, t10.headers.set("x-middleware-rewrite", String(r10)));
          let n11 = $(String(r10), String(a10));
          l2 && t10.headers.set("x-nextjs-rewrite", n11);
        }
        let g2 = null == t10 ? void 0 : t10.headers.get("Location");
        if (t10 && g2 && !i10) {
          let r10 = new M(g2, { forceLocale: false, headers: e10.request.headers, nextConfig: e10.request.nextConfig });
          t10 = new Response(t10.body, t10), r10.host === d2.nextUrl.host && (r10.buildId = o10 || r10.buildId, t10.headers.set("Location", String(r10))), l2 && (t10.headers.delete("Location"), t10.headers.set("x-nextjs-redirect", $(String(r10), String(a10))));
        }
        let m2 = t10 || K.next(), y2 = m2.headers.get("x-middleware-override-headers"), b2 = [];
        if (y2) {
          for (let [e11, t11] of u2) m2.headers.set(`x-middleware-request-${e11}`, t11), b2.push(e11);
          b2.length > 0 && m2.headers.set("x-middleware-override-headers", y2 + "," + b2.join(","));
        }
        return { response: m2, waitUntil: Promise.all(h2[S]), fetchMetrics: d2.fetchMetrics };
      }
      function eS(e10) {
        return e10.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
      }
      function eT(e10) {
        return e10 && e10.sensitive ? "" : "i";
      }
      function ex(e10, t10, r10) {
        var n10;
        return e10 instanceof RegExp ? function(e11, t11) {
          if (!t11) return e11;
          for (var r11 = /\((?:\?<(.*?)>)?(?!\?)/g, n11 = 0, i10 = r11.exec(e11.source); i10; ) t11.push({ name: i10[1] || n11++, prefix: "", suffix: "", modifier: "", pattern: "" }), i10 = r11.exec(e11.source);
          return e11;
        }(e10, t10) : Array.isArray(e10) ? (n10 = e10.map(function(e11) {
          return ex(e11, t10, r10).source;
        }), new RegExp("(?:".concat(n10.join("|"), ")"), eT(r10))) : function(e11, t11, r11) {
          void 0 === r11 && (r11 = {});
          for (var n11 = r11.strict, i10 = void 0 !== n11 && n11, s10 = r11.start, a10 = r11.end, o10 = r11.encode, l2 = void 0 === o10 ? function(e12) {
            return e12;
          } : o10, c2 = r11.delimiter, u2 = r11.endsWith, d2 = "[".concat(eS(void 0 === u2 ? "" : u2), "]|$"), h2 = "[".concat(eS(void 0 === c2 ? "/#?" : c2), "]"), p2 = void 0 === s10 || s10 ? "^" : "", f2 = 0; f2 < e11.length; f2++) {
            var g2 = e11[f2];
            if ("string" == typeof g2) p2 += eS(l2(g2));
            else {
              var m2 = eS(l2(g2.prefix)), y2 = eS(l2(g2.suffix));
              if (g2.pattern) {
                if (t11 && t11.push(g2), m2 || y2) {
                  if ("+" === g2.modifier || "*" === g2.modifier) {
                    var b2 = "*" === g2.modifier ? "?" : "";
                    p2 += "(?:".concat(m2, "((?:").concat(g2.pattern, ")(?:").concat(y2).concat(m2, "(?:").concat(g2.pattern, "))*)").concat(y2, ")").concat(b2);
                  } else p2 += "(?:".concat(m2, "(").concat(g2.pattern, ")").concat(y2, ")").concat(g2.modifier);
                } else {
                  if ("+" === g2.modifier || "*" === g2.modifier) throw TypeError('Can not repeat "'.concat(g2.name, '" without a prefix and suffix'));
                  p2 += "(".concat(g2.pattern, ")").concat(g2.modifier);
                }
              } else p2 += "(?:".concat(m2).concat(y2, ")").concat(g2.modifier);
            }
          }
          if (void 0 === a10 || a10) i10 || (p2 += "".concat(h2, "?")), p2 += r11.endsWith ? "(?=".concat(d2, ")") : "$";
          else {
            var _2 = e11[e11.length - 1], v2 = "string" == typeof _2 ? h2.indexOf(_2[_2.length - 1]) > -1 : void 0 === _2;
            i10 || (p2 += "(?:".concat(h2, "(?=").concat(d2, "))?")), v2 || (p2 += "(?=".concat(h2, "|").concat(d2, ")"));
          }
          return new RegExp(p2, eT(r11));
        }(function(e11, t11) {
          void 0 === t11 && (t11 = {});
          for (var r11 = function(e12) {
            for (var t12 = [], r12 = 0; r12 < e12.length; ) {
              var n12 = e12[r12];
              if ("*" === n12 || "+" === n12 || "?" === n12) {
                t12.push({ type: "MODIFIER", index: r12, value: e12[r12++] });
                continue;
              }
              if ("\\" === n12) {
                t12.push({ type: "ESCAPED_CHAR", index: r12++, value: e12[r12++] });
                continue;
              }
              if ("{" === n12) {
                t12.push({ type: "OPEN", index: r12, value: e12[r12++] });
                continue;
              }
              if ("}" === n12) {
                t12.push({ type: "CLOSE", index: r12, value: e12[r12++] });
                continue;
              }
              if (":" === n12) {
                for (var i11 = "", s11 = r12 + 1; s11 < e12.length; ) {
                  var a11 = e12.charCodeAt(s11);
                  if (a11 >= 48 && a11 <= 57 || a11 >= 65 && a11 <= 90 || a11 >= 97 && a11 <= 122 || 95 === a11) {
                    i11 += e12[s11++];
                    continue;
                  }
                  break;
                }
                if (!i11) throw TypeError("Missing parameter name at ".concat(r12));
                t12.push({ type: "NAME", index: r12, value: i11 }), r12 = s11;
                continue;
              }
              if ("(" === n12) {
                var o11 = 1, l3 = "", s11 = r12 + 1;
                if ("?" === e12[s11]) throw TypeError('Pattern cannot start with "?" at '.concat(s11));
                for (; s11 < e12.length; ) {
                  if ("\\" === e12[s11]) {
                    l3 += e12[s11++] + e12[s11++];
                    continue;
                  }
                  if (")" === e12[s11]) {
                    if (0 == --o11) {
                      s11++;
                      break;
                    }
                  } else if ("(" === e12[s11] && (o11++, "?" !== e12[s11 + 1])) throw TypeError("Capturing groups are not allowed at ".concat(s11));
                  l3 += e12[s11++];
                }
                if (o11) throw TypeError("Unbalanced pattern at ".concat(r12));
                if (!l3) throw TypeError("Missing pattern at ".concat(r12));
                t12.push({ type: "PATTERN", index: r12, value: l3 }), r12 = s11;
                continue;
              }
              t12.push({ type: "CHAR", index: r12, value: e12[r12++] });
            }
            return t12.push({ type: "END", index: r12, value: "" }), t12;
          }(e11), n11 = t11.prefixes, i10 = void 0 === n11 ? "./" : n11, s10 = t11.delimiter, a10 = void 0 === s10 ? "/#?" : s10, o10 = [], l2 = 0, c2 = 0, u2 = "", d2 = function(e12) {
            if (c2 < r11.length && r11[c2].type === e12) return r11[c2++].value;
          }, h2 = function(e12) {
            var t12 = d2(e12);
            if (void 0 !== t12) return t12;
            var n12 = r11[c2], i11 = n12.type, s11 = n12.index;
            throw TypeError("Unexpected ".concat(i11, " at ").concat(s11, ", expected ").concat(e12));
          }, p2 = function() {
            for (var e12, t12 = ""; e12 = d2("CHAR") || d2("ESCAPED_CHAR"); ) t12 += e12;
            return t12;
          }, f2 = function(e12) {
            for (var t12 = 0; t12 < a10.length; t12++) {
              var r12 = a10[t12];
              if (e12.indexOf(r12) > -1) return true;
            }
            return false;
          }, g2 = function(e12) {
            var t12 = o10[o10.length - 1], r12 = e12 || (t12 && "string" == typeof t12 ? t12 : "");
            if (t12 && !r12) throw TypeError('Must have text between two parameters, missing text after "'.concat(t12.name, '"'));
            return !r12 || f2(r12) ? "[^".concat(eS(a10), "]+?") : "(?:(?!".concat(eS(r12), ")[^").concat(eS(a10), "])+?");
          }; c2 < r11.length; ) {
            var m2 = d2("CHAR"), y2 = d2("NAME"), b2 = d2("PATTERN");
            if (y2 || b2) {
              var _2 = m2 || "";
              -1 === i10.indexOf(_2) && (u2 += _2, _2 = ""), u2 && (o10.push(u2), u2 = ""), o10.push({ name: y2 || l2++, prefix: _2, suffix: "", pattern: b2 || g2(_2), modifier: d2("MODIFIER") || "" });
              continue;
            }
            var v2 = m2 || d2("ESCAPED_CHAR");
            if (v2) {
              u2 += v2;
              continue;
            }
            if (u2 && (o10.push(u2), u2 = ""), d2("OPEN")) {
              var _2 = p2(), w2 = d2("NAME") || "", k2 = d2("PATTERN") || "", S2 = p2();
              h2("CLOSE"), o10.push({ name: w2 || (k2 ? l2++ : ""), pattern: w2 && !k2 ? g2(_2) : k2, prefix: _2, suffix: S2, modifier: d2("MODIFIER") || "" });
              continue;
            }
            h2("END");
          }
          return o10;
        }(e10, r10), t10, r10);
      }
      let eE = (e10) => {
        try {
          return ex(e10);
        } catch (t10) {
          throw Error(`Invalid path: ${e10}.
Consult the documentation of path-to-regexp here: https://github.com/pillarjs/path-to-regexp/tree/6.x
${t10.message}`);
        }
      }, eO = (e10) => e10.map((e11) => e11 instanceof RegExp ? e11 : eE(e11)), eC = (e10) => {
        let t10 = eO([e10 || ""].flat().filter(Boolean));
        return (e11) => t10.some((t11) => t11.test(e11));
      }, eI = () => false, eP = () => {
        try {
          return true;
        } catch {
        }
        return false;
      }, eA = /* @__PURE__ */ new Set(), eR = (e10, t10, r10) => {
        let n10 = eI() || eP(), i10 = r10 ?? e10;
        eA.has(i10) || n10 || (eA.add(i10), console.warn(`Clerk - DEPRECATION WARNING: "${e10}" is deprecated and will be removed in the next major release.
${t10}`));
      }, eN = [".lcl.dev", ".lclstage.dev", ".lclclerk.com"], eU = [".accounts.dev", ".accountsstage.dev", ".accounts.lclclerk.com"], eM = [".lcl.dev", ".stg.dev", ".lclstage.dev", ".stgstage.dev", ".dev.lclclerk.com", ".stg.lclclerk.com", ".accounts.lclclerk.com", "accountsstage.dev", "accounts.dev"], eL = [".lcl.dev", "lclstage.dev", ".lclclerk.com", ".accounts.lclclerk.com"], eq = [".accountsstage.dev"], eD = "https://api.clerk.com", ej = "https://frontend-api.clerk.dev", eB = "/__clerk", eH = (e10) => "undefined" != typeof atob && "function" == typeof atob ? atob(e10) : void 0 !== globalThis.Buffer ? globalThis.Buffer.from(e10, "base64").toString() : e10, eK = (e10) => "undefined" != typeof btoa && "function" == typeof btoa ? btoa(e10) : void 0 !== globalThis.Buffer ? globalThis.Buffer.from(e10).toString("base64") : e10, e$ = "pk_live_";
      function ez(e10) {
        if (!e10.endsWith("$")) return false;
        let t10 = e10.slice(0, -1);
        return !t10.includes("$") && t10.includes(".");
      }
      function eF(e10, t10 = {}) {
        let r10;
        if (!(e10 = e10 || "") || !eJ(e10)) {
          if (t10.fatal && !e10) throw Error("Publishable key is missing. Ensure that your publishable key is correctly configured. Double-check your environment configuration for your keys, or access them here: https://dashboard.clerk.com/last-active?path=api-keys");
          if (t10.fatal && !eJ(e10)) throw Error("Publishable key not valid.");
          return null;
        }
        let n10 = e10.startsWith(e$) ? "production" : "development";
        try {
          r10 = eH(e10.split("_")[2]);
        } catch {
          if (t10.fatal) throw Error("Publishable key not valid: Failed to decode key.");
          return null;
        }
        if (!ez(r10)) {
          if (t10.fatal) throw Error("Publishable key not valid: Decoded key has invalid format.");
          return null;
        }
        let i10 = r10.slice(0, -1);
        return t10.proxyUrl ? i10 = t10.proxyUrl : "development" !== n10 && t10.domain && t10.isSatellite && (i10 = `clerk.${t10.domain}`), { instanceType: n10, frontendApi: i10 };
      }
      function eJ(e10 = "") {
        try {
          if (!(e10.startsWith(e$) || e10.startsWith("pk_test_"))) return false;
          let t10 = e10.split("_");
          if (3 !== t10.length) return false;
          let r10 = t10[2];
          if (!r10) return false;
          return ez(eH(r10));
        } catch {
          return false;
        }
      }
      function eV(e10) {
        return e10.startsWith("test_") || e10.startsWith("sk_test_");
      }
      async function eW(e10, t10 = globalThis.crypto.subtle) {
        let r10 = new TextEncoder().encode(e10);
        return eK(String.fromCharCode(...new Uint8Array(await t10.digest("sha-1", r10)))).replace(/\+/gi, "-").replace(/\//gi, "_").substring(0, 8);
      }
      let eG = (e10, t10) => `${e10}_${t10}`, eX = { initialDelay: 125, maxDelayBetweenRetries: 0, factor: 2, shouldRetry: (e10, t10) => t10 < 5, retryImmediately: false, jitter: true }, eY = async (e10) => new Promise((t10) => setTimeout(t10, e10)), eQ = (e10, t10) => t10 ? e10 * (1 + Math.random()) : e10, eZ = (e10) => {
        let t10 = 0, r10 = () => {
          let r11 = e10.initialDelay * Math.pow(e10.factor, t10);
          return r11 = eQ(r11, e10.jitter), Math.min(e10.maxDelayBetweenRetries || r11, r11);
        };
        return async () => {
          await eY(r10()), t10++;
        };
      }, e0 = async (e10, t10 = {}) => {
        let r10 = 0, { shouldRetry: n10, initialDelay: i10, maxDelayBetweenRetries: s10, factor: a10, retryImmediately: o10, jitter: l2, onBeforeRetry: c2 } = { ...eX, ...t10 }, u2 = eZ({ initialDelay: i10, maxDelayBetweenRetries: s10, factor: a10, jitter: l2 });
        for (; ; ) try {
          return await e10();
        } catch (e11) {
          if (!n10(e11, ++r10)) throw e11;
          c2 && await c2(r10), o10 && 1 === r10 ? await eY(eQ(100, l2)) : await u2();
        }
      };
      function e1(e10) {
        return function(t10) {
          let r10 = t10 ?? this;
          if (!r10) throw TypeError(`${e10.kind || e10.name} type guard requires an error object`);
          return !!e10.kind && "object" == typeof r10 && null !== r10 && "constructor" in r10 && r10.constructor?.kind === e10.kind || r10 instanceof e10;
        };
      }
      var e2 = class e10 extends Error {
        static kind = "ClerkError";
        clerkError = true;
        code;
        longMessage;
        docsUrl;
        cause;
        get name() {
          return this.constructor.name;
        }
        constructor(t10) {
          super(new.target.formatMessage(new.target.kind, t10.message, t10.code, t10.docsUrl), { cause: t10.cause }), Object.setPrototypeOf(this, e10.prototype), this.code = t10.code, this.docsUrl = t10.docsUrl, this.longMessage = t10.longMessage, this.cause = t10.cause;
        }
        toString() {
          return `[${this.name}]
Message:${this.message}`;
        }
        static formatMessage(e11, t10, r10, n10) {
          let i10 = "Clerk:", s10 = RegExp(i10.replace(" ", "\\s*"), "i");
          return t10 = t10.replace(s10, ""), t10 = `${i10} ${t10.trim()}

(code="${r10}")

`, n10 && (t10 += `

Docs: ${n10}`), t10;
        }
      };
      e1(class e10 extends e2 {
        static kind = "ClerkRuntimeError";
        clerkRuntimeError = true;
        constructor(t10, r10) {
          super({ ...r10, message: t10 }), Object.setPrototypeOf(this, e10.prototype);
        }
      });
      var e4 = class {
        static kind = "ClerkAPIError";
        code;
        message;
        longMessage;
        meta;
        constructor(e10) {
          let t10 = { code: e10.code, message: e10.message, longMessage: e10.long_message, meta: { paramName: e10.meta?.param_name, sessionId: e10.meta?.session_id, emailAddresses: e10.meta?.email_addresses, identifiers: e10.meta?.identifiers, zxcvbn: e10.meta?.zxcvbn, plan: e10.meta?.plan, isPlanUpgradePossible: e10.meta?.is_plan_upgrade_possible } };
          this.code = t10.code, this.message = t10.message, this.longMessage = t10.longMessage, this.meta = t10.meta;
        }
      };
      function e3(e10) {
        return new e4(e10);
      }
      e1(e4);
      var e5 = class e10 extends e2 {
        static kind = "ClerkAPIResponseError";
        status;
        clerkTraceId;
        retryAfter;
        errors;
        constructor(t10, r10) {
          let { data: n10, status: i10, clerkTraceId: s10, retryAfter: a10 } = r10;
          super({ ...r10, message: t10, code: "api_response_error" }), Object.setPrototypeOf(this, e10.prototype), this.status = i10, this.clerkTraceId = s10, this.retryAfter = a10, this.errors = (n10 || []).map((e11) => new e4(e11));
        }
        toString() {
          let e11 = `[${this.name}]
Message:${this.message}
Status:${this.status}
Serialized errors: ${this.errors.map((e12) => JSON.stringify(e12))}`;
          return this.clerkTraceId && (e11 += `
Clerk Trace ID: ${this.clerkTraceId}`), e11;
        }
        static formatMessage(e11, t10, r10, n10) {
          return t10;
        }
      };
      let e6 = e1(e5), e8 = Object.freeze({ InvalidProxyUrlErrorMessage: "The proxyUrl passed to Clerk is invalid. The expected value for proxyUrl is an absolute URL or a relative path with a leading '/'. (key={{url}})", InvalidPublishableKeyErrorMessage: "The publishableKey passed to Clerk is invalid. You can get your Publishable key at https://dashboard.clerk.com/last-active?path=api-keys. (key={{key}})", MissingPublishableKeyErrorMessage: "Missing publishableKey. You can get your key at https://dashboard.clerk.com/last-active?path=api-keys.", MissingSecretKeyErrorMessage: "Missing secretKey. You can get your key at https://dashboard.clerk.com/last-active?path=api-keys.", MissingClerkProvider: "{{source}} can only be used within the <ClerkProvider /> component. Learn more: https://clerk.com/docs/components/clerk-provider" });
      function e9({ packageName: e10, customMessages: t10 }) {
        let r10 = e10;
        function n10(e11, t11) {
          if (!t11) return `${r10}: ${e11}`;
          let n11 = e11;
          for (let r11 of e11.matchAll(/{{([a-zA-Z0-9-_]+)}}/g)) {
            let e12 = (t11[r11[1]] || "").toString();
            n11 = n11.replace(`{{${r11[1]}}}`, e12);
          }
          return `${r10}: ${n11}`;
        }
        let i10 = { ...e8, ...t10 };
        return { setPackageName({ packageName: e11 }) {
          return "string" == typeof e11 && (r10 = e11), this;
        }, setMessages({ customMessages: e11 }) {
          return Object.assign(i10, e11 || {}), this;
        }, throwInvalidPublishableKeyError(e11) {
          throw Error(n10(i10.InvalidPublishableKeyErrorMessage, e11));
        }, throwInvalidProxyUrl(e11) {
          throw Error(n10(i10.InvalidProxyUrlErrorMessage, e11));
        }, throwMissingPublishableKeyError() {
          throw Error(n10(i10.MissingPublishableKeyErrorMessage));
        }, throwMissingSecretKeyError() {
          throw Error(n10(i10.MissingSecretKeyErrorMessage));
        }, throwMissingClerkProviderError(e11) {
          throw Error(n10(i10.MissingClerkProvider, e11));
        }, throw(e11) {
          throw Error(n10(e11));
        } };
      }
      var e7 = e9({ packageName: "@clerk/backend" }), { isDevOrStagingUrl: te } = /* @__PURE__ */ function() {
        let e10 = /* @__PURE__ */ new Map();
        return { isDevOrStagingUrl: (t10) => {
          if (!t10) return false;
          let r10 = "string" == typeof t10 ? t10 : t10.hostname, n10 = e10.get(r10);
          return void 0 === n10 && (n10 = eM.some((e11) => r10.endsWith(e11)), e10.set(r10, n10)), n10;
        } };
      }(), tt = { InvalidSecretKey: "clerk_key_invalid" }, tr = { TokenExpired: "token-expired", TokenInvalid: "token-invalid", TokenInvalidAlgorithm: "token-invalid-algorithm", TokenInvalidAuthorizedParties: "token-invalid-authorized-parties", TokenInvalidSignature: "token-invalid-signature", TokenNotActiveYet: "token-not-active-yet", TokenIatInTheFuture: "token-iat-in-the-future", TokenVerificationFailed: "token-verification-failed", InvalidSecretKey: "secret-key-invalid", LocalJWKMissing: "jwk-local-missing", RemoteJWKFailedToLoad: "jwk-remote-failed-to-load", JWKFailedToResolve: "jwk-failed-to-resolve", JWKKidMismatch: "jwk-kid-mismatch" }, tn = { ContactSupport: "Contact support@clerk.com", EnsureClerkJWT: "Make sure that this is a valid Clerk-generated JWT.", SetClerkJWTKey: "Set the CLERK_JWT_KEY environment variable.", SetClerkSecretKey: "Set the CLERK_SECRET_KEY environment variable." }, ti = class e10 extends Error {
        constructor({ action: t10, message: r10, reason: n10 }) {
          super(r10), Object.setPrototypeOf(this, e10.prototype), this.reason = n10, this.message = r10, this.action = t10;
        }
        getFullMessage() {
          return `${[this.message, this.action].filter((e11) => e11).join(" ")} (reason=${this.reason}, token-carrier=${this.tokenCarrier})`;
        }
      }, ts = { TokenInvalid: "token-invalid", InvalidSecretKey: "secret-key-invalid", UnexpectedError: "unexpected-error", TokenVerificationFailed: "token-verification-failed" }, ta = class e10 extends e2 {
        constructor({ message: t10, code: r10, status: n10, action: i10 }) {
          super({ message: t10, code: r10 }), Object.setPrototypeOf(this, e10.prototype), this.status = n10, this.action = i10;
        }
        static formatMessage(e11, t10, r10, n10) {
          return t10;
        }
        getFullMessage() {
          return `${this.message} (code=${this.code}, status=${this.status || "n/a"})`;
        }
      };
      ta.kind = "MachineTokenVerificationError";
      let to = crypto;
      var tl = fetch.bind(globalThis), tc = { crypto: to, get fetch() {
        return tl;
      }, AbortController: globalThis.AbortController, Blob: globalThis.Blob, FormData: globalThis.FormData, Headers: globalThis.Headers, Request: globalThis.Request, Response: globalThis.Response }, tu = { parse: (e10, t10) => function(e11, t11, r10 = {}) {
        if (!t11.codes) {
          t11.codes = {};
          for (let e12 = 0; e12 < t11.chars.length; ++e12) t11.codes[t11.chars[e12]] = e12;
        }
        if (!r10.loose && e11.length * t11.bits & 7) throw SyntaxError("Invalid padding");
        let n10 = e11.length;
        for (; "=" === e11[n10 - 1]; ) if (--n10, !r10.loose && !((e11.length - n10) * t11.bits & 7)) throw SyntaxError("Invalid padding");
        let i10 = new (r10.out ?? Uint8Array)(n10 * t11.bits / 8 | 0), s10 = 0, a10 = 0, o10 = 0;
        for (let r11 = 0; r11 < n10; ++r11) {
          let n11 = t11.codes[e11[r11]];
          if (void 0 === n11) throw SyntaxError("Invalid character " + e11[r11]);
          a10 = a10 << t11.bits | n11, (s10 += t11.bits) >= 8 && (s10 -= 8, i10[o10++] = 255 & a10 >> s10);
        }
        if (s10 >= t11.bits || 255 & a10 << 8 - s10) throw SyntaxError("Unexpected end of data");
        return i10;
      }(e10, td, t10) }, td = { chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_", bits: 6 }, th = { RS256: "SHA-256", RS384: "SHA-384", RS512: "SHA-512" }, tp = "RSASSA-PKCS1-v1_5", tf = { RS256: tp, RS384: tp, RS512: tp }, tg = Object.keys(th), tm = (e10) => Array.isArray(e10) && e10.length > 0 && e10.every((e11) => "string" == typeof e11), ty = (e10, t10) => {
        let r10 = [t10].flat().filter((e11) => !!e11), n10 = [e10].flat().filter((e11) => !!e11);
        if (r10.length > 0 && n10.length > 0) {
          if ("string" == typeof e10) {
            if (!r10.includes(e10)) throw new ti({ action: tn.EnsureClerkJWT, reason: tr.TokenVerificationFailed, message: `Invalid JWT audience claim (aud) ${JSON.stringify(e10)}. Is not included in "${JSON.stringify(r10)}".` });
          } else if (tm(e10) && !e10.some((e11) => r10.includes(e11))) throw new ti({ action: tn.EnsureClerkJWT, reason: tr.TokenVerificationFailed, message: `Invalid JWT audience claim array (aud) ${JSON.stringify(e10)}. Is not included in "${JSON.stringify(r10)}".` });
        }
      }, tb = (e10, t10 = "JWT") => {
        if (void 0 === e10) return;
        let r10 = Array.isArray(t10) ? t10 : [t10];
        if (!r10.includes(e10)) throw new ti({ action: tn.EnsureClerkJWT, reason: tr.TokenInvalid, message: `Invalid JWT type ${JSON.stringify(e10)}. Expected "${r10.join(", ")}".` });
      }, t_ = (e10) => {
        if (!tg.includes(e10)) throw new ti({ action: tn.EnsureClerkJWT, reason: tr.TokenInvalidAlgorithm, message: `Invalid JWT algorithm ${JSON.stringify(e10)}. Supported: ${tg}.` });
      }, tv = (e10) => {
        if ("string" != typeof e10) throw new ti({ action: tn.EnsureClerkJWT, reason: tr.TokenVerificationFailed, message: `Subject claim (sub) is required and must be a string. Received ${JSON.stringify(e10)}.` });
      }, tw = (e10, t10) => {
        if (e10 && t10 && 0 !== t10.length && !t10.includes(e10)) throw new ti({ reason: tr.TokenInvalidAuthorizedParties, message: `Invalid JWT Authorized party claim (azp) ${JSON.stringify(e10)}. Expected "${t10}".` });
      }, tk = (e10, t10) => {
        if ("number" != typeof e10) throw new ti({ action: tn.EnsureClerkJWT, reason: tr.TokenVerificationFailed, message: `Invalid JWT expiry date claim (exp) ${JSON.stringify(e10)}. Expected number.` });
        let r10 = new Date(Date.now()), n10 = /* @__PURE__ */ new Date(0);
        if (n10.setUTCSeconds(e10), n10.getTime() <= r10.getTime() - t10) throw new ti({ reason: tr.TokenExpired, message: `JWT is expired. Expiry date: ${n10.toUTCString()}, Current date: ${r10.toUTCString()}.` });
      }, tS = (e10, t10) => {
        if (void 0 === e10) return;
        if ("number" != typeof e10) throw new ti({ action: tn.EnsureClerkJWT, reason: tr.TokenVerificationFailed, message: `Invalid JWT not before date claim (nbf) ${JSON.stringify(e10)}. Expected number.` });
        let r10 = new Date(Date.now()), n10 = /* @__PURE__ */ new Date(0);
        if (n10.setUTCSeconds(e10), n10.getTime() > r10.getTime() + t10) throw new ti({ reason: tr.TokenNotActiveYet, message: `JWT cannot be used prior to not before date claim (nbf). Not before date: ${n10.toUTCString()}; Current date: ${r10.toUTCString()};` });
      }, tT = (e10, t10) => {
        if (void 0 === e10) return;
        if ("number" != typeof e10) throw new ti({ action: tn.EnsureClerkJWT, reason: tr.TokenVerificationFailed, message: `Invalid JWT issued at date claim (iat) ${JSON.stringify(e10)}. Expected number.` });
        let r10 = new Date(Date.now()), n10 = /* @__PURE__ */ new Date(0);
        if (n10.setUTCSeconds(e10), n10.getTime() > r10.getTime() + t10) throw new ti({ reason: tr.TokenIatInTheFuture, message: `JWT issued at date claim (iat) is in the future. Issued at date: ${n10.toUTCString()}; Current date: ${r10.toUTCString()};` });
      };
      async function tx(e10, t10) {
        let { header: r10, signature: n10, raw: i10 } = e10, s10 = new TextEncoder().encode([i10.header, i10.payload].join(".")), a10 = function(e11) {
          let t11 = th[e11], r11 = tf[e11];
          if (!t11 || !r11) throw Error(`Unsupported algorithm ${e11}, expected one of ${tg.join(",")}.`);
          return { hash: { name: th[e11] }, name: tf[e11] };
        }(r10.alg);
        try {
          let e11 = await function(e12, t11, r11) {
            if ("object" == typeof e12) return tc.crypto.subtle.importKey("jwk", e12, t11, false, [r11]);
            let n11 = function(e13) {
              let t12 = eH(e13.replace(/-----BEGIN.*?-----/g, "").replace(/-----END.*?-----/g, "").replace(/\s/g, "")), r12 = new Uint8Array(new ArrayBuffer(t12.length));
              for (let e14 = 0, n12 = t12.length; e14 < n12; e14++) r12[e14] = t12.charCodeAt(e14);
              return r12;
            }(e12), i11 = "sign" === r11 ? "pkcs8" : "spki";
            return tc.crypto.subtle.importKey(i11, n11, t11, false, [r11]);
          }(t10, a10, "verify");
          return { data: await tc.crypto.subtle.verify(a10.name, e11, n10, s10) };
        } catch (e11) {
          return { errors: [new ti({ reason: tr.TokenInvalidSignature, message: e11?.message })] };
        }
      }
      function tE(e10) {
        let t10 = (e10 || "").toString().split(".");
        if (3 !== t10.length) return { errors: [new ti({ reason: tr.TokenInvalid, message: "Invalid JWT form. A JWT consists of three parts separated by dots." })] };
        let [r10, n10, i10] = t10, s10 = new TextDecoder(), a10 = JSON.parse(s10.decode(tu.parse(r10, { loose: true })));
        return { data: { header: a10, payload: JSON.parse(s10.decode(tu.parse(n10, { loose: true }))), signature: tu.parse(i10, { loose: true }), raw: { header: r10, payload: n10, signature: i10, text: e10 } } };
      }
      async function tO(e10, t10) {
        let { audience: r10, authorizedParties: n10, clockSkewInMs: i10, key: s10, headerType: a10 } = t10, o10 = i10 || 5e3, { data: l2, errors: c2 } = tE(e10);
        if (c2) return { errors: c2 };
        let { header: u2, payload: d2 } = l2;
        try {
          let { typ: e11, alg: t11 } = u2;
          tb(e11, a10), t_(t11);
          let { azp: i11, sub: s11, aud: l3, iat: c3, exp: h3, nbf: p3 } = d2;
          tv(s11), ty([l3], [r10]), tw(i11, n10), tk(h3, o10), tS(p3, o10), tT(c3, o10);
        } catch (e11) {
          return { errors: [e11] };
        }
        let { data: h2, errors: p2 } = await tx(l2, s10);
        return p2 ? { errors: [new ti({ action: tn.EnsureClerkJWT, reason: tr.TokenVerificationFailed, message: `Error verifying JWT signature. ${p2[0]}` })] } : h2 ? { data: d2 } : { errors: [new ti({ reason: tr.TokenInvalidSignature, message: "JWT signature is invalid." })] };
      }
      var tC = Object.create, tI = Object.defineProperty, tP = Object.getOwnPropertyDescriptor, tA = Object.getOwnPropertyNames, tR = Object.getPrototypeOf, tN = Object.prototype.hasOwnProperty, tU = (e10) => {
        throw TypeError(e10);
      }, tM = (e10, t10, r10) => t10.has(e10) || tU("Cannot " + r10), tL = (e10, t10, r10) => (tM(e10, t10, "read from private field"), r10 ? r10.call(e10) : t10.get(e10)), tq = (e10, t10, r10) => t10.has(e10) ? tU("Cannot add the same private member more than once") : t10 instanceof WeakSet ? t10.add(e10) : t10.set(e10, r10), tD = (e10, t10, r10, n10) => (tM(e10, t10, "write to private field"), n10 ? n10.call(e10, r10) : t10.set(e10, r10), r10), tj = (e10, t10, r10) => (tM(e10, t10, "access private method"), r10);
      function tB(e10) {
        return e10 ? `https://${e10.replace(/clerk\.accountsstage\./, "accountsstage.").replace(/clerk\.accounts\.|clerk\./, "accounts.")}` : "";
      }
      let tH = { strict_mfa: { afterMinutes: 10, level: "multi_factor" }, strict: { afterMinutes: 10, level: "second_factor" }, moderate: { afterMinutes: 60, level: "second_factor" }, lax: { afterMinutes: 1440, level: "second_factor" } }, tK = /* @__PURE__ */ new Set(["first_factor", "second_factor", "multi_factor"]), t$ = /* @__PURE__ */ new Set(["strict_mfa", "strict", "moderate", "lax"]), tz = /* @__PURE__ */ new Set(["o", "org", "organization"]), tF = /* @__PURE__ */ new Set(["u", "user"]), tJ = (e10) => "number" == typeof e10 && e10 > 0, tV = (e10) => tK.has(e10), tW = (e10) => t$.has(e10), tG = (e10) => e10.replace(/^(org:)*/, "org:"), tX = (e10, t10) => {
        let { orgId: r10, orgRole: n10, orgPermissions: i10 } = t10;
        return (e10.role || e10.permission) && r10 && n10 && i10 ? e10.permission ? i10.includes(tG(e10.permission)) : e10.role ? tG(n10) === tG(e10.role) : null : null;
      }, tY = (e10, t10) => {
        let { org: r10, user: n10 } = tZ(e10), [i10, s10] = t10.split(":"), a10 = void 0 !== s10, o10 = s10 || i10;
        if (a10 && !tz.has(i10) && !tF.has(i10)) throw Error(`Invalid scope: ${i10}`);
        if (a10) {
          if (tz.has(i10)) return r10.includes(o10);
          if (tF.has(i10)) return n10.includes(o10);
        }
        return [...r10, ...n10].includes(o10);
      }, tQ = (e10, t10) => {
        let { features: r10, plans: n10 } = t10;
        return e10.feature && r10 ? tY(r10, e10.feature) : e10.plan && n10 ? tY(n10, e10.plan) : null;
      }, tZ = (e10) => {
        let t10 = [], r10 = [];
        if (!e10) return { org: t10, user: r10 };
        let n10 = e10.split(",");
        for (let e11 = 0; e11 < n10.length; e11++) {
          let i10 = n10[e11].trim(), s10 = i10.indexOf(":");
          if (-1 === s10) throw Error(`Invalid claim element (missing colon): ${i10}`);
          let a10 = i10.slice(0, s10), o10 = i10.slice(s10 + 1);
          "o" === a10 ? t10.push(o10) : "u" === a10 ? r10.push(o10) : ("ou" === a10 || "uo" === a10) && (t10.push(o10), r10.push(o10));
        }
        return { org: t10, user: r10 };
      }, t0 = (e10) => {
        if (!e10) return false;
        let t10 = "string" == typeof e10 && tW(e10), r10 = "object" == typeof e10 && tV(e10.level) && tJ(e10.afterMinutes);
        return (!!t10 || !!r10) && ((e11) => "string" == typeof e11 ? tH[e11] : e11).bind(null, e10);
      }, t1 = (e10, { factorVerificationAge: t10 }) => {
        if (!e10.reverification || !t10) return null;
        let r10 = t0(e10.reverification);
        if (!r10) return null;
        let { level: n10, afterMinutes: i10 } = r10(), [s10, a10] = t10, o10 = -1 !== s10 ? i10 > s10 : null, l2 = -1 !== a10 ? i10 > a10 : null;
        switch (n10) {
          case "first_factor":
            return o10;
          case "second_factor":
            return -1 !== a10 ? l2 : o10;
          case "multi_factor":
            return -1 === a10 ? o10 : o10 && l2;
        }
      }, t2 = (e10) => (t10) => {
        if (!e10.userId) return false;
        let r10 = tQ(t10, e10), n10 = tX(t10, e10), i10 = t1(t10, e10);
        return [r10 || n10, i10].some((e11) => null === e11) ? [r10 || n10, i10].some((e11) => true === e11) : [r10 || n10, i10].every((e11) => true === e11);
      }, t4 = ({ per: e10, fpm: t10 }) => {
        if (!e10 || !t10) return { permissions: [], featurePermissionMap: [] };
        let r10 = e10.split(",").map((e11) => e11.trim());
        return { permissions: r10, featurePermissionMap: t10.split(",").map((e11) => Number.parseInt(e11.trim(), 10)).map((e11) => e11.toString(2).padStart(r10.length, "0").split("").map((e12) => Number.parseInt(e12, 10)).reverse()).filter(Boolean) };
      }, t3 = (e10) => {
        let t10, r10, n10, i10;
        let s10 = e10.fva ?? null, a10 = e10.sts ?? null;
        if (2 === e10.v) {
          if (e10.o) {
            t10 = e10.o?.id, n10 = e10.o?.slg, e10.o?.rol && (r10 = `org:${e10.o?.rol}`);
            let { org: s11 } = tZ(e10.fea), { permissions: a11, featurePermissionMap: o10 } = t4({ per: e10.o?.per, fpm: e10.o?.fpm });
            i10 = function({ features: e11, permissions: t11, featurePermissionMap: r11 }) {
              if (!e11 || !t11 || !r11) return [];
              let n11 = [];
              for (let i11 = 0; i11 < e11.length; i11++) {
                let s12 = e11[i11];
                if (i11 >= r11.length) continue;
                let a12 = r11[i11];
                if (a12) for (let e12 = 0; e12 < a12.length; e12++) 1 === a12[e12] && n11.push(`org:${s12}:${t11[e12]}`);
              }
              return n11;
            }({ features: s11, featurePermissionMap: o10, permissions: a11 });
          }
        } else t10 = e10.org_id, r10 = e10.org_role, n10 = e10.org_slug, i10 = e10.org_permissions;
        return { sessionClaims: e10, sessionId: e10.sid, sessionStatus: a10, actor: e10.act, userId: e10.sub, orgId: t10, orgRole: r10, orgSlug: n10, orgPermissions: i10, factorVerificationAge: s10 };
      };
      var t5 = (i = { "../../node_modules/.pnpm/cookie@1.0.2/node_modules/cookie/dist/index.js"(e10) {
        Object.defineProperty(e10, "__esModule", { value: true }), e10.parse = function(e11, t11) {
          let r11 = new a10(), n11 = e11.length;
          if (n11 < 2) return r11;
          let i11 = t11?.decode || c2, s11 = 0;
          do {
            let t12 = e11.indexOf("=", s11);
            if (-1 === t12) break;
            let a11 = e11.indexOf(";", s11), c3 = -1 === a11 ? n11 : a11;
            if (t12 > c3) {
              s11 = e11.lastIndexOf(";", t12 - 1) + 1;
              continue;
            }
            let u2 = o10(e11, s11, t12), d2 = l2(e11, t12, u2), h2 = e11.slice(u2, d2);
            if (void 0 === r11[h2]) {
              let n12 = o10(e11, t12 + 1, c3), s12 = l2(e11, c3, n12), a12 = i11(e11.slice(n12, s12));
              r11[h2] = a12;
            }
            s11 = c3 + 1;
          } while (s11 < n11);
          return r11;
        }, e10.serialize = function(e11, a11, o11) {
          let l3 = o11?.encode || encodeURIComponent;
          if (!t10.test(e11)) throw TypeError(`argument name is invalid: ${e11}`);
          let c3 = l3(a11);
          if (!r10.test(c3)) throw TypeError(`argument val is invalid: ${a11}`);
          let u2 = e11 + "=" + c3;
          if (!o11) return u2;
          if (void 0 !== o11.maxAge) {
            if (!Number.isInteger(o11.maxAge)) throw TypeError(`option maxAge is invalid: ${o11.maxAge}`);
            u2 += "; Max-Age=" + o11.maxAge;
          }
          if (o11.domain) {
            if (!n10.test(o11.domain)) throw TypeError(`option domain is invalid: ${o11.domain}`);
            u2 += "; Domain=" + o11.domain;
          }
          if (o11.path) {
            if (!i10.test(o11.path)) throw TypeError(`option path is invalid: ${o11.path}`);
            u2 += "; Path=" + o11.path;
          }
          if (o11.expires) {
            var d2;
            if (d2 = o11.expires, "[object Date]" !== s10.call(d2) || !Number.isFinite(o11.expires.valueOf())) throw TypeError(`option expires is invalid: ${o11.expires}`);
            u2 += "; Expires=" + o11.expires.toUTCString();
          }
          if (o11.httpOnly && (u2 += "; HttpOnly"), o11.secure && (u2 += "; Secure"), o11.partitioned && (u2 += "; Partitioned"), o11.priority) switch ("string" == typeof o11.priority ? o11.priority.toLowerCase() : void 0) {
            case "low":
              u2 += "; Priority=Low";
              break;
            case "medium":
              u2 += "; Priority=Medium";
              break;
            case "high":
              u2 += "; Priority=High";
              break;
            default:
              throw TypeError(`option priority is invalid: ${o11.priority}`);
          }
          if (o11.sameSite) switch ("string" == typeof o11.sameSite ? o11.sameSite.toLowerCase() : o11.sameSite) {
            case true:
            case "strict":
              u2 += "; SameSite=Strict";
              break;
            case "lax":
              u2 += "; SameSite=Lax";
              break;
            case "none":
              u2 += "; SameSite=None";
              break;
            default:
              throw TypeError(`option sameSite is invalid: ${o11.sameSite}`);
          }
          return u2;
        };
        var t10 = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/, r10 = /^[\u0021-\u003A\u003C-\u007E]*$/, n10 = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i, i10 = /^[\u0020-\u003A\u003D-\u007E]*$/, s10 = Object.prototype.toString, a10 = (() => {
          let e11 = function() {
          };
          return e11.prototype = /* @__PURE__ */ Object.create(null), e11;
        })();
        function o10(e11, t11, r11) {
          do {
            let r12 = e11.charCodeAt(t11);
            if (32 !== r12 && 9 !== r12) return t11;
          } while (++t11 < r11);
          return r11;
        }
        function l2(e11, t11, r11) {
          for (; t11 > r11; ) {
            let r12 = e11.charCodeAt(--t11);
            if (32 !== r12 && 9 !== r12) return t11 + 1;
          }
          return r11;
        }
        function c2(e11) {
          if (-1 === e11.indexOf("%")) return e11;
          try {
            return decodeURIComponent(e11);
          } catch (t11) {
            return e11;
          }
        }
      } }, function() {
        return s || (0, i[tA(i)[0]])((s = { exports: {} }).exports, s), s.exports;
      }), t6 = "https://api.clerk.com", t8 = "@clerk/backend@3.0.1", t9 = "2025-11-10", t7 = { Session: "__session", Refresh: "__refresh", ClientUat: "__client_uat", Handshake: "__clerk_handshake", DevBrowser: "__clerk_db_jwt", RedirectCount: "__clerk_redirect_count", HandshakeNonce: "__clerk_handshake_nonce" }, re = { ClerkSynced: "__clerk_synced", SuffixedCookies: "suffixed_cookies", ClerkRedirectUrl: "__clerk_redirect_url", DevBrowser: t7.DevBrowser, Handshake: t7.Handshake, HandshakeHelp: "__clerk_help", LegacyDevBrowser: "__dev_session", HandshakeReason: "__clerk_hs_reason", HandshakeNonce: t7.HandshakeNonce, HandshakeFormat: "format", Session: "__session" }, rt = { NeedsSync: "false", Completed: "true" }, rr = { Cookies: t7, Headers: { Accept: "accept", AuthMessage: "x-clerk-auth-message", Authorization: "authorization", AuthReason: "x-clerk-auth-reason", AuthSignature: "x-clerk-auth-signature", AuthStatus: "x-clerk-auth-status", AuthToken: "x-clerk-auth-token", CacheControl: "cache-control", ClerkRedirectTo: "x-clerk-redirect-to", ClerkRequestData: "x-clerk-request-data", ClerkUrl: "x-clerk-clerk-url", CloudFrontForwardedProto: "cloudfront-forwarded-proto", ContentType: "content-type", ContentSecurityPolicy: "content-security-policy", ContentSecurityPolicyReportOnly: "content-security-policy-report-only", EnableDebug: "x-clerk-debug", ForwardedHost: "x-forwarded-host", ForwardedPort: "x-forwarded-port", ForwardedProto: "x-forwarded-proto", Host: "host", Location: "location", Nonce: "x-nonce", Origin: "origin", Referrer: "referer", SecFetchDest: "sec-fetch-dest", SecFetchSite: "sec-fetch-site", UserAgent: "user-agent", ReportingEndpoints: "reporting-endpoints" }, ContentTypes: { Json: "application/json" }, QueryParameters: re, ClerkSyncStatus: rt }, rn = (e10, t10, r10, n10, i10) => {
        if ("" === e10) return ri(t10.toString(), r10?.toString());
        let s10 = new URL(e10), a10 = r10 ? new URL(r10, s10) : void 0, o10 = new URL(t10, s10), l2 = `${s10.hostname}:${s10.port}` != `${o10.hostname}:${o10.port}`;
        return a10 && (l2 && i10 && a10.searchParams.set(rr.QueryParameters.ClerkSynced, rt.NeedsSync), o10.searchParams.set("redirect_url", a10.toString())), l2 && n10 && o10.searchParams.set(rr.QueryParameters.DevBrowser, n10), o10.toString();
      }, ri = (e10, t10) => {
        let r10;
        if (e10.startsWith("http")) r10 = new URL(e10);
        else {
          if (!t10 || !t10.startsWith("http")) throw Error("destination url or return back url should be an absolute path url!");
          let n10 = new URL(t10);
          r10 = new URL(e10, n10.origin);
        }
        return t10 && r10.searchParams.set("redirect_url", t10), r10.toString();
      }, rs = (e10) => {
        let { publishableKey: t10, redirectAdapter: r10, signInUrl: n10, signUpUrl: i10, baseUrl: s10, sessionStatus: a10, isSatellite: o10 } = e10, l2 = eF(t10), c2 = l2?.frontendApi, u2 = l2?.instanceType === "development", d2 = tB(c2), h2 = "pending" === a10, p2 = (t11, { returnBackUrl: n11 }) => r10(rn(s10, `${t11}/tasks`, n11, u2 ? e10.devBrowserToken : null, o10));
        return { redirectToSignUp: ({ returnBackUrl: t11 } = {}) => {
          i10 || d2 || e7.throwMissingPublishableKeyError();
          let a11 = `${d2}/sign-up`, l3 = i10 || function(e11) {
            if (!e11) return;
            let t12 = new URL(e11, s10);
            return t12.pathname = `${t12.pathname}/create`, t12.toString();
          }(n10) || a11;
          return h2 ? p2(l3, { returnBackUrl: t11 }) : r10(rn(s10, l3, t11, u2 ? e10.devBrowserToken : null, o10));
        }, redirectToSignIn: ({ returnBackUrl: t11 } = {}) => {
          n10 || d2 || e7.throwMissingPublishableKeyError();
          let i11 = `${d2}/sign-in`, a11 = n10 || i11;
          return h2 ? p2(a11, { returnBackUrl: t11 }) : r10(rn(s10, a11, t11, u2 ? e10.devBrowserToken : null, o10));
        } };
      };
      function ra(e10, t10) {
        return Object.keys(e10).reduce((e11, r10) => ({ ...e11, [r10]: t10[r10] || e11[r10] }), { ...e10 });
      }
      function ro(e10) {
        if (!e10 || "string" != typeof e10) throw Error("Missing Clerk Secret Key. Go to https://dashboard.clerk.com and get your key for your instance.");
      }
      var rl = { SessionToken: "session_token", ApiKey: "api_key", M2MToken: "m2m_token", OAuthToken: "oauth_token" }, rc = class {
        constructor(e10, t10, r10) {
          this.cookieSuffix = e10, this.clerkRequest = t10, this.originalFrontendApi = "", r10.acceptsToken === rl.M2MToken || r10.acceptsToken === rl.ApiKey ? this.initHeaderValues() : (this.initPublishableKeyValues(r10), this.initHeaderValues(), this.initCookieValues(), this.initHandshakeValues()), Object.assign(this, r10), this.clerkUrl = this.clerkRequest.clerkUrl;
        }
        get sessionToken() {
          return this.sessionTokenInCookie || this.tokenInHeader;
        }
        usesSuffixedCookies() {
          let e10 = this.getSuffixedCookie(rr.Cookies.ClientUat), t10 = this.getCookie(rr.Cookies.ClientUat), r10 = this.getSuffixedCookie(rr.Cookies.Session) || "", n10 = this.getCookie(rr.Cookies.Session) || "";
          if (n10 && !this.tokenHasIssuer(n10)) return false;
          if (n10 && !this.tokenBelongsToInstance(n10)) return true;
          if (!e10 && !r10) return false;
          let { data: i10 } = tE(n10), s10 = i10?.payload.iat || 0, { data: a10 } = tE(r10), o10 = a10?.payload.iat || 0;
          if ("0" !== e10 && "0" !== t10 && s10 > o10 || "0" === e10 && "0" !== t10) return false;
          if ("production" !== this.instanceType) {
            let r11 = this.sessionExpired(a10);
            if ("0" !== e10 && "0" === t10 && r11) return false;
          }
          return !!e10 || !r10;
        }
        isCrossOriginReferrer() {
          if (!this.referrer || !this.clerkUrl.origin) return false;
          try {
            return new URL(this.referrer).origin !== this.clerkUrl.origin;
          } catch {
            return false;
          }
        }
        isKnownClerkReferrer() {
          if (!this.referrer) return false;
          try {
            let e10 = new URL(this.referrer), t10 = e10.hostname;
            if (this.frontendApi) {
              let e11 = this.frontendApi.startsWith("http") ? new URL(this.frontendApi).hostname : this.frontendApi;
              if (t10 === e11) return true;
            }
            if (eN.some((e11) => t10.startsWith("accounts.") && t10.endsWith(e11)) || eU.some((e11) => t10.endsWith(e11) && !t10.endsWith(".clerk" + e11))) return true;
            let r10 = tB(this.frontendApi);
            if (r10) {
              let t11 = new URL(r10).origin;
              if (e10.origin === t11) return true;
            }
            if (t10.startsWith("accounts.")) return true;
            return false;
          } catch {
            return false;
          }
        }
        initPublishableKeyValues(e10) {
          eF(e10.publishableKey, { fatal: true }), this.publishableKey = e10.publishableKey;
          let t10 = eF(this.publishableKey, { fatal: true, domain: e10.domain, isSatellite: e10.isSatellite });
          this.originalFrontendApi = t10.frontendApi;
          let r10 = eF(this.publishableKey, { fatal: true, proxyUrl: e10.proxyUrl, domain: e10.domain, isSatellite: e10.isSatellite });
          this.instanceType = r10.instanceType, this.frontendApi = r10.frontendApi;
        }
        initHeaderValues() {
          this.tokenInHeader = this.parseAuthorizationHeader(this.getHeader(rr.Headers.Authorization)), this.origin = this.getHeader(rr.Headers.Origin), this.host = this.getHeader(rr.Headers.Host), this.forwardedHost = this.getHeader(rr.Headers.ForwardedHost), this.forwardedProto = this.getHeader(rr.Headers.CloudFrontForwardedProto) || this.getHeader(rr.Headers.ForwardedProto), this.referrer = this.getHeader(rr.Headers.Referrer), this.userAgent = this.getHeader(rr.Headers.UserAgent), this.secFetchDest = this.getHeader(rr.Headers.SecFetchDest), this.accept = this.getHeader(rr.Headers.Accept);
        }
        initCookieValues() {
          this.sessionTokenInCookie = this.getSuffixedOrUnSuffixedCookie(rr.Cookies.Session), this.refreshTokenInCookie = this.getSuffixedCookie(rr.Cookies.Refresh), this.clientUat = Number.parseInt(this.getSuffixedOrUnSuffixedCookie(rr.Cookies.ClientUat) || "") || 0;
        }
        initHandshakeValues() {
          this.devBrowserToken = this.getQueryParam(rr.QueryParameters.DevBrowser) || this.getSuffixedOrUnSuffixedCookie(rr.Cookies.DevBrowser), this.handshakeToken = this.getQueryParam(rr.QueryParameters.Handshake) || this.getCookie(rr.Cookies.Handshake), this.handshakeRedirectLoopCounter = Number(this.getCookie(rr.Cookies.RedirectCount)) || 0, this.handshakeNonce = this.getQueryParam(rr.QueryParameters.HandshakeNonce) || this.getCookie(rr.Cookies.HandshakeNonce);
        }
        getQueryParam(e10) {
          return this.clerkRequest.clerkUrl.searchParams.get(e10);
        }
        getHeader(e10) {
          return this.clerkRequest.headers.get(e10) || void 0;
        }
        getCookie(e10) {
          return this.clerkRequest.cookies.get(e10) || void 0;
        }
        getSuffixedCookie(e10) {
          return this.getCookie(eG(e10, this.cookieSuffix)) || void 0;
        }
        getSuffixedOrUnSuffixedCookie(e10) {
          return this.usesSuffixedCookies() ? this.getSuffixedCookie(e10) : this.getCookie(e10);
        }
        parseAuthorizationHeader(e10) {
          if (!e10) return;
          let [t10, r10] = e10.split(" ", 2);
          return r10 ? "Bearer" === t10 ? r10 : void 0 : t10;
        }
        tokenHasIssuer(e10) {
          let { data: t10, errors: r10 } = tE(e10);
          return !r10 && !!t10.payload.iss;
        }
        tokenBelongsToInstance(e10) {
          if (!e10) return false;
          let { data: t10, errors: r10 } = tE(e10);
          if (r10) return false;
          let n10 = t10.payload.iss.replace(/https?:\/\//gi, "");
          return this.originalFrontendApi === n10;
        }
        sessionExpired(e10) {
          return !!e10 && e10?.payload.exp <= Date.now() / 1e3 >> 0;
        }
      }, ru = async (e10, t10) => new rc(t10.publishableKey ? await eW(t10.publishableKey, tc.crypto.subtle) : "", e10, t10), rd = RegExp("(?<!:)/{1,}", "g");
      function rh(...e10) {
        return e10.filter((e11) => e11).join("/").replace(rd, "/");
      }
      var rp = class {
        constructor(e10) {
          this.request = e10;
        }
        requireId(e10) {
          if (!e10) throw Error("A valid resource ID is required.");
        }
      }, rf = "/actor_tokens", rg = class extends rp {
        async create(e10) {
          return this.request({ method: "POST", path: rf, bodyParams: e10 });
        }
        async revoke(e10) {
          return this.requireId(e10), this.request({ method: "POST", path: rh(rf, e10, "revoke") });
        }
      }, rm = "/agents/tasks", ry = class extends rp {
        async create(e10) {
          return this.request({ method: "POST", path: rm, bodyParams: e10, options: { deepSnakecaseBodyParamKeys: true } });
        }
        async revoke(e10) {
          return this.requireId(e10), this.request({ method: "POST", path: rh(rm, e10, "revoke") });
        }
      }, rb = "/accountless_applications", r_ = class extends rp {
        async createAccountlessApplication(e10) {
          let t10 = e10?.requestHeaders ? Object.fromEntries(e10.requestHeaders.entries()) : void 0;
          return this.request({ method: "POST", path: rb, headerParams: t10 });
        }
        async completeAccountlessApplicationOnboarding(e10) {
          let t10 = e10?.requestHeaders ? Object.fromEntries(e10.requestHeaders.entries()) : void 0;
          return this.request({ method: "POST", path: rh(rb, "complete"), headerParams: t10 });
        }
      }, rv = "/allowlist_identifiers", rw = class extends rp {
        async getAllowlistIdentifierList(e10 = {}) {
          return this.request({ method: "GET", path: rv, queryParams: { ...e10, paginated: true } });
        }
        async createAllowlistIdentifier(e10) {
          return this.request({ method: "POST", path: rv, bodyParams: e10 });
        }
        async deleteAllowlistIdentifier(e10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(rv, e10) });
        }
      }, rk = "/api_keys", rS = class extends rp {
        async list(e10) {
          return this.request({ method: "GET", path: rk, queryParams: e10 });
        }
        async create(e10) {
          return this.request({ method: "POST", path: rk, bodyParams: e10 });
        }
        async get(e10) {
          return this.requireId(e10), this.request({ method: "GET", path: rh(rk, e10) });
        }
        async update(e10) {
          let { apiKeyId: t10, ...r10 } = e10;
          return this.requireId(t10), this.request({ method: "PATCH", path: rh(rk, t10), bodyParams: r10 });
        }
        async delete(e10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(rk, e10) });
        }
        async revoke(e10) {
          let { apiKeyId: t10, revocationReason: r10 = null } = e10;
          return this.requireId(t10), this.request({ method: "POST", path: rh(rk, t10, "revoke"), bodyParams: { revocationReason: r10 } });
        }
        async getSecret(e10) {
          return this.requireId(e10), this.request({ method: "GET", path: rh(rk, e10, "secret") });
        }
        async verify(e10) {
          return this.request({ method: "POST", path: rh(rk, "verify"), bodyParams: { secret: e10 } });
        }
      }, rT = class extends rp {
        async changeDomain(e10) {
          return this.request({ method: "POST", path: rh("/beta_features", "change_domain"), bodyParams: e10 });
        }
      }, rx = "/blocklist_identifiers", rE = class extends rp {
        async getBlocklistIdentifierList(e10 = {}) {
          return this.request({ method: "GET", path: rx, queryParams: e10 });
        }
        async createBlocklistIdentifier(e10) {
          return this.request({ method: "POST", path: rx, bodyParams: e10 });
        }
        async deleteBlocklistIdentifier(e10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(rx, e10) });
        }
      }, rO = "/clients", rC = class extends rp {
        async getClientList(e10 = {}) {
          return this.request({ method: "GET", path: rO, queryParams: { ...e10, paginated: true } });
        }
        async getClient(e10) {
          return this.requireId(e10), this.request({ method: "GET", path: rh(rO, e10) });
        }
        verifyClient(e10) {
          return this.request({ method: "POST", path: rh(rO, "verify"), bodyParams: { token: e10 } });
        }
        async getHandshakePayload(e10) {
          return this.request({ method: "GET", path: rh(rO, "handshake_payload"), queryParams: e10 });
        }
      }, rI = "/domains", rP = class extends rp {
        async list() {
          return this.request({ method: "GET", path: rI });
        }
        async add(e10) {
          return this.request({ method: "POST", path: rI, bodyParams: e10 });
        }
        async update(e10) {
          let { domainId: t10, ...r10 } = e10;
          return this.requireId(t10), this.request({ method: "PATCH", path: rh(rI, t10), bodyParams: r10 });
        }
        async delete(e10) {
          return this.deleteDomain(e10);
        }
        async deleteDomain(e10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(rI, e10) });
        }
      }, rA = "/email_addresses", rR = class extends rp {
        async getEmailAddress(e10) {
          return this.requireId(e10), this.request({ method: "GET", path: rh(rA, e10) });
        }
        async createEmailAddress(e10) {
          return this.request({ method: "POST", path: rA, bodyParams: e10 });
        }
        async updateEmailAddress(e10, t10 = {}) {
          return this.requireId(e10), this.request({ method: "PATCH", path: rh(rA, e10), bodyParams: t10 });
        }
        async deleteEmailAddress(e10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(rA, e10) });
        }
      }, rN = class extends rp {
        async verify(e10) {
          return this.request({ method: "POST", path: rh("/oauth_applications/access_tokens", "verify"), bodyParams: { access_token: e10 } });
        }
      }, rU = "/instance", rM = class extends rp {
        async get() {
          return this.request({ method: "GET", path: rU });
        }
        async update(e10) {
          return this.request({ method: "PATCH", path: rU, bodyParams: e10 });
        }
        async updateRestrictions(e10) {
          return this.request({ method: "PATCH", path: rh(rU, "restrictions"), bodyParams: e10 });
        }
        async updateOrganizationSettings(e10) {
          return this.request({ method: "PATCH", path: rh(rU, "organization_settings"), bodyParams: e10 });
        }
      }, rL = "/invitations", rq = class extends rp {
        async getInvitationList(e10 = {}) {
          return this.request({ method: "GET", path: rL, queryParams: { ...e10, paginated: true } });
        }
        async createInvitation(e10) {
          return this.request({ method: "POST", path: rL, bodyParams: e10 });
        }
        async createInvitationBulk(e10) {
          return this.request({ method: "POST", path: rh(rL, "bulk"), bodyParams: e10 });
        }
        async revokeInvitation(e10) {
          return this.requireId(e10), this.request({ method: "POST", path: rh(rL, e10, "revoke") });
        }
      }, rD = "/machines", rj = class extends rp {
        async get(e10) {
          return this.requireId(e10), this.request({ method: "GET", path: rh(rD, e10) });
        }
        async list(e10 = {}) {
          return this.request({ method: "GET", path: rD, queryParams: e10 });
        }
        async create(e10) {
          return this.request({ method: "POST", path: rD, bodyParams: e10 });
        }
        async update(e10) {
          let { machineId: t10, ...r10 } = e10;
          return this.requireId(t10), this.request({ method: "PATCH", path: rh(rD, t10), bodyParams: r10 });
        }
        async delete(e10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(rD, e10) });
        }
        async getSecretKey(e10) {
          return this.requireId(e10), this.request({ method: "GET", path: rh(rD, e10, "secret_key") });
        }
        async rotateSecretKey(e10) {
          let { machineId: t10, previousTokenTtl: r10 } = e10;
          return this.requireId(t10), this.request({ method: "POST", path: rh(rD, t10, "secret_key", "rotate"), bodyParams: { previousTokenTtl: r10 } });
        }
        async createScope(e10, t10) {
          return this.requireId(e10), this.request({ method: "POST", path: rh(rD, e10, "scopes"), bodyParams: { toMachineId: t10 } });
        }
        async deleteScope(e10, t10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(rD, e10, "scopes", t10) });
        }
      }, rB = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10, l2, c2, u2) {
          this.id = e11, this.clientId = t10, this.type = r10, this.subject = n10, this.scopes = i10, this.revoked = s10, this.revocationReason = a10, this.expired = o10, this.expiration = l2, this.createdAt = c2, this.updatedAt = u2;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.client_id, t10.type, t10.subject, t10.scopes, t10.revoked, t10.revocation_reason, t10.expired, t10.expiration, t10.created_at, t10.updated_at);
        }
        static fromJwtPayload(t10, r10 = 5e3) {
          return new e10(t10.jti ?? "", t10.client_id ?? "", "oauth_token", t10.sub, t10.scp ?? t10.scope?.split(" ") ?? [], false, null, 1e3 * t10.exp <= Date.now() - r10, t10.exp, t10.iat, t10.iat);
        }
      }, rH = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10, l2, c2, u2) {
          this.id = e11, this.subject = t10, this.scopes = r10, this.claims = n10, this.revoked = i10, this.revocationReason = s10, this.expired = a10, this.expiration = o10, this.createdAt = l2, this.updatedAt = c2, this.token = u2;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.subject, t10.scopes, t10.claims, t10.revoked, t10.revocation_reason, t10.expired, t10.expiration, t10.created_at, t10.updated_at, t10.token);
        }
        static fromJwtPayload(t10, r10 = 5e3) {
          return new e10(t10.jti ?? "", t10.sub, t10.scopes?.split(" ") ?? t10.aud ?? [], null, false, null, 1e3 * t10.exp <= Date.now() - r10, 1e3 * t10.exp, 1e3 * t10.iat, 1e3 * t10.iat);
        }
      }, rK = {}, r$ = 0;
      function rz(e10, t10, r10 = true) {
        rK[e10] = t10, r$ = r10 ? Date.now() : -1;
      }
      function rF(e10) {
        let { kid: t10, pem: r10 } = e10, n10 = `local-${t10}`, i10 = rK[n10];
        if (i10) return i10;
        if (!r10) throw new ti({ action: tn.SetClerkJWTKey, message: "Missing local JWK.", reason: tr.LocalJWKMissing });
        let s10 = { kid: n10, kty: "RSA", alg: "RS256", n: r10.replace(/\r\n|\n|\r/g, "").replace("-----BEGIN PUBLIC KEY-----", "").replace("-----END PUBLIC KEY-----", "").replace("MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA", "").replace("IDAQAB", "").replace(/\+/g, "-").replace(/\//g, "_"), e: "AQAB" };
        return rz(n10, s10, false), s10;
      }
      async function rJ(e10) {
        let { secretKey: t10, apiUrl: r10 = t6, apiVersion: n10 = "v1", kid: i10, skipJwksCache: s10 } = e10;
        if (s10 || function() {
          if (-1 === r$) return false;
          let e11 = Date.now() - r$ >= 3e5;
          return e11 && (rK = {}), e11;
        }() || !rK[i10]) {
          if (!t10) throw new ti({ action: tn.ContactSupport, message: "Failed to load JWKS from Clerk Backend or Frontend API.", reason: tr.RemoteJWKFailedToLoad });
          let { keys: e11 } = await e0(() => rV(r10, t10, n10));
          if (!e11 || !e11.length) throw new ti({ action: tn.ContactSupport, message: "The JWKS endpoint did not contain any signing keys. Contact support@clerk.com.", reason: tr.RemoteJWKFailedToLoad });
          e11.forEach((e12) => rz(e12.kid, e12));
        }
        let a10 = rK[i10];
        if (!a10) {
          let e11 = Object.values(rK).map((e12) => e12.kid).sort().join(", ");
          throw new ti({ action: `Go to your Dashboard and validate your secret and public keys are correct. ${tn.ContactSupport} if the issue persists.`, message: `Unable to find a signing key in JWKS that matches the kid='${i10}' of the provided session token. Please make sure that the __session cookie or the HTTP authorization header contain a Clerk-generated session JWT. The following kid is available: ${e11}`, reason: tr.JWKKidMismatch });
        }
        return a10;
      }
      async function rV(e10, t10, r10) {
        if (!t10) throw new ti({ action: tn.SetClerkSecretKey, message: "Missing Clerk Secret Key or API Key. Go to https://dashboard.clerk.com and get your key for your instance.", reason: tr.RemoteJWKFailedToLoad });
        let n10 = new URL(e10);
        n10.pathname = rh(n10.pathname, r10, "/jwks");
        let i10 = await tc.fetch(n10.href, { headers: { Authorization: `Bearer ${t10}`, "Clerk-API-Version": t9, "Content-Type": "application/json", "User-Agent": t8 } });
        if (!i10.ok) {
          let e11 = await i10.json(), t11 = rW(e11?.errors, tt.InvalidSecretKey);
          if (t11) {
            let e12 = tr.InvalidSecretKey;
            throw new ti({ action: tn.ContactSupport, message: t11.message, reason: e12 });
          }
          throw new ti({ action: tn.ContactSupport, message: `Error loading Clerk JWKS from ${n10.href} with code=${i10.status}`, reason: tr.RemoteJWKFailedToLoad });
        }
        return i10.json();
      }
      var rW = (e10, t10) => e10 ? e10.find((e11) => e11.code === t10) : null, rG = "mch_", rX = "oat_", rY = ["mt_", rX, "ak_"], rQ = /^[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+$/;
      function rZ(e10) {
        return rQ.test(e10);
      }
      var r0 = ["at+jwt", "application/at+jwt"];
      function r1(e10) {
        if (!rZ(e10)) return false;
        try {
          let { data: t10, errors: r10 } = tE(e10);
          return !r10 && !!t10 && r0.includes(t10.header.typ);
        } catch {
          return false;
        }
      }
      function r2(e10) {
        if (!rZ(e10)) return false;
        try {
          let { data: t10, errors: r10 } = tE(e10);
          return !r10 && !!t10 && "string" == typeof t10.payload.sub && t10.payload.sub.startsWith(rG);
        } catch {
          return false;
        }
      }
      function r4(e10) {
        return rY.some((t10) => e10.startsWith(t10));
      }
      function r3(e10) {
        return r4(e10) || r1(e10) || r2(e10);
      }
      function r5(e10) {
        if (e10.startsWith("mt_") || r2(e10)) return rl.M2MToken;
        if (e10.startsWith(rX) || r1(e10)) return rl.OAuthToken;
        if (e10.startsWith("ak_")) return rl.ApiKey;
        throw Error("Unknown machine token type");
      }
      var r6 = (e10, t10) => !!e10 && ("any" === t10 || (Array.isArray(t10) ? t10 : [t10]).includes(e10)), r8 = /* @__PURE__ */ new Set([rl.ApiKey, rl.M2MToken, rl.OAuthToken]);
      async function r9(e10, t10, r10, n10) {
        try {
          let i10;
          if (r10.jwtKey) i10 = rF({ kid: t10, pem: r10.jwtKey });
          else {
            if (!r10.secretKey) return { error: new ta({ action: tn.SetClerkJWTKey, message: "Failed to resolve JWK during verification.", code: ts.TokenVerificationFailed }) };
            i10 = await rJ({ ...r10, kid: t10 });
          }
          let { data: s10, errors: a10 } = await tO(e10, { ...r10, key: i10, ...n10 ? { headerType: n10 } : {} });
          if (a10) return { error: new ta({ code: ts.TokenVerificationFailed, message: a10[0].message }) };
          return { payload: s10 };
        } catch (e11) {
          return { error: new ta({ code: ts.TokenVerificationFailed, message: e11.message }) };
        }
      }
      async function r7(e10, t10, r10) {
        let n10 = await r9(e10, t10.header.kid, r10);
        return "error" in n10 ? { data: void 0, tokenType: rl.M2MToken, errors: [n10.error] } : { data: rH.fromJwtPayload(n10.payload, r10.clockSkewInMs), tokenType: rl.M2MToken, errors: void 0 };
      }
      async function ne(e10, t10, r10) {
        let n10 = await r9(e10, t10.header.kid, r10, r0);
        return "error" in n10 ? { data: void 0, tokenType: rl.OAuthToken, errors: [n10.error] } : { data: rB.fromJwtPayload(n10.payload, r10.clockSkewInMs), tokenType: rl.OAuthToken, errors: void 0 };
      }
      var nt = "/m2m_tokens", nr = class extends rp {
        constructor(e10, t10 = {}) {
          super(e10), tq(this, a_), tq(this, ab), tD(this, ab, t10);
        }
        async list(e10) {
          let { machineSecretKey: t10, ...r10 } = e10, n10 = tj(this, a_, av).call(this, { method: "GET", path: nt, queryParams: r10 }, t10);
          return this.request(n10);
        }
        async createToken(e10) {
          let { claims: t10 = null, machineSecretKey: r10, secondsUntilExpiration: n10 = null, tokenFormat: i10 = "opaque" } = e10 || {}, s10 = tj(this, a_, av).call(this, { method: "POST", path: nt, bodyParams: { secondsUntilExpiration: n10, claims: t10, tokenFormat: i10 } }, r10);
          return this.request(s10);
        }
        async revokeToken(e10) {
          let { m2mTokenId: t10, revocationReason: r10 = null, machineSecretKey: n10 } = e10;
          this.requireId(t10);
          let i10 = tj(this, a_, av).call(this, { method: "POST", path: rh(nt, t10, "revoke"), bodyParams: { revocationReason: r10 } }, n10);
          return this.request(i10);
        }
        async verify(e10) {
          let { token: t10, machineSecretKey: r10 } = e10;
          if (r2(t10)) return tj(this, a_, aw).call(this, t10);
          let n10 = tj(this, a_, av).call(this, { method: "POST", path: rh(nt, "verify"), bodyParams: { token: t10 } }, r10);
          return this.request(n10);
        }
      };
      ab = /* @__PURE__ */ new WeakMap(), a_ = /* @__PURE__ */ new WeakSet(), av = function(e10, t10) {
        return t10 ? { ...e10, headerParams: { ...e10.headerParams, Authorization: `Bearer ${t10}` } } : e10;
      }, aw = async function(e10) {
        let t10;
        try {
          let { data: r11, errors: n10 } = tE(e10);
          if (n10) throw n10[0];
          t10 = r11;
        } catch (e11) {
          throw new ta({ code: ts.TokenInvalid, message: e11.message });
        }
        let r10 = await r7(e10, t10, tL(this, ab));
        if (r10.errors) throw r10.errors[0];
        return r10.data;
      };
      var nn = class extends rp {
        async getJwks() {
          return this.request({ method: "GET", path: "/jwks" });
        }
      }, ni = "/jwt_templates", ns = class extends rp {
        async list(e10 = {}) {
          return this.request({ method: "GET", path: ni, queryParams: { ...e10, paginated: true } });
        }
        async get(e10) {
          return this.requireId(e10), this.request({ method: "GET", path: rh(ni, e10) });
        }
        async create(e10) {
          return this.request({ method: "POST", path: ni, bodyParams: e10 });
        }
        async update(e10) {
          let { templateId: t10, ...r10 } = e10;
          return this.requireId(t10), this.request({ method: "PATCH", path: rh(ni, t10), bodyParams: r10 });
        }
        async delete(e10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(ni, e10) });
        }
      }, na = "/organizations", no = class extends rp {
        async getOrganizationList(e10) {
          return this.request({ method: "GET", path: na, queryParams: e10 });
        }
        async createOrganization(e10) {
          return this.request({ method: "POST", path: na, bodyParams: e10 });
        }
        async getOrganization(e10) {
          let { includeMembersCount: t10 } = e10, r10 = "organizationId" in e10 ? e10.organizationId : e10.slug;
          return this.requireId(r10), this.request({ method: "GET", path: rh(na, r10), queryParams: { includeMembersCount: t10 } });
        }
        async updateOrganization(e10, t10) {
          return this.requireId(e10), this.request({ method: "PATCH", path: rh(na, e10), bodyParams: t10 });
        }
        async updateOrganizationLogo(e10, t10) {
          this.requireId(e10);
          let r10 = new tc.FormData();
          return r10.append("file", t10?.file), t10?.uploaderUserId && r10.append("uploader_user_id", t10?.uploaderUserId), this.request({ method: "PUT", path: rh(na, e10, "logo"), formData: r10 });
        }
        async deleteOrganizationLogo(e10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(na, e10, "logo") });
        }
        async updateOrganizationMetadata(e10, t10) {
          return this.requireId(e10), this.request({ method: "PATCH", path: rh(na, e10, "metadata"), bodyParams: t10 });
        }
        async deleteOrganization(e10) {
          return this.request({ method: "DELETE", path: rh(na, e10) });
        }
        async getOrganizationMembershipList(e10) {
          let { organizationId: t10, ...r10 } = e10;
          return this.requireId(t10), this.request({ method: "GET", path: rh(na, t10, "memberships"), queryParams: r10 });
        }
        async getInstanceOrganizationMembershipList(e10) {
          return this.request({ method: "GET", path: "/organization_memberships", queryParams: e10 });
        }
        async createOrganizationMembership(e10) {
          let { organizationId: t10, ...r10 } = e10;
          return this.requireId(t10), this.request({ method: "POST", path: rh(na, t10, "memberships"), bodyParams: r10 });
        }
        async updateOrganizationMembership(e10) {
          let { organizationId: t10, userId: r10, ...n10 } = e10;
          return this.requireId(t10), this.request({ method: "PATCH", path: rh(na, t10, "memberships", r10), bodyParams: n10 });
        }
        async updateOrganizationMembershipMetadata(e10) {
          let { organizationId: t10, userId: r10, ...n10 } = e10;
          return this.request({ method: "PATCH", path: rh(na, t10, "memberships", r10, "metadata"), bodyParams: n10 });
        }
        async deleteOrganizationMembership(e10) {
          let { organizationId: t10, userId: r10 } = e10;
          return this.requireId(t10), this.request({ method: "DELETE", path: rh(na, t10, "memberships", r10) });
        }
        async getOrganizationInvitationList(e10) {
          let { organizationId: t10, ...r10 } = e10;
          return this.requireId(t10), this.request({ method: "GET", path: rh(na, t10, "invitations"), queryParams: r10 });
        }
        async createOrganizationInvitation(e10) {
          let { organizationId: t10, ...r10 } = e10;
          return this.requireId(t10), this.request({ method: "POST", path: rh(na, t10, "invitations"), bodyParams: r10 });
        }
        async createOrganizationInvitationBulk(e10, t10) {
          return this.requireId(e10), this.request({ method: "POST", path: rh(na, e10, "invitations", "bulk"), bodyParams: t10 });
        }
        async getOrganizationInvitation(e10) {
          let { organizationId: t10, invitationId: r10 } = e10;
          return this.requireId(t10), this.requireId(r10), this.request({ method: "GET", path: rh(na, t10, "invitations", r10) });
        }
        async revokeOrganizationInvitation(e10) {
          let { organizationId: t10, invitationId: r10, ...n10 } = e10;
          return this.requireId(t10), this.request({ method: "POST", path: rh(na, t10, "invitations", r10, "revoke"), bodyParams: n10 });
        }
        async getOrganizationDomainList(e10) {
          let { organizationId: t10, ...r10 } = e10;
          return this.requireId(t10), this.request({ method: "GET", path: rh(na, t10, "domains"), queryParams: r10 });
        }
        async createOrganizationDomain(e10) {
          let { organizationId: t10, ...r10 } = e10;
          return this.requireId(t10), this.request({ method: "POST", path: rh(na, t10, "domains"), bodyParams: { ...r10, verified: r10.verified ?? true } });
        }
        async updateOrganizationDomain(e10) {
          let { organizationId: t10, domainId: r10, ...n10 } = e10;
          return this.requireId(t10), this.requireId(r10), this.request({ method: "PATCH", path: rh(na, t10, "domains", r10), bodyParams: n10 });
        }
        async deleteOrganizationDomain(e10) {
          let { organizationId: t10, domainId: r10 } = e10;
          return this.requireId(t10), this.requireId(r10), this.request({ method: "DELETE", path: rh(na, t10, "domains", r10) });
        }
      }, nl = "/oauth_applications", nc = class extends rp {
        async list(e10 = {}) {
          return this.request({ method: "GET", path: nl, queryParams: e10 });
        }
        async get(e10) {
          return this.requireId(e10), this.request({ method: "GET", path: rh(nl, e10) });
        }
        async create(e10) {
          return this.request({ method: "POST", path: nl, bodyParams: e10 });
        }
        async update(e10) {
          let { oauthApplicationId: t10, ...r10 } = e10;
          return this.requireId(t10), this.request({ method: "PATCH", path: rh(nl, t10), bodyParams: r10 });
        }
        async delete(e10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(nl, e10) });
        }
        async rotateSecret(e10) {
          return this.requireId(e10), this.request({ method: "POST", path: rh(nl, e10, "rotate_secret") });
        }
      }, nu = "/phone_numbers", nd = class extends rp {
        async getPhoneNumber(e10) {
          return this.requireId(e10), this.request({ method: "GET", path: rh(nu, e10) });
        }
        async createPhoneNumber(e10) {
          return this.request({ method: "POST", path: nu, bodyParams: e10 });
        }
        async updatePhoneNumber(e10, t10 = {}) {
          return this.requireId(e10), this.request({ method: "PATCH", path: rh(nu, e10), bodyParams: t10 });
        }
        async deletePhoneNumber(e10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(nu, e10) });
        }
      }, nh = class extends rp {
        async verify(e10) {
          return this.request({ method: "POST", path: "/proxy_checks", bodyParams: e10 });
        }
      }, np = "/redirect_urls", nf = class extends rp {
        async getRedirectUrlList() {
          return this.request({ method: "GET", path: np, queryParams: { paginated: true } });
        }
        async getRedirectUrl(e10) {
          return this.requireId(e10), this.request({ method: "GET", path: rh(np, e10) });
        }
        async createRedirectUrl(e10) {
          return this.request({ method: "POST", path: np, bodyParams: e10 });
        }
        async deleteRedirectUrl(e10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(np, e10) });
        }
      }, ng = "/saml_connections", nm = class extends rp {
        async getSamlConnectionList(e10 = {}) {
          return this.request({ method: "GET", path: ng, queryParams: e10 });
        }
        async createSamlConnection(e10) {
          return this.request({ method: "POST", path: ng, bodyParams: e10, options: { deepSnakecaseBodyParamKeys: true } });
        }
        async getSamlConnection(e10) {
          return this.requireId(e10), this.request({ method: "GET", path: rh(ng, e10) });
        }
        async updateSamlConnection(e10, t10 = {}) {
          return this.requireId(e10), this.request({ method: "PATCH", path: rh(ng, e10), bodyParams: t10, options: { deepSnakecaseBodyParamKeys: true } });
        }
        async deleteSamlConnection(e10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(ng, e10) });
        }
      }, ny = "/sessions", nb = class extends rp {
        async getSessionList(e10 = {}) {
          return this.request({ method: "GET", path: ny, queryParams: { ...e10, paginated: true } });
        }
        async getSession(e10) {
          return this.requireId(e10), this.request({ method: "GET", path: rh(ny, e10) });
        }
        async createSession(e10) {
          return this.request({ method: "POST", path: ny, bodyParams: e10 });
        }
        async revokeSession(e10) {
          return this.requireId(e10), this.request({ method: "POST", path: rh(ny, e10, "revoke") });
        }
        async verifySession(e10, t10) {
          return this.requireId(e10), this.request({ method: "POST", path: rh(ny, e10, "verify"), bodyParams: { token: t10 } });
        }
        async getToken(e10, t10, r10) {
          this.requireId(e10);
          let n10 = { method: "POST", path: t10 ? rh(ny, e10, "tokens", t10) : rh(ny, e10, "tokens") };
          return void 0 !== r10 && (n10.bodyParams = { expires_in_seconds: r10 }), this.request(n10);
        }
        async refreshSession(e10, t10) {
          this.requireId(e10);
          let { suffixed_cookies: r10, ...n10 } = t10;
          return this.request({ method: "POST", path: rh(ny, e10, "refresh"), bodyParams: n10, queryParams: { suffixed_cookies: r10 } });
        }
      }, n_ = "/sign_in_tokens", nv = class extends rp {
        async createSignInToken(e10) {
          return this.request({ method: "POST", path: n_, bodyParams: e10 });
        }
        async revokeSignInToken(e10) {
          return this.requireId(e10), this.request({ method: "POST", path: rh(n_, e10, "revoke") });
        }
      }, nw = "/sign_ups", nk = class extends rp {
        async get(e10) {
          return this.requireId(e10), this.request({ method: "GET", path: rh(nw, e10) });
        }
        async update(e10) {
          let { signUpAttemptId: t10, ...r10 } = e10;
          return this.request({ method: "PATCH", path: rh(nw, t10), bodyParams: r10 });
        }
      }, nS = class extends rp {
        async createTestingToken() {
          return this.request({ method: "POST", path: "/testing_tokens" });
        }
      }, nT = "/users", nx = class extends rp {
        async getUserList(e10 = {}) {
          let { limit: t10, offset: r10, orderBy: n10, ...i10 } = e10, [s10, a10] = await Promise.all([this.request({ method: "GET", path: nT, queryParams: e10 }), this.getCount(i10)]);
          return { data: s10, totalCount: a10 };
        }
        async getUser(e10) {
          return this.requireId(e10), this.request({ method: "GET", path: rh(nT, e10) });
        }
        async createUser(e10) {
          return this.request({ method: "POST", path: nT, bodyParams: e10 });
        }
        async updateUser(e10, t10 = {}) {
          return this.requireId(e10), this.request({ method: "PATCH", path: rh(nT, e10), bodyParams: t10 });
        }
        async updateUserProfileImage(e10, t10) {
          this.requireId(e10);
          let r10 = new tc.FormData();
          return r10.append("file", t10?.file), this.request({ method: "POST", path: rh(nT, e10, "profile_image"), formData: r10 });
        }
        async updateUserMetadata(e10, t10) {
          return this.requireId(e10), this.request({ method: "PATCH", path: rh(nT, e10, "metadata"), bodyParams: t10 });
        }
        async deleteUser(e10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(nT, e10) });
        }
        async getCount(e10 = {}) {
          return this.request({ method: "GET", path: rh(nT, "count"), queryParams: e10 });
        }
        async getUserOauthAccessToken(e10, t10) {
          this.requireId(e10);
          let r10 = t10.startsWith("oauth_"), n10 = r10 ? t10 : `oauth_${t10}`;
          return r10 && eR("getUserOauthAccessToken(userId, provider)", "Remove the `oauth_` prefix from the `provider` argument."), this.request({ method: "GET", path: rh(nT, e10, "oauth_access_tokens", n10), queryParams: { paginated: true } });
        }
        async disableUserMFA(e10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(nT, e10, "mfa") });
        }
        async getOrganizationMembershipList(e10) {
          let { userId: t10, limit: r10, offset: n10 } = e10;
          return this.requireId(t10), this.request({ method: "GET", path: rh(nT, t10, "organization_memberships"), queryParams: { limit: r10, offset: n10 } });
        }
        async getOrganizationInvitationList(e10) {
          let { userId: t10, ...r10 } = e10;
          return this.requireId(t10), this.request({ method: "GET", path: rh(nT, t10, "organization_invitations"), queryParams: r10 });
        }
        async verifyPassword(e10) {
          let { userId: t10, password: r10 } = e10;
          return this.requireId(t10), this.request({ method: "POST", path: rh(nT, t10, "verify_password"), bodyParams: { password: r10 } });
        }
        async verifyTOTP(e10) {
          let { userId: t10, code: r10 } = e10;
          return this.requireId(t10), this.request({ method: "POST", path: rh(nT, t10, "verify_totp"), bodyParams: { code: r10 } });
        }
        async banUser(e10) {
          return this.requireId(e10), this.request({ method: "POST", path: rh(nT, e10, "ban") });
        }
        async unbanUser(e10) {
          return this.requireId(e10), this.request({ method: "POST", path: rh(nT, e10, "unban") });
        }
        async lockUser(e10) {
          return this.requireId(e10), this.request({ method: "POST", path: rh(nT, e10, "lock") });
        }
        async unlockUser(e10) {
          return this.requireId(e10), this.request({ method: "POST", path: rh(nT, e10, "unlock") });
        }
        async deleteUserProfileImage(e10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(nT, e10, "profile_image") });
        }
        async deleteUserPasskey(e10) {
          return this.requireId(e10.userId), this.requireId(e10.passkeyIdentificationId), this.request({ method: "DELETE", path: rh(nT, e10.userId, "passkeys", e10.passkeyIdentificationId) });
        }
        async deleteUserWeb3Wallet(e10) {
          return this.requireId(e10.userId), this.requireId(e10.web3WalletIdentificationId), this.request({ method: "DELETE", path: rh(nT, e10.userId, "web3_wallets", e10.web3WalletIdentificationId) });
        }
        async deleteUserExternalAccount(e10) {
          return this.requireId(e10.userId), this.requireId(e10.externalAccountId), this.request({ method: "DELETE", path: rh(nT, e10.userId, "external_accounts", e10.externalAccountId) });
        }
        async deleteUserBackupCodes(e10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(nT, e10, "backup_code") });
        }
        async deleteUserTOTP(e10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(nT, e10, "totp") });
        }
        async setPasswordCompromised(e10, t10 = { revokeAllSessions: false }) {
          return this.requireId(e10), this.request({ method: "POST", path: rh(nT, e10, "password", "set_compromised"), bodyParams: t10 });
        }
        async unsetPasswordCompromised(e10) {
          return this.requireId(e10), this.request({ method: "POST", path: rh(nT, e10, "password", "unset_compromised") });
        }
      }, nE = "/waitlist_entries", nO = class extends rp {
        async list(e10 = {}) {
          return this.request({ method: "GET", path: nE, queryParams: e10 });
        }
        async create(e10) {
          return this.request({ method: "POST", path: nE, bodyParams: e10 });
        }
        async createBulk(e10) {
          return this.request({ method: "POST", path: rh(nE, "bulk"), bodyParams: e10 });
        }
        async invite(e10, t10 = {}) {
          return this.requireId(e10), this.request({ method: "POST", path: rh(nE, e10, "invite"), bodyParams: t10 });
        }
        async reject(e10) {
          return this.requireId(e10), this.request({ method: "POST", path: rh(nE, e10, "reject") });
        }
        async delete(e10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(nE, e10) });
        }
      }, nC = "/webhooks", nI = class extends rp {
        async createSvixApp() {
          return this.request({ method: "POST", path: rh(nC, "svix") });
        }
        async generateSvixAuthURL() {
          return this.request({ method: "POST", path: rh(nC, "svix_url") });
        }
        async deleteSvixApp() {
          return this.request({ method: "DELETE", path: rh(nC, "svix") });
        }
      }, nP = "/billing", nA = class extends rp {
        async getPlanList(e10) {
          return this.request({ method: "GET", path: rh(nP, "plans"), queryParams: e10 });
        }
        async cancelSubscriptionItem(e10, t10) {
          return this.requireId(e10), this.request({ method: "DELETE", path: rh(nP, "subscription_items", e10), queryParams: t10 });
        }
        async extendSubscriptionItemFreeTrial(e10, t10) {
          return this.requireId(e10), this.request({ method: "POST", path: rh("/billing", "subscription_items", e10, "extend_free_trial"), bodyParams: t10 });
        }
        async getOrganizationBillingSubscription(e10) {
          return this.requireId(e10), this.request({ method: "GET", path: rh("/organizations", e10, "billing", "subscription") });
        }
        async getUserBillingSubscription(e10) {
          return this.requireId(e10), this.request({ method: "GET", path: rh("/users", e10, "billing", "subscription") });
        }
      }, nR = (e10) => "object" == typeof e10 && null !== e10, nN = (e10) => nR(e10) && !(e10 instanceof RegExp) && !(e10 instanceof Error) && !(e10 instanceof Date) && !(globalThis.Blob && e10 instanceof globalThis.Blob), nU = Symbol("mapObjectSkip"), nM = (e10, t10, r10, n10 = /* @__PURE__ */ new WeakMap()) => {
        if (r10 = { deep: false, target: {}, ...r10 }, n10.has(e10)) return n10.get(e10);
        n10.set(e10, r10.target);
        let { target: i10 } = r10;
        delete r10.target;
        let s10 = (e11) => e11.map((e12) => nN(e12) ? nM(e12, t10, r10, n10) : e12);
        if (Array.isArray(e10)) return s10(e10);
        for (let [a10, o10] of Object.entries(e10)) {
          let l2 = t10(a10, o10, e10);
          if (l2 === nU) continue;
          let [c2, u2, { shouldRecurse: d2 = true } = {}] = l2;
          "__proto__" !== c2 && (r10.deep && d2 && nN(u2) && (u2 = Array.isArray(u2) ? s10(u2) : nM(u2, t10, r10, n10)), i10[c2] = u2);
        }
        return i10;
      };
      function nL(e10, t10, r10) {
        if (!nR(e10)) throw TypeError(`Expected an object, got \`${e10}\` (${typeof e10})`);
        if (Array.isArray(e10)) throw TypeError("Expected an object, got an array");
        return nM(e10, t10, r10);
      }
      var nq = /([\p{Ll}\d])(\p{Lu})/gu, nD = /(\p{Lu})([\p{Lu}][\p{Ll}])/gu, nj = /(\d)\p{Ll}|(\p{L})\d/u, nB = /[^\p{L}\d]+/giu, nH = "$1\0$2";
      function nK(e10) {
        let t10 = e10.trim();
        t10 = (t10 = t10.replace(nq, nH).replace(nD, nH)).replace(nB, "\0");
        let r10 = 0, n10 = t10.length;
        for (; "\0" === t10.charAt(r10); ) r10++;
        if (r10 === n10) return [];
        for (; "\0" === t10.charAt(n10 - 1); ) n10--;
        return t10.slice(r10, n10).split(/\0/g);
      }
      function n$(e10) {
        let t10 = nK(e10);
        for (let e11 = 0; e11 < t10.length; e11++) {
          let r10 = t10[e11], n10 = nj.exec(r10);
          if (n10) {
            let i10 = n10.index + (n10[1] ?? n10[2]).length;
            t10.splice(e11, 1, r10.slice(0, i10), r10.slice(i10));
          }
        }
        return t10;
      }
      function nz(e10, t10) {
        return function(e11, t11) {
          var r10;
          let [n10, i10, s10] = function(e12, t12 = {}) {
            let r11 = t12.split ?? (t12.separateNumbers ? n$ : nK), n11 = t12.prefixCharacters ?? "", i11 = t12.suffixCharacters ?? "", s11 = 0, a10 = e12.length;
            for (; s11 < e12.length; ) {
              let t13 = e12.charAt(s11);
              if (!n11.includes(t13)) break;
              s11++;
            }
            for (; a10 > s11; ) {
              let t13 = a10 - 1, r12 = e12.charAt(t13);
              if (!i11.includes(r12)) break;
              a10 = t13;
            }
            return [e12.slice(0, s11), r11(e12.slice(s11, a10)), e12.slice(a10)];
          }(e11, t11);
          return n10 + i10.map(false === (r10 = t11?.locale) ? (e12) => e12.toLowerCase() : (e12) => e12.toLocaleLowerCase(r10)).join(t11?.delimiter ?? " ") + s10;
        }(e10, { delimiter: "_", ...t10 });
      }
      var nF = {}.constructor;
      function nJ(e10, t10) {
        return e10.some((e11) => "string" == typeof e11 ? e11 === t10 : e11.test(t10));
      }
      function nV(e10, t10, r10) {
        return r10.shouldRecurse ? { shouldRecurse: r10.shouldRecurse(e10, t10) } : void 0;
      }
      var nW = function(e10, t10) {
        if (Array.isArray(e10)) {
          if (e10.some((e11) => e11.constructor !== nF)) throw Error("obj must be array of plain objects");
          let r11 = (t10 = { deep: true, exclude: [], parsingOptions: {}, ...t10 }).snakeCase || ((e11) => nz(e11, t10.parsingOptions));
          return e10.map((e11) => nL(e11, (e12, n10) => [nJ(t10.exclude, e12) ? e12 : r11(e12), n10, nV(e12, n10, t10)], t10));
        }
        if (e10.constructor !== nF) throw Error("obj must be an plain object");
        let r10 = (t10 = { deep: true, exclude: [], parsingOptions: {}, ...t10 }).snakeCase || ((e11) => nz(e11, t10.parsingOptions));
        return nL(e10, (e11, n10) => [nJ(t10.exclude, e11) ? e11 : r10(e11), n10, nV(e11, n10, t10)], t10);
      }, nG = class e10 {
        constructor(e11, t10, r10, n10) {
          this.publishableKey = e11, this.secretKey = t10, this.claimUrl = r10, this.apiKeysUrl = n10;
        }
        static fromJSON(t10) {
          return new e10(t10.publishable_key, t10.secret_key, t10.claim_url, t10.api_keys_url);
        }
      }, nX = class e10 {
        constructor(e11, t10, r10) {
          this.agentId = e11, this.taskId = t10, this.url = r10;
        }
        static fromJSON(t10) {
          return new e10(t10.agent_id, t10.task_id, t10.url);
        }
      }, nY = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10) {
          this.id = e11, this.status = t10, this.userId = r10, this.actor = n10, this.token = i10, this.url = s10, this.createdAt = a10, this.updatedAt = o10;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.status, t10.user_id, t10.actor, t10.token, t10.url, t10.created_at, t10.updated_at);
        }
      }, nQ = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10) {
          this.id = e11, this.identifier = t10, this.identifierType = r10, this.createdAt = n10, this.updatedAt = i10, this.instanceId = s10, this.invitationId = a10;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.identifier, t10.identifier_type, t10.created_at, t10.updated_at, t10.instance_id, t10.invitation_id);
        }
      }, nZ = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10, l2, c2, u2, d2, h2, p2, f2, g2) {
          this.id = e11, this.type = t10, this.name = r10, this.subject = n10, this.scopes = i10, this.claims = s10, this.revoked = a10, this.revocationReason = o10, this.expired = l2, this.expiration = c2, this.createdBy = u2, this.description = d2, this.lastUsedAt = h2, this.createdAt = p2, this.updatedAt = f2, this.secret = g2;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.type, t10.name, t10.subject, t10.scopes, t10.claims, t10.revoked, t10.revocation_reason, t10.expired, t10.expiration, t10.created_by, t10.description, t10.last_used_at, t10.created_at, t10.updated_at, t10.secret);
        }
      }, n0 = class e10 {
        constructor(e11, t10, r10, n10, i10, s10) {
          this.id = e11, this.identifier = t10, this.identifierType = r10, this.createdAt = n10, this.updatedAt = i10, this.instanceId = s10;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.identifier, t10.identifier_type, t10.created_at, t10.updated_at, t10.instance_id);
        }
      }, n1 = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10) {
          this.id = e11, this.isMobile = t10, this.ipAddress = r10, this.city = n10, this.country = i10, this.browserVersion = s10, this.browserName = a10, this.deviceType = o10;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.is_mobile, t10.ip_address, t10.city, t10.country, t10.browser_version, t10.browser_name, t10.device_type);
        }
      }, n2 = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10, l2, c2, u2, d2 = null) {
          this.id = e11, this.clientId = t10, this.userId = r10, this.status = n10, this.lastActiveAt = i10, this.expireAt = s10, this.abandonAt = a10, this.createdAt = o10, this.updatedAt = l2, this.lastActiveOrganizationId = c2, this.latestActivity = u2, this.actor = d2;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.client_id, t10.user_id, t10.status, t10.last_active_at, t10.expire_at, t10.abandon_at, t10.created_at, t10.updated_at, t10.last_active_organization_id, t10.latest_activity && n1.fromJSON(t10.latest_activity), t10.actor);
        }
      }, n4 = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10, l2) {
          this.id = e11, this.sessionIds = t10, this.sessions = r10, this.signInId = n10, this.signUpId = i10, this.lastActiveSessionId = s10, this.lastAuthenticationStrategy = a10, this.createdAt = o10, this.updatedAt = l2;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.session_ids, t10.sessions.map((e11) => n2.fromJSON(e11)), t10.sign_in_id, t10.sign_up_id, t10.last_active_session_id, t10.last_authentication_strategy, t10.created_at, t10.updated_at);
        }
      }, n3 = class e10 {
        constructor(e11, t10, r10) {
          this.host = e11, this.value = t10, this.required = r10;
        }
        static fromJSON(t10) {
          return new e10(t10.host, t10.value, t10.required);
        }
      }, n5 = class e10 {
        constructor(e11) {
          this.cookies = e11;
        }
        static fromJSON(t10) {
          return new e10(t10.cookies);
        }
      }, n6 = class e10 {
        constructor(e11, t10, r10, n10) {
          this.object = e11, this.id = t10, this.slug = r10, this.deleted = n10;
        }
        static fromJSON(t10) {
          return new e10(t10.object, t10.id || null, t10.slug || null, t10.deleted);
        }
      }, n8 = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10) {
          this.id = e11, this.name = t10, this.isSatellite = r10, this.frontendApiUrl = n10, this.developmentOrigin = i10, this.cnameTargets = s10, this.accountsPortalUrl = a10, this.proxyUrl = o10;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.name, t10.is_satellite, t10.frontend_api_url, t10.development_origin, t10.cname_targets && t10.cname_targets.map((e11) => n3.fromJSON(e11)), t10.accounts_portal_url, t10.proxy_url);
        }
      }, n9 = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10, l2, c2, u2) {
          this.id = e11, this.fromEmailName = t10, this.emailAddressId = r10, this.toEmailAddress = n10, this.subject = i10, this.body = s10, this.bodyPlain = a10, this.status = o10, this.slug = l2, this.data = c2, this.deliveredByClerk = u2;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.from_email_name, t10.email_address_id, t10.to_email_address, t10.subject, t10.body, t10.body_plain, t10.status, t10.slug, t10.data, t10.delivered_by_clerk);
        }
      }, n7 = class e10 {
        constructor(e11, t10) {
          this.id = e11, this.type = t10;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.type);
        }
      }, ie = class e10 {
        constructor(e11, t10, r10 = null, n10 = null, i10 = null, s10 = null, a10 = null) {
          this.status = e11, this.strategy = t10, this.externalVerificationRedirectURL = r10, this.attempts = n10, this.expireAt = i10, this.nonce = s10, this.message = a10;
        }
        static fromJSON(t10) {
          return new e10(t10.status, t10.strategy, t10.external_verification_redirect_url ? new URL(t10.external_verification_redirect_url) : null, t10.attempts, t10.expire_at, t10.nonce);
        }
      }, it = class e10 {
        constructor(e11, t10, r10, n10) {
          this.id = e11, this.emailAddress = t10, this.verification = r10, this.linkedTo = n10;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.email_address, t10.verification && ie.fromJSON(t10.verification), t10.linked_to.map((e11) => n7.fromJSON(e11)));
        }
      }, ir = class e10 {
        constructor(e11, t10, r10, n10, i10) {
          this.id = e11, this.name = t10, this.description = r10, this.slug = n10, this.avatarUrl = i10;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.name, t10.description ?? null, t10.slug, t10.avatar_url ?? null);
        }
      }, ii = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10, l2, c2, u2, d2, h2, p2, f2, g2) {
          this.id = e11, this.name = t10, this.slug = r10, this.description = n10, this.isDefault = i10, this.isRecurring = s10, this.hasBaseFee = a10, this.publiclyVisible = o10, this.fee = l2, this.annualFee = c2, this.annualMonthlyFee = u2, this.forPayerType = d2, this.features = h2, this.avatarUrl = p2, this.freeTrialDays = f2, this.freeTrialEnabled = g2;
        }
        static fromJSON(t10) {
          let r10 = (e11) => e11 ? { amount: e11.amount, amountFormatted: e11.amount_formatted, currency: e11.currency, currencySymbol: e11.currency_symbol } : null;
          return new e10(t10.id, t10.name, t10.slug, t10.description ?? null, t10.is_default, t10.is_recurring, t10.has_base_fee, t10.publicly_visible, r10(t10.fee), r10(t10.annual_fee), r10(t10.annual_monthly_fee), t10.for_payer_type, (t10.features ?? []).map((e11) => ir.fromJSON(e11)), t10.avatar_url, t10.free_trial_days, t10.free_trial_enabled);
        }
      }, is = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10, l2, c2, u2, d2, h2, p2, f2, g2, m2) {
          this.id = e11, this.status = t10, this.planPeriod = r10, this.periodStart = n10, this.nextPayment = i10, this.amount = s10, this.plan = a10, this.planId = o10, this.createdAt = l2, this.updatedAt = c2, this.periodEnd = u2, this.canceledAt = d2, this.pastDueAt = h2, this.endedAt = p2, this.payerId = f2, this.isFreeTrial = g2, this.lifetimePaid = m2;
        }
        static fromJSON(t10) {
          function r10(e11) {
            return e11 ? { amount: e11.amount, amountFormatted: e11.amount_formatted, currency: e11.currency, currencySymbol: e11.currency_symbol } : e11;
          }
          return new e10(t10.id, t10.status, t10.plan_period, t10.period_start, t10.next_payment, r10(t10.amount) ?? void 0, t10.plan ? ii.fromJSON(t10.plan) : null, t10.plan_id ?? null, t10.created_at, t10.updated_at, t10.period_end, t10.canceled_at, t10.past_due_at, t10.ended_at, t10.payer_id, t10.is_free_trial, r10(t10.lifetime_paid) ?? void 0);
        }
      }, ia = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10, l2, c2) {
          this.id = e11, this.status = t10, this.payerId = r10, this.createdAt = n10, this.updatedAt = i10, this.activeAt = s10, this.pastDueAt = a10, this.subscriptionItems = o10, this.nextPayment = l2, this.eligibleForFreeTrial = c2;
        }
        static fromJSON(t10) {
          let r10 = t10.next_payment ? { date: t10.next_payment.date, amount: { amount: t10.next_payment.amount.amount, amountFormatted: t10.next_payment.amount.amount_formatted, currency: t10.next_payment.amount.currency, currencySymbol: t10.next_payment.amount.currency_symbol } } : null;
          return new e10(t10.id, t10.status, t10.payer_id, t10.created_at, t10.updated_at, t10.active_at ?? null, t10.past_due_at ?? null, (t10.subscription_items ?? []).map((e11) => is.fromJSON(e11)), r10, t10.eligible_for_free_trial ?? false);
        }
      }, io = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10, l2, c2, u2, d2, h2 = {}, p2, f2) {
          this.id = e11, this.provider = t10, this.providerUserId = r10, this.identificationId = n10, this.externalId = i10, this.approvedScopes = s10, this.emailAddress = a10, this.firstName = o10, this.lastName = l2, this.imageUrl = c2, this.username = u2, this.phoneNumber = d2, this.publicMetadata = h2, this.label = p2, this.verification = f2;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.provider, t10.provider_user_id, t10.identification_id, t10.provider_user_id, t10.approved_scopes, t10.email_address, t10.first_name, t10.last_name, t10.image_url || "", t10.username, t10.phone_number, t10.public_metadata, t10.label, t10.verification && ie.fromJSON(t10.verification));
        }
      }, il = class e10 {
        constructor(e11, t10, r10) {
          this.id = e11, this.environmentType = t10, this.allowedOrigins = r10;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.environment_type, t10.allowed_origins);
        }
      }, ic = class e10 {
        constructor(e11, t10, r10, n10, i10) {
          this.allowlist = e11, this.blocklist = t10, this.blockEmailSubaddresses = r10, this.blockDisposableEmailDomains = n10, this.ignoreDotsForGmailAddresses = i10;
        }
        static fromJSON(t10) {
          return new e10(t10.allowlist, t10.blocklist, t10.block_email_subaddresses, t10.block_disposable_email_domains, t10.ignore_dots_for_gmail_addresses);
        }
      }, iu = class e10 {
        constructor(e11, t10, r10, n10, i10) {
          this.id = e11, this.restrictedToAllowlist = t10, this.fromEmailAddress = r10, this.progressiveSignUp = n10, this.enhancedEmailDeliverability = i10;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.restricted_to_allowlist, t10.from_email_address, t10.progressive_sign_up, t10.enhanced_email_deliverability);
        }
      }, id = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10) {
          this.id = e11, this.emailAddress = t10, this.publicMetadata = r10, this.createdAt = n10, this.updatedAt = i10, this.status = s10, this.url = a10, this.revoked = o10, this._raw = null;
        }
        get raw() {
          return this._raw;
        }
        static fromJSON(t10) {
          let r10 = new e10(t10.id, t10.email_address, t10.public_metadata, t10.created_at, t10.updated_at, t10.status, t10.url, t10.revoked);
          return r10._raw = t10, r10;
        }
      }, ih = { AccountlessApplication: "accountless_application", ActorToken: "actor_token", AgentTask: "agent_task", AllowlistIdentifier: "allowlist_identifier", ApiKey: "api_key", BlocklistIdentifier: "blocklist_identifier", Client: "client", Cookies: "cookies", Domain: "domain", Email: "email", EmailAddress: "email_address", Instance: "instance", InstanceRestrictions: "instance_restrictions", InstanceSettings: "instance_settings", Invitation: "invitation", Machine: "machine", MachineScope: "machine_scope", MachineSecretKey: "machine_secret_key", M2MToken: "machine_to_machine_token", JwtTemplate: "jwt_template", OauthAccessToken: "oauth_access_token", IdpOAuthAccessToken: "clerk_idp_oauth_access_token", OAuthApplication: "oauth_application", Organization: "organization", OrganizationInvitation: "organization_invitation", OrganizationMembership: "organization_membership", OrganizationSettings: "organization_settings", PhoneNumber: "phone_number", ProxyCheck: "proxy_check", RedirectUrl: "redirect_url", SamlConnection: "saml_connection", Session: "session", SignInToken: "sign_in_token", SignUpAttempt: "sign_up_attempt", SmsMessage: "sms_message", User: "user", WaitlistEntry: "waitlist_entry", Token: "token", TotalCount: "total_count", BillingSubscription: "commerce_subscription", BillingSubscriptionItem: "commerce_subscription_item", BillingPlan: "commerce_plan", Feature: "feature" }, ip = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10, l2) {
          this.id = e11, this.name = t10, this.claims = r10, this.lifetime = n10, this.allowedClockSkew = i10, this.customSigningKey = s10, this.signingAlgorithm = a10, this.createdAt = o10, this.updatedAt = l2;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.name, t10.claims, t10.lifetime, t10.allowed_clock_skew, t10.custom_signing_key, t10.signing_algorithm, t10.created_at, t10.updated_at);
        }
      }, ig = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10) {
          this.id = e11, this.name = t10, this.instanceId = r10, this.createdAt = n10, this.updatedAt = i10, this.scopedMachines = s10, this.defaultTokenTtl = a10, this.secretKey = o10;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.name, t10.instance_id, t10.created_at, t10.updated_at, t10.scoped_machines.map((t11) => new e10(t11.id, t11.name, t11.instance_id, t11.created_at, t11.updated_at, [], t11.default_token_ttl)), t10.default_token_ttl, t10.secret_key);
        }
      }, im = class e10 {
        constructor(e11, t10, r10, n10) {
          this.fromMachineId = e11, this.toMachineId = t10, this.createdAt = r10, this.deleted = n10;
        }
        static fromJSON(t10) {
          return new e10(t10.from_machine_id, t10.to_machine_id, t10.created_at, t10.deleted);
        }
      }, iy = class e10 {
        constructor(e11) {
          this.secret = e11;
        }
        static fromJSON(t10) {
          return new e10(t10.secret);
        }
      }, ib = class e10 {
        constructor(e11, t10, r10, n10 = {}, i10, s10, a10, o10, l2) {
          this.externalAccountId = e11, this.provider = t10, this.token = r10, this.publicMetadata = n10, this.label = i10, this.scopes = s10, this.tokenSecret = a10, this.expiresAt = o10, this.idToken = l2;
        }
        static fromJSON(t10) {
          return new e10(t10.external_account_id, t10.provider, t10.token, t10.public_metadata, t10.label || "", t10.scopes, t10.token_secret, t10.expires_at, t10.id_token);
        }
      }, i_ = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10, l2, c2, u2, d2, h2, p2, f2, g2, m2, y2, b2, _2) {
          this.id = e11, this.instanceId = t10, this.name = r10, this.clientId = n10, this.clientUri = i10, this.clientImageUrl = s10, this.dynamicallyRegistered = a10, this.consentScreenEnabled = o10, this.pkceRequired = l2, this.isPublic = c2, this.scopes = u2, this.redirectUris = d2, this.authorizeUrl = h2, this.tokenFetchUrl = p2, this.userInfoUrl = f2, this.discoveryUrl = g2, this.tokenIntrospectionUrl = m2, this.createdAt = y2, this.updatedAt = b2, this.clientSecret = _2;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.instance_id, t10.name, t10.client_id, t10.client_uri, t10.client_image_url, t10.dynamically_registered, t10.consent_screen_enabled, t10.pkce_required, t10.public, t10.scopes, t10.redirect_uris, t10.authorize_url, t10.token_fetch_url, t10.user_info_url, t10.discovery_url, t10.token_introspection_url, t10.created_at, t10.updated_at, t10.client_secret);
        }
      }, iv = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10 = {}, l2 = {}, c2, u2, d2, h2) {
          this.id = e11, this.name = t10, this.slug = r10, this.imageUrl = n10, this.hasImage = i10, this.createdAt = s10, this.updatedAt = a10, this.publicMetadata = o10, this.privateMetadata = l2, this.maxAllowedMemberships = c2, this.adminDeleteEnabled = u2, this.membersCount = d2, this.createdBy = h2, this._raw = null;
        }
        get raw() {
          return this._raw;
        }
        static fromJSON(t10) {
          let r10 = new e10(t10.id, t10.name, t10.slug, t10.image_url || "", t10.has_image, t10.created_at, t10.updated_at, t10.public_metadata, t10.private_metadata, t10.max_allowed_memberships, t10.admin_delete_enabled, t10.members_count, t10.created_by);
          return r10._raw = t10, r10;
        }
      }, iw = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10, l2, c2, u2 = {}, d2 = {}, h2) {
          this.id = e11, this.emailAddress = t10, this.role = r10, this.roleName = n10, this.organizationId = i10, this.createdAt = s10, this.updatedAt = a10, this.expiresAt = o10, this.url = l2, this.status = c2, this.publicMetadata = u2, this.privateMetadata = d2, this.publicOrganizationData = h2, this._raw = null;
        }
        get raw() {
          return this._raw;
        }
        static fromJSON(t10) {
          let r10 = new e10(t10.id, t10.email_address, t10.role, t10.role_name, t10.organization_id, t10.created_at, t10.updated_at, t10.expires_at, t10.url, t10.status, t10.public_metadata, t10.private_metadata, t10.public_organization_data);
          return r10._raw = t10, r10;
        }
      }, ik = class e10 {
        constructor(e11, t10, r10, n10 = {}, i10 = {}, s10, a10, o10, l2) {
          this.id = e11, this.role = t10, this.permissions = r10, this.publicMetadata = n10, this.privateMetadata = i10, this.createdAt = s10, this.updatedAt = a10, this.organization = o10, this.publicUserData = l2, this._raw = null;
        }
        get raw() {
          return this._raw;
        }
        static fromJSON(t10) {
          let r10 = new e10(t10.id, t10.role, t10.permissions, t10.public_metadata, t10.private_metadata, t10.created_at, t10.updated_at, iv.fromJSON(t10.organization), iS.fromJSON(t10.public_user_data));
          return r10._raw = t10, r10;
        }
      }, iS = class e10 {
        constructor(e11, t10, r10, n10, i10, s10) {
          this.identifier = e11, this.firstName = t10, this.lastName = r10, this.imageUrl = n10, this.hasImage = i10, this.userId = s10;
        }
        static fromJSON(t10) {
          return new e10(t10.identifier, t10.first_name, t10.last_name, t10.image_url, t10.has_image, t10.user_id);
        }
      }, iT = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10, l2, c2) {
          this.enabled = e11, this.maxAllowedMemberships = t10, this.maxAllowedRoles = r10, this.maxAllowedPermissions = n10, this.creatorRole = i10, this.adminDeleteEnabled = s10, this.domainsEnabled = a10, this.slugDisabled = o10, this.domainsEnrollmentModes = l2, this.domainsDefaultRole = c2;
        }
        static fromJSON(t10) {
          return new e10(t10.enabled, t10.max_allowed_memberships, t10.max_allowed_roles, t10.max_allowed_permissions, t10.creator_role, t10.admin_delete_enabled, t10.domains_enabled, t10.slug_disabled, t10.domains_enrollment_modes, t10.domains_default_role);
        }
      }, ix = class e10 {
        constructor(e11, t10, r10, n10, i10, s10) {
          this.id = e11, this.phoneNumber = t10, this.reservedForSecondFactor = r10, this.defaultSecondFactor = n10, this.verification = i10, this.linkedTo = s10;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.phone_number, t10.reserved_for_second_factor, t10.default_second_factor, t10.verification && ie.fromJSON(t10.verification), t10.linked_to.map((e11) => n7.fromJSON(e11)));
        }
      }, iE = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10) {
          this.id = e11, this.domainId = t10, this.lastRunAt = r10, this.proxyUrl = n10, this.successful = i10, this.createdAt = s10, this.updatedAt = a10;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.domain_id, t10.last_run_at, t10.proxy_url, t10.successful, t10.created_at, t10.updated_at);
        }
      }, iO = class e10 {
        constructor(e11, t10, r10, n10) {
          this.id = e11, this.url = t10, this.createdAt = r10, this.updatedAt = n10;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.url, t10.created_at, t10.updated_at);
        }
      }, iC = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10, l2, c2, u2, d2, h2, p2, f2, g2, m2, y2, b2, _2, v2) {
          this.id = e11, this.name = t10, this.domain = r10, this.organizationId = n10, this.idpEntityId = i10, this.idpSsoUrl = s10, this.idpCertificate = a10, this.idpMetadataUrl = o10, this.idpMetadata = l2, this.acsUrl = c2, this.spEntityId = u2, this.spMetadataUrl = d2, this.active = h2, this.provider = p2, this.userCount = f2, this.syncUserAttributes = g2, this.allowSubdomains = m2, this.allowIdpInitiated = y2, this.createdAt = b2, this.updatedAt = _2, this.attributeMapping = v2;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.name, t10.domain, t10.organization_id, t10.idp_entity_id, t10.idp_sso_url, t10.idp_certificate, t10.idp_metadata_url, t10.idp_metadata, t10.acs_url, t10.sp_entity_id, t10.sp_metadata_url, t10.active, t10.provider, t10.user_count, t10.sync_user_attributes, t10.allow_subdomains, t10.allow_idp_initiated, t10.created_at, t10.updated_at, t10.attribute_mapping && iI.fromJSON(t10.attribute_mapping));
        }
      }, iI = class e10 {
        constructor(e11, t10, r10, n10) {
          this.userId = e11, this.emailAddress = t10, this.firstName = r10, this.lastName = n10;
        }
        static fromJSON(t10) {
          return new e10(t10.user_id, t10.email_address, t10.first_name, t10.last_name);
        }
      }, iP = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10) {
          this.id = e11, this.userId = t10, this.token = r10, this.status = n10, this.url = i10, this.createdAt = s10, this.updatedAt = a10;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.user_id, t10.token, t10.status, t10.url, t10.created_at, t10.updated_at);
        }
      }, iA = class e10 {
        constructor(e11, t10) {
          this.nextAction = e11, this.supportedStrategies = t10;
        }
        static fromJSON(t10) {
          return new e10(t10.next_action, t10.supported_strategies);
        }
      }, iR = class e10 {
        constructor(e11, t10, r10, n10) {
          this.emailAddress = e11, this.phoneNumber = t10, this.web3Wallet = r10, this.externalAccount = n10;
        }
        static fromJSON(t10) {
          return new e10(t10.email_address && iA.fromJSON(t10.email_address), t10.phone_number && iA.fromJSON(t10.phone_number), t10.web3_wallet && iA.fromJSON(t10.web3_wallet), t10.external_account);
        }
      }, iN = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10, l2, c2, u2, d2, h2, p2, f2, g2, m2, y2, b2, _2, v2, w2) {
          this.id = e11, this.status = t10, this.requiredFields = r10, this.optionalFields = n10, this.missingFields = i10, this.unverifiedFields = s10, this.verifications = a10, this.username = o10, this.emailAddress = l2, this.phoneNumber = c2, this.web3Wallet = u2, this.passwordEnabled = d2, this.firstName = h2, this.lastName = p2, this.customAction = f2, this.externalId = g2, this.createdSessionId = m2, this.createdUserId = y2, this.abandonAt = b2, this.legalAcceptedAt = _2, this.publicMetadata = v2, this.unsafeMetadata = w2;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.status, t10.required_fields, t10.optional_fields, t10.missing_fields, t10.unverified_fields, t10.verifications ? iR.fromJSON(t10.verifications) : null, t10.username, t10.email_address, t10.phone_number, t10.web3_wallet, t10.password_enabled, t10.first_name, t10.last_name, t10.custom_action, t10.external_id, t10.created_session_id, t10.created_user_id, t10.abandon_at, t10.legal_accepted_at, t10.public_metadata, t10.unsafe_metadata);
        }
      }, iU = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10) {
          this.id = e11, this.fromPhoneNumber = t10, this.toPhoneNumber = r10, this.message = n10, this.status = i10, this.phoneNumberId = s10, this.data = a10;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.from_phone_number, t10.to_phone_number, t10.message, t10.status, t10.phone_number_id, t10.data);
        }
      }, iM = class e10 {
        constructor(e11) {
          this.jwt = e11;
        }
        static fromJSON(t10) {
          return new e10(t10.jwt);
        }
      }, iL = class e10 {
        constructor(e11, t10, r10) {
          this.id = e11, this.web3Wallet = t10, this.verification = r10;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.web3_wallet, t10.verification && ie.fromJSON(t10.verification));
        }
      }, iq = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10, o10, l2, c2, u2, d2, h2, p2, f2, g2, m2, y2, b2, _2 = {}, v2 = {}, w2 = {}, k2 = [], S2 = [], T2 = [], x2 = [], E2, O2, C2 = null, I2, P2, A2) {
          this.id = e11, this.passwordEnabled = t10, this.totpEnabled = r10, this.backupCodeEnabled = n10, this.twoFactorEnabled = i10, this.banned = s10, this.locked = a10, this.createdAt = o10, this.updatedAt = l2, this.imageUrl = c2, this.hasImage = u2, this.primaryEmailAddressId = d2, this.primaryPhoneNumberId = h2, this.primaryWeb3WalletId = p2, this.lastSignInAt = f2, this.externalId = g2, this.username = m2, this.firstName = y2, this.lastName = b2, this.publicMetadata = _2, this.privateMetadata = v2, this.unsafeMetadata = w2, this.emailAddresses = k2, this.phoneNumbers = S2, this.web3Wallets = T2, this.externalAccounts = x2, this.lastActiveAt = E2, this.createOrganizationEnabled = O2, this.createOrganizationsLimit = C2, this.deleteSelfEnabled = I2, this.legalAcceptedAt = P2, this.locale = A2, this._raw = null;
        }
        get raw() {
          return this._raw;
        }
        static fromJSON(t10) {
          let r10 = new e10(t10.id, t10.password_enabled, t10.totp_enabled, t10.backup_code_enabled, t10.two_factor_enabled, t10.banned, t10.locked, t10.created_at, t10.updated_at, t10.image_url, t10.has_image, t10.primary_email_address_id, t10.primary_phone_number_id, t10.primary_web3_wallet_id, t10.last_sign_in_at, t10.external_id, t10.username, t10.first_name, t10.last_name, t10.public_metadata, t10.private_metadata, t10.unsafe_metadata, (t10.email_addresses || []).map((e11) => it.fromJSON(e11)), (t10.phone_numbers || []).map((e11) => ix.fromJSON(e11)), (t10.web3_wallets || []).map((e11) => iL.fromJSON(e11)), (t10.external_accounts || []).map((e11) => io.fromJSON(e11)), t10.last_active_at, t10.create_organization_enabled, t10.create_organizations_limit, t10.delete_self_enabled, t10.legal_accepted_at, t10.locale);
          return r10._raw = t10, r10;
        }
        get primaryEmailAddress() {
          return this.emailAddresses.find(({ id: e11 }) => e11 === this.primaryEmailAddressId) ?? null;
        }
        get primaryPhoneNumber() {
          return this.phoneNumbers.find(({ id: e11 }) => e11 === this.primaryPhoneNumberId) ?? null;
        }
        get primaryWeb3Wallet() {
          return this.web3Wallets.find(({ id: e11 }) => e11 === this.primaryWeb3WalletId) ?? null;
        }
        get fullName() {
          return [this.firstName, this.lastName].join(" ").trim() || null;
        }
      }, iD = class e10 {
        constructor(e11, t10, r10, n10, i10, s10, a10) {
          this.id = e11, this.emailAddress = t10, this.status = r10, this.invitation = n10, this.createdAt = i10, this.updatedAt = s10, this.isLocked = a10;
        }
        static fromJSON(t10) {
          return new e10(t10.id, t10.email_address, t10.status, t10.invitation && id.fromJSON(t10.invitation), t10.created_at, t10.updated_at, t10.is_locked);
        }
      };
      function ij(e10) {
        if ("string" != typeof e10 && "object" in e10 && "deleted" in e10) return n6.fromJSON(e10);
        switch (e10.object) {
          case ih.AccountlessApplication:
            return nG.fromJSON(e10);
          case ih.ActorToken:
            return nY.fromJSON(e10);
          case ih.AllowlistIdentifier:
            return nQ.fromJSON(e10);
          case ih.ApiKey:
            return nZ.fromJSON(e10);
          case ih.BlocklistIdentifier:
            return n0.fromJSON(e10);
          case ih.Client:
            return n4.fromJSON(e10);
          case ih.Cookies:
            return n5.fromJSON(e10);
          case ih.Domain:
            return n8.fromJSON(e10);
          case ih.EmailAddress:
            return it.fromJSON(e10);
          case ih.Email:
            return n9.fromJSON(e10);
          case ih.IdpOAuthAccessToken:
            return rB.fromJSON(e10);
          case ih.Instance:
            return il.fromJSON(e10);
          case ih.InstanceRestrictions:
            return ic.fromJSON(e10);
          case ih.InstanceSettings:
            return iu.fromJSON(e10);
          case ih.Invitation:
            return id.fromJSON(e10);
          case ih.JwtTemplate:
            return ip.fromJSON(e10);
          case ih.Machine:
            return ig.fromJSON(e10);
          case ih.MachineScope:
            return im.fromJSON(e10);
          case ih.MachineSecretKey:
            return iy.fromJSON(e10);
          case ih.M2MToken:
            return rH.fromJSON(e10);
          case ih.OauthAccessToken:
            return ib.fromJSON(e10);
          case ih.OAuthApplication:
            return i_.fromJSON(e10);
          case ih.Organization:
            return iv.fromJSON(e10);
          case ih.OrganizationInvitation:
            return iw.fromJSON(e10);
          case ih.OrganizationMembership:
            return ik.fromJSON(e10);
          case ih.OrganizationSettings:
            return iT.fromJSON(e10);
          case ih.PhoneNumber:
            return ix.fromJSON(e10);
          case ih.ProxyCheck:
            return iE.fromJSON(e10);
          case ih.RedirectUrl:
            return iO.fromJSON(e10);
          case ih.SamlConnection:
            return iC.fromJSON(e10);
          case ih.SignInToken:
            return iP.fromJSON(e10);
          case ih.AgentTask:
            return nX.fromJSON(e10);
          case ih.SignUpAttempt:
            return iN.fromJSON(e10);
          case ih.Session:
            return n2.fromJSON(e10);
          case ih.SmsMessage:
            return iU.fromJSON(e10);
          case ih.Token:
            return iM.fromJSON(e10);
          case ih.TotalCount:
            return e10.total_count;
          case ih.User:
            return iq.fromJSON(e10);
          case ih.WaitlistEntry:
            return iD.fromJSON(e10);
          case ih.BillingPlan:
            return ii.fromJSON(e10);
          case ih.BillingSubscription:
            return ia.fromJSON(e10);
          case ih.BillingSubscriptionItem:
            return is.fromJSON(e10);
          case ih.Feature:
            return ir.fromJSON(e10);
          default:
            return e10;
        }
      }
      function iB(e10) {
        var t10;
        return t10 = async (t11) => {
          let r10;
          let { secretKey: n10, machineSecretKey: i10, useMachineSecretKey: s10 = false, requireSecretKey: a10 = true, apiUrl: o10 = t6, apiVersion: l2 = "v1", userAgent: c2 = t8, skipApiVersionInUrl: u2 = false } = e10, { path: d2, method: h2, queryParams: p2, headerParams: f2, bodyParams: g2, formData: m2, options: y2 } = t11, { deepSnakecaseBodyParamKeys: b2 = false } = y2 || {};
          a10 && ro(n10);
          let _2 = new URL(u2 ? rh(o10, d2) : rh(o10, l2, d2));
          if (p2) for (let [e11, t12] of Object.entries(nW({ ...p2 }))) t12 && [t12].flat().forEach((t13) => _2.searchParams.append(e11, t13));
          let v2 = new Headers({ "Clerk-API-Version": t9, [rr.Headers.UserAgent]: c2, ...f2 }), w2 = rr.Headers.Authorization;
          !v2.has(w2) && (s10 && i10 ? v2.set(w2, `Bearer ${i10}`) : n10 && v2.set(w2, `Bearer ${n10}`));
          try {
            m2 ? r10 = await tc.fetch(_2.href, { method: h2, headers: v2, body: m2 }) : (v2.set("Content-Type", "application/json"), r10 = await tc.fetch(_2.href, { method: h2, headers: v2, ...(() => {
              if (!("GET" !== h2 && g2 && Object.keys(g2).length > 0)) return null;
              let e12 = (e13) => nW(e13, { deep: b2 });
              return { body: JSON.stringify(Array.isArray(g2) ? g2.map(e12) : e12(g2)) };
            })() }));
            let e11 = r10?.headers && r10.headers?.get(rr.Headers.ContentType) === rr.ContentTypes.Json, t12 = await (e11 ? r10.json() : r10.text());
            if (!r10.ok) return { data: null, errors: i$(t12), status: r10?.status, statusText: r10?.statusText, clerkTraceId: iH(t12, r10?.headers), retryAfter: iK(r10?.headers) };
            return { ...function(e12) {
              let t13;
              return Array.isArray(e12) ? { data: e12.map((e13) => ij(e13)) } : e12 && "object" == typeof e12 && "m2m_tokens" in e12 && Array.isArray(e12.m2m_tokens) ? { data: e12.m2m_tokens.map((e13) => ij(e13)), totalCount: e12.total_count } : e12 && "object" == typeof e12 && "data" in e12 && Array.isArray(e12.data) && void 0 !== e12.data ? { data: e12.data.map((e13) => ij(e13)), totalCount: e12.total_count } : { data: ij(e12) };
            }(t12), errors: null };
          } catch (e11) {
            if (e11 instanceof Error) return { data: null, errors: [{ code: "unexpected_error", message: e11.message || "Unexpected error" }], clerkTraceId: iH(e11, r10?.headers) };
            return { data: null, errors: i$(e11), status: r10?.status, statusText: r10?.statusText, clerkTraceId: iH(e11, r10?.headers), retryAfter: iK(r10?.headers) };
          }
        }, async (...e11) => {
          let { data: r10, errors: n10, totalCount: i10, status: s10, statusText: a10, clerkTraceId: o10, retryAfter: l2 } = await t10(...e11);
          if (n10) {
            let e12 = new e5(a10 || "", { data: [], status: s10, clerkTraceId: o10, retryAfter: l2 });
            throw e12.errors = n10, e12;
          }
          return void 0 !== i10 ? { data: r10, totalCount: i10 } : r10;
        };
      }
      function iH(e10, t10) {
        return e10 && "object" == typeof e10 && "clerk_trace_id" in e10 && "string" == typeof e10.clerk_trace_id ? e10.clerk_trace_id : t10?.get("cf-ray") || "";
      }
      function iK(e10) {
        let t10 = e10?.get("Retry-After");
        if (!t10) return;
        let r10 = parseInt(t10, 10);
        if (!isNaN(r10)) return r10;
      }
      function i$(e10) {
        if (e10 && "object" == typeof e10 && "errors" in e10) {
          let t10 = e10.errors;
          return t10.length > 0 ? t10.map(e3) : [];
        }
        return [];
      }
      function iz(e10) {
        let t10 = iB(e10);
        return { __experimental_accountlessApplications: new r_(iB({ ...e10, requireSecretKey: false })), actorTokens: new rg(t10), agentTasks: new ry(t10), allowlistIdentifiers: new rw(t10), apiKeys: new rS(iB({ ...e10, skipApiVersionInUrl: true })), betaFeatures: new rT(t10), blocklistIdentifiers: new rE(t10), billing: new nA(t10), clients: new rC(t10), domains: new rP(t10), emailAddresses: new rR(t10), idPOAuthAccessToken: new rN(iB({ ...e10, skipApiVersionInUrl: true })), instance: new rM(t10), invitations: new rq(t10), jwks: new nn(t10), jwtTemplates: new ns(t10), machines: new rj(t10), m2m: new nr(iB({ ...e10, skipApiVersionInUrl: true, requireSecretKey: false, useMachineSecretKey: true }), { secretKey: e10.secretKey, apiUrl: e10.apiUrl, jwtKey: e10.jwtKey }), oauthApplications: new nc(t10), organizations: new no(t10), phoneNumbers: new nd(t10), proxyChecks: new nh(t10), redirectUrls: new nf(t10), samlConnections: new nm(t10), sessions: new nb(t10), signInTokens: new nv(t10), signUps: new nk(t10), testingTokens: new nS(t10), users: new nx(t10), waitlistEntries: new nO(t10), webhooks: new nI(t10) };
      }
      var iF = (e10) => () => {
        let t10 = { ...e10 };
        return t10.secretKey = (t10.secretKey || "").substring(0, 7), t10.jwtKey = (t10.jwtKey || "").substring(0, 7), { ...t10 };
      };
      function iJ(e10, t10) {
        return { tokenType: rl.SessionToken, sessionClaims: null, sessionId: null, sessionStatus: t10 ?? null, userId: null, actor: null, orgId: null, orgRole: null, orgSlug: null, orgPermissions: null, factorVerificationAge: null, getToken: () => Promise.resolve(null), has: () => false, debug: iF(e10), isAuthenticated: false };
      }
      function iV(e10, t10) {
        let r10 = { id: null, subject: null, scopes: null, has: () => false, getToken: () => Promise.resolve(null), debug: iF(t10), isAuthenticated: false };
        switch (e10) {
          case rl.ApiKey:
            return { ...r10, tokenType: e10, name: null, claims: null, scopes: null, userId: null, orgId: null };
          case rl.M2MToken:
            return { ...r10, tokenType: e10, claims: null, scopes: null, machineId: null };
          case rl.OAuthToken:
            return { ...r10, tokenType: e10, scopes: null, userId: null, clientId: null };
          default:
            throw Error(`Invalid token type: ${e10}`);
        }
      }
      function iW() {
        return { isAuthenticated: false, tokenType: null, getToken: () => Promise.resolve(null), has: () => false, debug: () => ({}) };
      }
      var iG = (e10) => {
        let { debug: t10, getToken: r10, has: n10, ...i10 } = e10;
        return i10;
      }, iX = (e10) => {
        let { fetcher: t10, sessionToken: r10, sessionId: n10 } = e10 || {};
        return async (e11 = {}) => n10 ? e11.template || void 0 !== e11.expiresInSeconds ? t10(n10, e11.template, e11.expiresInSeconds) : r10 : null;
      }, iY = ({ authObject: e10, acceptsToken: t10 = rl.SessionToken }) => "any" === t10 ? e10 : Array.isArray(t10) ? r6(e10.tokenType, t10) ? e10 : iW() : r6(e10.tokenType, t10) ? e10 : r8.has(t10) ? iV(t10, e10.debug) : iJ(e10.debug), iQ = { SignedIn: "signed-in", SignedOut: "signed-out", Handshake: "handshake" }, iZ = { ClientUATWithoutSessionToken: "client-uat-but-no-session-token", DevBrowserMissing: "dev-browser-missing", DevBrowserSync: "dev-browser-sync", PrimaryRespondsToSyncing: "primary-responds-to-syncing", PrimaryDomainCrossOriginSync: "primary-domain-cross-origin-sync", SatelliteCookieNeedsSyncing: "satellite-needs-syncing", SessionTokenAndUATMissing: "session-token-and-uat-missing", SessionTokenMissing: "session-token-missing", SessionTokenExpired: "session-token-expired", SessionTokenIATBeforeClientUAT: "session-token-iat-before-client-uat", SessionTokenNBF: "session-token-nbf", SessionTokenIatInTheFuture: "session-token-iat-in-the-future", SessionTokenWithoutClientUAT: "session-token-but-no-client-uat", ActiveOrganizationMismatch: "active-organization-mismatch", TokenTypeMismatch: "token-type-mismatch", UnexpectedError: "unexpected-error" };
      function i0(e10) {
        let { authenticateContext: t10, headers: r10 = new Headers(), token: n10 } = e10;
        return { status: iQ.SignedIn, reason: null, message: null, proxyUrl: t10.proxyUrl || "", publishableKey: t10.publishableKey || "", isSatellite: t10.isSatellite || false, domain: t10.domain || "", signInUrl: t10.signInUrl || "", signUpUrl: t10.signUpUrl || "", afterSignInUrl: t10.afterSignInUrl || "", afterSignUpUrl: t10.afterSignUpUrl || "", isSignedIn: true, isAuthenticated: true, tokenType: e10.tokenType, toAuth: ({ treatPendingAsSignedOut: r11 = true } = {}) => {
          if (e10.tokenType === rl.SessionToken) {
            let { sessionClaims: i11 } = e10, s10 = function(e11, t11, r12) {
              let { actor: n11, sessionId: i12, sessionStatus: s11, userId: a10, orgId: o10, orgRole: l2, orgSlug: c2, orgPermissions: u2, factorVerificationAge: d2 } = t3(r12), h2 = iz(e11), p2 = iX({ sessionId: i12, sessionToken: t11, fetcher: async (e12, t12, r13) => (await h2.sessions.getToken(e12, t12 || "", r13)).jwt });
              return { tokenType: rl.SessionToken, actor: n11, sessionClaims: r12, sessionId: i12, sessionStatus: s11, userId: a10, orgId: o10, orgRole: l2, orgSlug: c2, orgPermissions: u2, factorVerificationAge: d2, getToken: p2, has: t2({ orgId: o10, orgRole: l2, orgPermissions: u2, userId: a10, factorVerificationAge: d2, features: r12.fea || "", plans: r12.pla || "" }), debug: iF({ ...e11, sessionToken: t11 }), isAuthenticated: true };
            }(t10, n10, i11);
            return r11 && "pending" === s10.sessionStatus ? iJ(void 0, s10.sessionStatus) : s10;
          }
          let { machineData: i10 } = e10;
          return function(e11, t11, r12, n11) {
            let i11 = { id: r12.id, subject: r12.subject, getToken: () => Promise.resolve(t11), has: () => false, debug: iF(n11), isAuthenticated: true };
            switch (e11) {
              case rl.ApiKey:
                return { ...i11, tokenType: e11, name: r12.name, claims: r12.claims, scopes: r12.scopes, userId: r12.subject.startsWith("user_") ? r12.subject : null, orgId: r12.subject.startsWith("org_") ? r12.subject : null };
              case rl.M2MToken:
                return { ...i11, tokenType: e11, claims: r12.claims, scopes: r12.scopes, machineId: r12.subject };
              case rl.OAuthToken:
                return { ...i11, tokenType: e11, scopes: r12.scopes, userId: r12.subject, clientId: r12.clientId };
              default:
                throw Error(`Invalid token type: ${e11}`);
            }
          }(e10.tokenType, n10, i10, t10);
        }, headers: r10, token: n10 };
      }
      function i1(e10) {
        let { authenticateContext: t10, headers: r10 = new Headers(), reason: n10, message: i10 = "", tokenType: s10 } = e10;
        return i2({ status: iQ.SignedOut, reason: n10, message: i10, proxyUrl: t10.proxyUrl || "", publishableKey: t10.publishableKey || "", isSatellite: t10.isSatellite || false, domain: t10.domain || "", signInUrl: t10.signInUrl || "", signUpUrl: t10.signUpUrl || "", afterSignInUrl: t10.afterSignInUrl || "", afterSignUpUrl: t10.afterSignUpUrl || "", isSignedIn: false, isAuthenticated: false, tokenType: s10, toAuth: () => s10 === rl.SessionToken ? iJ({ ...t10, status: iQ.SignedOut, reason: n10, message: i10 }) : iV(s10, { reason: n10, message: i10, headers: r10 }), headers: r10, token: null });
      }
      var i2 = (e10) => {
        let t10 = new Headers(e10.headers || {});
        if (e10.message) try {
          t10.set(rr.Headers.AuthMessage, e10.message);
        } catch {
        }
        if (e10.reason) try {
          t10.set(rr.Headers.AuthReason, e10.reason);
        } catch {
        }
        if (e10.status) try {
          t10.set(rr.Headers.AuthStatus, e10.status);
        } catch {
        }
        return e10.headers = t10, e10;
      }, i4 = (l = null != (a = t5()) ? tC(tR(a)) : {}, ((e10, t10, r10, n10) => {
        if (t10 && "object" == typeof t10 || "function" == typeof t10) for (let i10 of tA(t10)) tN.call(e10, i10) || i10 === r10 || tI(e10, i10, { get: () => t10[i10], enumerable: !(n10 = tP(t10, i10)) || n10.enumerable });
        return e10;
      })(!o && a && a.__esModule ? l : tI(l, "default", { value: a, enumerable: true }), a)), i3 = class extends URL {
        isCrossOrigin(e10) {
          return this.origin !== new URL(e10.toString()).origin;
        }
      }, i5 = (...e10) => new i3(...e10), i6 = class extends Request {
        constructor(e10, t10) {
          super("string" != typeof e10 && "url" in e10 ? e10.url : String(e10), t10 || "string" == typeof e10 ? void 0 : e10), this.clerkUrl = this.deriveUrlFromHeaders(this), this.cookies = this.parseCookies(this);
        }
        toJSON() {
          return { url: this.clerkUrl.href, method: this.method, headers: JSON.stringify(Object.fromEntries(this.headers)), clerkUrl: this.clerkUrl.toString(), cookies: JSON.stringify(Object.fromEntries(this.cookies)) };
        }
        deriveUrlFromHeaders(e10) {
          let t10 = new URL(e10.url), r10 = e10.headers.get(rr.Headers.ForwardedProto), n10 = e10.headers.get(rr.Headers.ForwardedHost), i10 = e10.headers.get(rr.Headers.Host), s10 = t10.protocol, a10 = this.getFirstValueFromHeader(n10) ?? i10, o10 = this.getFirstValueFromHeader(r10) ?? s10?.replace(/[:/]/, ""), l2 = a10 && o10 ? `${o10}://${a10}` : t10.origin;
          if (l2 === t10.origin) return i5(t10);
          try {
            return i5(t10.pathname + t10.search, l2);
          } catch {
            return i5(t10);
          }
        }
        getFirstValueFromHeader(e10) {
          return e10?.split(",")[0];
        }
        parseCookies(e10) {
          return new Map(Object.entries((0, i4.parse)(this.decodeCookieValue(e10.headers.get("cookie") || ""))));
        }
        decodeCookieValue(e10) {
          return e10 ? e10.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent) : e10;
        }
      }, i8 = (...e10) => e10[0] && "object" == typeof e10[0] && "clerkUrl" in e10[0] && "cookies" in e10[0] ? e10[0] : new i6(...e10), i9 = (e10) => e10.split(";")[0]?.split("=")[0], i7 = (e10) => e10.split(";")[0]?.split("=")[1];
      async function se(e10, t10) {
        let { data: r10, errors: n10 } = tE(e10);
        if (n10) return { errors: n10 };
        let { header: i10 } = r10, { kid: s10 } = i10;
        try {
          let r11;
          if (t10.jwtKey) r11 = rF({ kid: s10, pem: t10.jwtKey });
          else {
            if (!t10.secretKey) return { errors: [new ti({ action: tn.SetClerkJWTKey, message: "Failed to resolve JWK during verification.", reason: tr.JWKFailedToResolve })] };
            r11 = await rJ({ ...t10, kid: s10 });
          }
          return await tO(e10, { ...t10, key: r11 });
        } catch (e11) {
          return { errors: [e11] };
        }
      }
      function st(e10, t10, r10) {
        if (e6(t10)) {
          let n10, i10;
          switch (t10.status) {
            case 401:
              n10 = ts.InvalidSecretKey, i10 = t10.errors[0]?.message || "Invalid secret key";
              break;
            case 404:
              n10 = ts.TokenInvalid, i10 = r10;
              break;
            default:
              n10 = ts.UnexpectedError, i10 = "Unexpected error";
          }
          return { data: void 0, tokenType: e10, errors: [new ta({ message: i10, code: n10, status: t10.status })] };
        }
        return { data: void 0, tokenType: e10, errors: [new ta({ message: "Unexpected error", code: ts.UnexpectedError, status: t10.status })] };
      }
      async function sr(e10, t10) {
        try {
          let r10 = iz(t10);
          return { data: await r10.m2m.verify({ token: e10 }), tokenType: rl.M2MToken, errors: void 0 };
        } catch (e11) {
          return st(rl.M2MToken, e11, "Machine token not found");
        }
      }
      async function sn(e10, t10) {
        try {
          let r10 = iz(t10);
          return { data: await r10.idPOAuthAccessToken.verify(e10), tokenType: rl.OAuthToken, errors: void 0 };
        } catch (e11) {
          return st(rl.OAuthToken, e11, "OAuth token not found");
        }
      }
      async function si(e10, t10) {
        try {
          let r10 = iz(t10);
          return { data: await r10.apiKeys.verify(e10), tokenType: rl.ApiKey, errors: void 0 };
        } catch (e11) {
          return st(rl.ApiKey, e11, "API key not found");
        }
      }
      async function ss(e10, t10) {
        if (rZ(e10)) {
          let r10;
          try {
            let { data: t11, errors: n10 } = tE(e10);
            if (n10) throw n10[0];
            r10 = t11;
          } catch (e11) {
            return { data: void 0, tokenType: rl.M2MToken, errors: [new ta({ code: ts.TokenInvalid, message: e11.message })] };
          }
          return r10.payload.sub.startsWith(rG) ? r7(e10, r10, t10) : r0.includes(r10.header.typ) ? ne(e10, r10, t10) : { data: void 0, tokenType: rl.OAuthToken, errors: [new ta({ code: ts.TokenVerificationFailed, message: `Invalid JWT type: ${r10.header.typ ?? "missing"}. Expected one of: ${r0.join(", ")} for OAuth, or sub starting with 'mch_' for M2M` })] };
        }
        if (e10.startsWith("mt_")) return sr(e10, t10);
        if (e10.startsWith(rX)) return sn(e10, t10);
        if (e10.startsWith("ak_")) return si(e10, t10);
        throw Error("Unknown machine token type");
      }
      async function sa(e10, { key: t10 }) {
        let { data: r10, errors: n10 } = tE(e10);
        if (n10) throw n10[0];
        let { header: i10, payload: s10 } = r10, { typ: a10, alg: o10 } = i10;
        tb(a10), t_(o10);
        let { data: l2, errors: c2 } = await tx(r10, t10);
        if (c2) throw new ti({ reason: tr.TokenVerificationFailed, message: `Error verifying handshake token. ${c2[0]}` });
        if (!l2) throw new ti({ reason: tr.TokenInvalidSignature, message: "Handshake signature is invalid." });
        return s10;
      }
      async function so(e10, t10) {
        let r10;
        let { secretKey: n10, apiUrl: i10, apiVersion: s10, jwksCacheTtlInMs: a10, jwtKey: o10, skipJwksCache: l2 } = t10, { data: c2, errors: u2 } = tE(e10);
        if (u2) throw u2[0];
        let { kid: d2 } = c2.header;
        if (o10) r10 = rF({ kid: d2, pem: o10 });
        else if (n10) r10 = await rJ({ secretKey: n10, apiUrl: i10, apiVersion: s10, kid: d2, jwksCacheTtlInMs: a10, skipJwksCache: l2 });
        else throw new ti({ action: tn.SetClerkJWTKey, message: "Failed to resolve JWK during handshake verification.", reason: tr.JWKFailedToResolve });
        return sa(e10, { key: r10 });
      }
      var sl = class {
        constructor(e10, t10, r10) {
          this.authenticateContext = e10, this.options = t10, this.organizationMatcher = r10;
        }
        isRequestEligibleForHandshake() {
          let { accept: e10, secFetchDest: t10 } = this.authenticateContext;
          return !!("document" === t10 || "iframe" === t10 || !t10 && e10?.startsWith("text/html"));
        }
        buildRedirectToHandshake(e10) {
          if (!this.authenticateContext?.clerkUrl) throw Error("Missing clerkUrl in authenticateContext");
          let t10 = this.removeDevBrowserFromURL(this.authenticateContext.clerkUrl), r10 = this.authenticateContext.frontendApi.startsWith("http") ? this.authenticateContext.frontendApi : `https://${this.authenticateContext.frontendApi}`, n10 = new URL("v1/client/handshake", r10 = r10.replace(/\/+$/, "") + "/");
          n10.searchParams.append("redirect_url", t10?.href || ""), n10.searchParams.append("__clerk_api_version", t9), n10.searchParams.append(rr.QueryParameters.SuffixedCookies, this.authenticateContext.usesSuffixedCookies().toString()), n10.searchParams.append(rr.QueryParameters.HandshakeReason, e10), n10.searchParams.append(rr.QueryParameters.HandshakeFormat, "nonce"), this.authenticateContext.sessionToken && n10.searchParams.append(rr.QueryParameters.Session, this.authenticateContext.sessionToken), "development" === this.authenticateContext.instanceType && this.authenticateContext.devBrowserToken && n10.searchParams.append(rr.QueryParameters.DevBrowser, this.authenticateContext.devBrowserToken);
          let i10 = this.getOrganizationSyncTarget(this.authenticateContext.clerkUrl, this.organizationMatcher);
          return i10 && this.getOrganizationSyncQueryParams(i10).forEach((e11, t11) => {
            n10.searchParams.append(t11, e11);
          }), new Headers({ [rr.Headers.Location]: n10.href });
        }
        async getCookiesFromHandshake() {
          let e10 = [];
          if (this.authenticateContext.handshakeNonce) try {
            let t10 = await this.authenticateContext.apiClient?.clients.getHandshakePayload({ nonce: this.authenticateContext.handshakeNonce });
            t10 && e10.push(...t10.directives);
          } catch (e11) {
            console.error("Clerk: HandshakeService: error getting handshake payload:", e11);
          }
          else if (this.authenticateContext.handshakeToken) {
            let t10 = await so(this.authenticateContext.handshakeToken, this.authenticateContext);
            t10 && Array.isArray(t10.handshake) && e10.push(...t10.handshake);
          }
          return e10;
        }
        async resolveHandshake() {
          let e10 = new Headers({ "Access-Control-Allow-Origin": "null", "Access-Control-Allow-Credentials": "true" }), t10 = await this.getCookiesFromHandshake(), r10 = "";
          if (t10.forEach((t11) => {
            e10.append("Set-Cookie", t11), i9(t11).startsWith(rr.Cookies.Session) && (r10 = i7(t11));
          }), "development" === this.authenticateContext.instanceType) {
            let t11 = new URL(this.authenticateContext.clerkUrl);
            t11.searchParams.delete(rr.QueryParameters.Handshake), t11.searchParams.delete(rr.QueryParameters.HandshakeHelp), t11.searchParams.delete(rr.QueryParameters.DevBrowser), t11.searchParams.delete(rr.QueryParameters.HandshakeNonce), e10.append(rr.Headers.Location, t11.toString()), e10.set(rr.Headers.CacheControl, "no-store");
          }
          if ("" === r10) return i1({ tokenType: rl.SessionToken, authenticateContext: this.authenticateContext, reason: iZ.SessionTokenMissing, message: "", headers: e10 });
          let { data: n10, errors: [i10] = [] } = await se(r10, this.authenticateContext);
          if (n10) return i0({ tokenType: rl.SessionToken, authenticateContext: this.authenticateContext, sessionClaims: n10, headers: e10, token: r10 });
          if ("development" === this.authenticateContext.instanceType && (i10?.reason === tr.TokenExpired || i10?.reason === tr.TokenNotActiveYet || i10?.reason === tr.TokenIatInTheFuture)) {
            let t11 = new ti({ action: i10.action, message: i10.message, reason: i10.reason });
            t11.tokenCarrier = "cookie", console.error(`Clerk: Clock skew detected. This usually means that your system clock is inaccurate. Clerk will attempt to account for the clock skew in development.

To resolve this issue, make sure your system's clock is set to the correct time (e.g. turn off and on automatic time synchronization).

---

${t11.getFullMessage()}`);
            let { data: n11, errors: [s10] = [] } = await se(r10, { ...this.authenticateContext, clockSkewInMs: 864e5 });
            if (n11) return i0({ tokenType: rl.SessionToken, authenticateContext: this.authenticateContext, sessionClaims: n11, headers: e10, token: r10 });
            throw Error(s10?.message || "Clerk: Handshake retry failed.");
          }
          throw Error(i10?.message || "Clerk: Handshake failed.");
        }
        handleTokenVerificationErrorInDevelopment(e10) {
          if (e10.reason === tr.TokenInvalidSignature) throw Error("Clerk: Handshake token verification failed due to an invalid signature. If you have switched Clerk keys locally, clear your cookies and try again.");
          throw Error(`Clerk: Handshake token verification failed: ${e10.getFullMessage()}.`);
        }
        checkAndTrackRedirectLoop(e10) {
          if (3 === this.authenticateContext.handshakeRedirectLoopCounter) return true;
          let t10 = this.authenticateContext.handshakeRedirectLoopCounter + 1, r10 = rr.Cookies.RedirectCount;
          return e10.append("Set-Cookie", `${r10}=${t10}; SameSite=Lax; HttpOnly; Max-Age=2`), false;
        }
        removeDevBrowserFromURL(e10) {
          let t10 = new URL(e10);
          return t10.searchParams.delete(rr.QueryParameters.DevBrowser), t10.searchParams.delete(rr.QueryParameters.LegacyDevBrowser), t10;
        }
        getOrganizationSyncTarget(e10, t10) {
          return t10.findTarget(e10);
        }
        getOrganizationSyncQueryParams(e10) {
          let t10 = /* @__PURE__ */ new Map();
          return "personalAccount" === e10.type && t10.set("organization_id", ""), "organization" === e10.type && (e10.organizationId && t10.set("organization_id", e10.organizationId), e10.organizationSlug && t10.set("organization_id", e10.organizationSlug)), t10;
        }
      }, sc = class {
        constructor(e10) {
          this.organizationPattern = this.createMatcher(e10?.organizationPatterns), this.personalAccountPattern = this.createMatcher(e10?.personalAccountPatterns);
        }
        createMatcher(e10) {
          if (!e10) return null;
          try {
            return function(e11, t10) {
              try {
                var r10, n10, i10, s10, a10, o10;
                return r10 = void 0, n10 = [], i10 = ex(e11, n10, r10), s10 = r10, void 0 === s10 && (s10 = {}), a10 = s10.decode, o10 = void 0 === a10 ? function(e12) {
                  return e12;
                } : a10, function(e12) {
                  var t11 = i10.exec(e12);
                  if (!t11) return false;
                  for (var r11 = t11[0], s11 = t11.index, a11 = /* @__PURE__ */ Object.create(null), l2 = 1; l2 < t11.length; l2++) !function(e13) {
                    if (void 0 !== t11[e13]) {
                      var r12 = n10[e13 - 1];
                      "*" === r12.modifier || "+" === r12.modifier ? a11[r12.name] = t11[e13].split(r12.prefix + r12.suffix).map(function(e14) {
                        return o10(e14, r12);
                      }) : a11[r12.name] = o10(t11[e13], r12);
                    }
                  }(l2);
                  return { path: r11, index: s11, params: a11 };
                };
              } catch (e12) {
                throw Error(`Invalid path and options: Consult the documentation of path-to-regexp here: https://github.com/pillarjs/path-to-regexp/tree/6.x
${e12.message}`);
              }
            }(e10);
          } catch (t10) {
            throw Error(`Invalid pattern "${e10}": ${t10}`);
          }
        }
        findTarget(e10) {
          return this.findOrganizationTarget(e10) || this.findPersonalAccountTarget(e10);
        }
        findOrganizationTarget(e10) {
          if (!this.organizationPattern) return null;
          try {
            let t10 = this.organizationPattern(e10.pathname);
            if (!t10 || !("params" in t10)) return null;
            let r10 = t10.params;
            if (r10.id) return { type: "organization", organizationId: r10.id };
            if (r10.slug) return { type: "organization", organizationSlug: r10.slug };
            return null;
          } catch (e11) {
            return console.error("Failed to match organization pattern:", e11), null;
          }
        }
        findPersonalAccountTarget(e10) {
          if (!this.personalAccountPattern) return null;
          try {
            return this.personalAccountPattern(e10.pathname) ? { type: "personalAccount" } : null;
          } catch (e11) {
            return console.error("Failed to match personal account pattern:", e11), null;
          }
        }
      }, su = { NonEligibleNoCookie: "non-eligible-no-refresh-cookie", NonEligibleNonGet: "non-eligible-non-get", InvalidSessionToken: "invalid-session-token", MissingApiClient: "missing-api-client", MissingSessionToken: "missing-session-token", MissingRefreshToken: "missing-refresh-token", ExpiredSessionTokenDecodeFailed: "expired-session-token-decode-failed", ExpiredSessionTokenMissingSidClaim: "expired-session-token-missing-sid-claim", FetchError: "fetch-error", UnexpectedSDKError: "unexpected-sdk-error", UnexpectedBAPIError: "unexpected-bapi-error" };
      function sd(e10, t10, r10) {
        return r6(e10, t10) ? null : i1({ tokenType: "string" == typeof t10 ? t10 : e10, authenticateContext: r10, reason: iZ.TokenTypeMismatch });
      }
      var sh = async (e10, t10) => {
        let r10 = await ru(i8(e10), t10), n10 = t10.acceptsToken ?? rl.SessionToken;
        n10 !== rl.M2MToken && (ro(r10.secretKey), r10.isSatellite && (function(e11, t11) {
          if (!e11 && eV(t11)) throw Error("Missing signInUrl. Pass a signInUrl for dev instances if an app is satellite");
        }(r10.signInUrl, r10.secretKey), r10.signInUrl && r10.origin && function(e11, t11) {
          let r11;
          try {
            r11 = new URL(e11);
          } catch {
            throw Error("The signInUrl needs to have a absolute url format.");
          }
          if (r11.origin === t11) throw Error("The signInUrl needs to be on a different origin than your satellite application.");
        }(r10.signInUrl, r10.origin), function(e11) {
          if (!e11) throw Error("Missing domain and proxyUrl. A satellite application needs to specify a domain or a proxyUrl");
        }(r10.proxyUrl || r10.domain))), n10 === rl.M2MToken && function(e11) {
          if (!e11.machineSecretKey && !e11.secretKey) throw Error("Machine token authentication requires either a Machine secret key or a Clerk secret key. Ensure a Clerk secret key or Machine secret key is set.");
        }(r10);
        let i10 = new sc(t10.organizationSyncOptions), s10 = new sl(r10, { organizationSyncOptions: t10.organizationSyncOptions }, i10);
        async function a10(r11) {
          if (!t10.apiClient) return { data: null, error: { message: "An apiClient is needed to perform token refresh.", cause: { reason: su.MissingApiClient } } };
          let { sessionToken: n11, refreshTokenInCookie: i11 } = r11;
          if (!n11) return { data: null, error: { message: "Session token must be provided.", cause: { reason: su.MissingSessionToken } } };
          if (!i11) return { data: null, error: { message: "Refresh token must be provided.", cause: { reason: su.MissingRefreshToken } } };
          let { data: s11, errors: a11 } = tE(n11);
          if (!s11 || a11) return { data: null, error: { message: "Unable to decode the expired session token.", cause: { reason: su.ExpiredSessionTokenDecodeFailed, errors: a11 } } };
          if (!s11?.payload?.sid) return { data: null, error: { message: "Expired session token is missing the `sid` claim.", cause: { reason: su.ExpiredSessionTokenMissingSidClaim } } };
          try {
            return { data: (await t10.apiClient.sessions.refreshSession(s11.payload.sid, { format: "cookie", suffixed_cookies: r11.usesSuffixedCookies(), expired_token: n11 || "", refresh_token: i11 || "", request_origin: r11.clerkUrl.origin, request_headers: Object.fromEntries(Array.from(e10.headers.entries()).map(([e11, t11]) => [e11, [t11]])) })).cookies, error: null };
          } catch (e11) {
            if (!e11?.errors?.length) return { data: null, error: { message: "Unexpected Server/BAPI error", cause: { reason: su.UnexpectedBAPIError, errors: [e11] } } };
            if ("unexpected_error" === e11.errors[0].code) return { data: null, error: { message: "Fetch unexpected error", cause: { reason: su.FetchError, errors: e11.errors } } };
            return { data: null, error: { message: e11.errors[0].code, cause: { reason: e11.errors[0].code, errors: e11.errors } } };
          }
        }
        async function o10(e11) {
          let { data: t11, error: r11 } = await a10(e11);
          if (!t11 || 0 === t11.length) return { data: null, error: r11 };
          let n11 = new Headers(), i11 = "";
          t11.forEach((e12) => {
            n11.append("Set-Cookie", e12), i9(e12).startsWith(rr.Cookies.Session) && (i11 = i7(e12));
          });
          let { data: s11, errors: o11 } = await se(i11, e11);
          return o11 ? { data: null, error: { message: "Clerk: unable to verify refreshed session token.", cause: { reason: su.InvalidSessionToken, errors: o11 } } } : { data: { jwtPayload: s11, sessionToken: i11, headers: n11 }, error: null };
        }
        function l2(e11, t11, r11, n11) {
          if (!s10.isRequestEligibleForHandshake()) return i1({ tokenType: rl.SessionToken, authenticateContext: e11, reason: t11, message: r11 });
          let i11 = n11 ?? s10.buildRedirectToHandshake(t11);
          return (i11.get(rr.Headers.Location) && i11.set(rr.Headers.CacheControl, "no-store"), s10.checkAndTrackRedirectLoop(i11)) ? (console.log("Clerk: Refreshing the session token resulted in an infinite redirect loop. This usually means that your Clerk instance keys do not match - make sure to copy the correct publishable and secret keys from the Clerk dashboard."), i1({ tokenType: rl.SessionToken, authenticateContext: e11, reason: t11, message: r11 })) : function(e12, t12, r12 = "", n12) {
            return i2({ status: iQ.Handshake, reason: t12, message: r12, publishableKey: e12.publishableKey || "", isSatellite: e12.isSatellite || false, domain: e12.domain || "", proxyUrl: e12.proxyUrl || "", signInUrl: e12.signInUrl || "", signUpUrl: e12.signUpUrl || "", afterSignInUrl: e12.afterSignInUrl || "", afterSignUpUrl: e12.afterSignUpUrl || "", isSignedIn: false, isAuthenticated: false, tokenType: rl.SessionToken, toAuth: () => null, headers: n12, token: null });
          }(e11, t11, r11, i11);
        }
        async function c2() {
          let { tokenInHeader: e11 } = r10;
          if (r1(e11) || r2(e11)) return i1({ tokenType: rl.SessionToken, authenticateContext: r10, reason: iZ.TokenTypeMismatch, message: "" });
          try {
            let { data: t11, errors: n11 } = await se(e11, r10);
            if (n11) throw n11[0];
            return i0({ tokenType: rl.SessionToken, authenticateContext: r10, sessionClaims: t11, headers: new Headers(), token: e11 });
          } catch (e12) {
            return d2(e12, "header");
          }
        }
        async function u2() {
          let e11 = r10.clientUat, t11 = !!r10.sessionTokenInCookie, n11 = !!r10.devBrowserToken;
          if (r10.handshakeNonce || r10.handshakeToken) try {
            return await s10.resolveHandshake();
          } catch (e12) {
            e12 instanceof ti && "development" === r10.instanceType ? s10.handleTokenVerificationErrorInDevelopment(e12) : console.error("Clerk: unable to resolve handshake:", e12);
          }
          let a11 = r10.isSatellite && "document" === r10.secFetchDest, o11 = r10.clerkUrl.searchParams.get(rr.QueryParameters.ClerkSynced), c3 = o11 === rr.ClerkSyncStatus.NeedsSync, u3 = o11 === rr.ClerkSyncStatus.Completed, h3 = t11 || e11, p3 = false === r10.satelliteAutoSync && !h3 && !c3;
          if ("production" === r10.instanceType && a11 && !u3) {
            if (p3) return i1({ tokenType: rl.SessionToken, authenticateContext: r10, reason: iZ.SessionTokenAndUATMissing });
            if (!h3 || c3) return l2(r10, iZ.SatelliteCookieNeedsSyncing, "");
          }
          if ("development" === r10.instanceType && a11 && !u3) {
            if (p3) return i1({ tokenType: rl.SessionToken, authenticateContext: r10, reason: iZ.SessionTokenAndUATMissing });
            if (!h3 || c3) {
              let e12 = new URL(r10.signInUrl);
              e12.searchParams.append(rr.QueryParameters.ClerkRedirectUrl, r10.clerkUrl.toString());
              let t12 = new Headers({ [rr.Headers.Location]: e12.toString() });
              return l2(r10, iZ.SatelliteCookieNeedsSyncing, "", t12);
            }
          }
          let f3 = new URL(r10.clerkUrl).searchParams.get(rr.QueryParameters.ClerkRedirectUrl);
          if ("development" === r10.instanceType && !r10.isSatellite && f3) {
            let e12 = new URL(f3);
            r10.devBrowserToken && e12.searchParams.append(rr.QueryParameters.DevBrowser, r10.devBrowserToken), e12.searchParams.set(rr.QueryParameters.ClerkSynced, rr.ClerkSyncStatus.Completed);
            let t12 = new Headers({ [rr.Headers.Location]: e12.toString() });
            return l2(r10, iZ.PrimaryRespondsToSyncing, "", t12);
          }
          if ("development" === r10.instanceType && r10.clerkUrl.searchParams.has(rr.QueryParameters.DevBrowser)) return l2(r10, iZ.DevBrowserSync, "");
          if ("development" === r10.instanceType && !n11) return l2(r10, iZ.DevBrowserMissing, "");
          if (!e11 && !t11) return i1({ tokenType: rl.SessionToken, authenticateContext: r10, reason: iZ.SessionTokenAndUATMissing });
          if (!e11 && t11) return l2(r10, iZ.SessionTokenWithoutClientUAT, "");
          if (e11 && !t11) return l2(r10, iZ.ClientUATWithoutSessionToken, "");
          let { data: g2, errors: m2 } = tE(r10.sessionTokenInCookie);
          if (m2) return d2(m2[0], "cookie");
          if (g2.payload.iat < r10.clientUat) return l2(r10, iZ.SessionTokenIATBeforeClientUAT, "");
          try {
            let { data: e12, errors: t12 } = await se(r10.sessionTokenInCookie, r10);
            if (t12) throw t12[0];
            e12.azp || console.warn("Clerk: Session token from cookie is missing the azp claim. In a future version of Clerk, this token will be considered invalid. Please contact Clerk support if you see this warning.");
            let n12 = i0({ tokenType: rl.SessionToken, authenticateContext: r10, sessionClaims: e12, headers: new Headers(), token: r10.sessionTokenInCookie });
            if (!r10.isSatellite && "document" === r10.secFetchDest && r10.isCrossOriginReferrer() && !r10.isKnownClerkReferrer() && 0 === r10.handshakeRedirectLoopCounter) return l2(r10, iZ.PrimaryDomainCrossOriginSync, "Cross-origin request from satellite domain requires handshake");
            let s11 = n12.toAuth();
            if (s11.userId) {
              let e13 = function(e14, t13) {
                let r11 = i10.findTarget(e14.clerkUrl);
                if (!r11) return null;
                let n13 = false;
                if ("organization" === r11.type && (r11.organizationSlug && r11.organizationSlug !== t13.orgSlug && (n13 = true), r11.organizationId && r11.organizationId !== t13.orgId && (n13 = true)), "personalAccount" === r11.type && t13.orgId && (n13 = true), !n13) return null;
                if (e14.handshakeRedirectLoopCounter >= 3) return console.warn("Clerk: Organization activation handshake loop detected. This is likely due to an invalid organization ID or slug. Skipping organization activation."), null;
                let s12 = l2(e14, iZ.ActiveOrganizationMismatch, "");
                return "handshake" !== s12.status ? null : s12;
              }(r10, s11);
              if (e13) return e13;
            }
            return n12;
          } catch (e12) {
            return d2(e12, "cookie");
          }
          return i1({ tokenType: rl.SessionToken, authenticateContext: r10, reason: iZ.UnexpectedError });
        }
        async function d2(t11, n11) {
          let i11;
          if (!(t11 instanceof ti)) return i1({ tokenType: rl.SessionToken, authenticateContext: r10, reason: iZ.UnexpectedError });
          if (t11.reason === tr.TokenExpired && r10.refreshTokenInCookie && "GET" === e10.method) {
            let { data: e11, error: t12 } = await o10(r10);
            if (e11) return i0({ tokenType: rl.SessionToken, authenticateContext: r10, sessionClaims: e11.jwtPayload, headers: e11.headers, token: e11.sessionToken });
            i11 = t12?.cause?.reason ? t12.cause.reason : su.UnexpectedSDKError;
          } else i11 = "GET" !== e10.method ? su.NonEligibleNonGet : r10.refreshTokenInCookie ? null : su.NonEligibleNoCookie;
          return (t11.tokenCarrier = n11, [tr.TokenExpired, tr.TokenNotActiveYet, tr.TokenIatInTheFuture].includes(t11.reason)) ? l2(r10, sf({ tokenError: t11.reason, refreshError: i11 }), t11.getFullMessage()) : i1({ tokenType: rl.SessionToken, authenticateContext: r10, reason: t11.reason, message: t11.getFullMessage() });
        }
        function h2(e11, t11) {
          return t11 instanceof ta ? i1({ tokenType: e11, authenticateContext: r10, reason: t11.code, message: t11.getFullMessage() }) : i1({ tokenType: e11, authenticateContext: r10, reason: iZ.UnexpectedError });
        }
        async function p2() {
          let { tokenInHeader: e11 } = r10;
          if (!e11) return d2(Error("Missing token in header"), "header");
          if (!r3(e11)) return i1({ tokenType: n10, authenticateContext: r10, reason: iZ.TokenTypeMismatch, message: "" });
          let t11 = sd(r5(e11), n10, r10);
          if (t11) return t11;
          let { data: i11, tokenType: s11, errors: a11 } = await ss(e11, r10);
          return a11 ? h2(s11, a11[0]) : i0({ tokenType: s11, authenticateContext: r10, machineData: i11, token: e11 });
        }
        async function f2() {
          let { tokenInHeader: e11 } = r10;
          if (!e11) return d2(Error("Missing token in header"), "header");
          if (r3(e11)) {
            let t12 = sd(r5(e11), n10, r10);
            if (t12) return t12;
            let { data: i12, tokenType: s11, errors: a11 } = await ss(e11, r10);
            return a11 ? h2(s11, a11[0]) : i0({ tokenType: s11, authenticateContext: r10, machineData: i12, token: e11 });
          }
          let { data: t11, errors: i11 } = await se(e11, r10);
          return i11 ? d2(i11[0], "header") : i0({ tokenType: rl.SessionToken, authenticateContext: r10, sessionClaims: t11, token: e11 });
        }
        return Array.isArray(n10) && !function(e11, t11) {
          let r11 = null, { tokenInHeader: n11 } = t11;
          return n11 && (r11 = r3(n11) ? r5(n11) : rl.SessionToken), r6(r11 ?? rl.SessionToken, e11);
        }(n10, r10) ? function() {
          let e11 = iW();
          return i2({ status: iQ.SignedOut, reason: iZ.TokenTypeMismatch, message: "", proxyUrl: "", publishableKey: "", isSatellite: false, domain: "", signInUrl: "", signUpUrl: "", afterSignInUrl: "", afterSignUpUrl: "", isSignedIn: false, isAuthenticated: false, tokenType: null, toAuth: () => e11, headers: new Headers(), token: null });
        }() : r10.tokenInHeader ? "any" === n10 || Array.isArray(n10) ? f2() : n10 === rl.SessionToken ? c2() : p2() : n10 === rl.OAuthToken || n10 === rl.ApiKey || n10 === rl.M2MToken ? i1({ tokenType: n10, authenticateContext: r10, reason: "No token in header" }) : u2();
      }, sp = (e10) => {
        let { isSignedIn: t10, isAuthenticated: r10, proxyUrl: n10, reason: i10, message: s10, publishableKey: a10, isSatellite: o10, domain: l2 } = e10;
        return { isSignedIn: t10, isAuthenticated: r10, proxyUrl: n10, reason: i10, message: s10, publishableKey: a10, isSatellite: o10, domain: l2 };
      }, sf = ({ tokenError: e10, refreshError: t10 }) => {
        switch (e10) {
          case tr.TokenExpired:
            return `${iZ.SessionTokenExpired}-refresh-${t10}`;
          case tr.TokenNotActiveYet:
            return iZ.SessionTokenNBF;
          case tr.TokenIatInTheFuture:
            return iZ.SessionTokenIatInTheFuture;
          default:
            return iZ.UnexpectedError;
        }
      }, sg = { secretKey: "", machineSecretKey: "", jwtKey: "", apiUrl: void 0, apiVersion: void 0, proxyUrl: "", publishableKey: "", isSatellite: false, domain: "", audience: "" }, sm = ["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade"];
      function sy(e10) {
        for (; e10.endsWith("/"); ) e10 = e10.slice(0, -1);
        return e10;
      }
      function sb(e10, t10, r10) {
        return new Response(JSON.stringify({ errors: [{ code: e10, message: t10 }] }), { status: r10, headers: { "Content-Type": "application/json" } });
      }
      async function s_(e10, t10) {
        let r10 = sy(t10?.proxyPath || eB), n10 = t10?.publishableKey || ("undefined" != typeof process ? process.env?.CLERK_PUBLISHABLE_KEY : void 0), i10 = t10?.secretKey || ("undefined" != typeof process ? process.env?.CLERK_SECRET_KEY : void 0);
        if (!n10) return sb("proxy_configuration_error", "Missing publishableKey. Provide it in options or set CLERK_PUBLISHABLE_KEY environment variable.", 500);
        if (!i10) return sb("proxy_configuration_error", "Missing secretKey. Provide it in options or set CLERK_SECRET_KEY environment variable.", 500);
        let s10 = new URL(e10.url);
        if (!(s10.pathname === r10 || s10.pathname.startsWith(r10 + "/"))) return sb("proxy_path_mismatch", `Request path "${s10.pathname}" does not match proxy path "${r10}"`, 400);
        let a10 = function(e11) {
          let t11 = eF(e11)?.frontendApi;
          return t11?.startsWith("clerk.") && eN.some((e12) => t11?.endsWith(e12)) ? ej : eL.some((e12) => t11?.endsWith(e12)) ? "https://frontend-api.lclclerk.com" : eq.some((e12) => t11?.endsWith(e12)) ? "https://frontend-api.clerkstage.dev" : ej;
        }(n10), o10 = new URL(s10.pathname.slice(r10.length) || "/", a10);
        o10.search = s10.search;
        let l2 = new Headers();
        e10.headers.forEach((e11, t11) => {
          sm.includes(t11.toLowerCase()) || l2.set(t11, e11);
        });
        let c2 = `${s10.protocol}//${s10.host}${r10}`;
        l2.set("Clerk-Proxy-Url", c2), l2.set("Clerk-Secret-Key", i10);
        let u2 = new URL(a10).host;
        l2.set("Host", u2), l2.has("X-Forwarded-Host") || l2.set("X-Forwarded-Host", s10.host), l2.has("X-Forwarded-Proto") || l2.set("X-Forwarded-Proto", s10.protocol.replace(":", ""));
        let d2 = function(e11) {
          let t11 = e11.headers.get("cf-connecting-ip");
          if (t11) return t11;
          let r11 = e11.headers.get("x-real-ip");
          if (r11) return r11;
          let n11 = e11.headers.get("x-forwarded-for");
          if (n11) return n11.split(",")[0]?.trim();
        }(e10);
        d2 && l2.set("X-Forwarded-For", d2);
        let h2 = ["POST", "PUT", "PATCH"].includes(e10.method);
        try {
          let t11 = { method: e10.method, headers: l2, duplex: h2 ? "half" : void 0 };
          h2 && e10.body && (t11.body = e10.body);
          let r11 = await fetch(o10.toString(), t11), n11 = new Headers();
          r11.headers.forEach((e11, t12) => {
            sm.includes(t12.toLowerCase()) || n11.set(t12, e11);
          });
          let i11 = r11.headers.get("location");
          if (i11) try {
            let e11 = new URL(i11, a10);
            if (e11.host === u2) {
              let t12 = `${c2}${e11.pathname}${e11.search}${e11.hash}`;
              n11.set("Location", t12);
            }
          } catch {
          }
          return new Response(r11.body, { status: r11.status, statusText: r11.statusText, headers: n11 });
        } catch (t11) {
          let e11 = t11 instanceof Error ? t11.message : "Unknown error";
          return sb("proxy_request_failed", `Failed to proxy request to Clerk FAPI: ${e11}`, 502);
        }
      }
      r(942), r(786), function(e10) {
        e10[e10.SeeOther = 303] = "SeeOther", e10[e10.TemporaryRedirect = 307] = "TemporaryRedirect", e10[e10.PermanentRedirect = 308] = "PermanentRedirect";
      }(ak || (ak = {}));
      !function(e10) {
        e10.push = "push", e10.replace = "replace";
      }(aS || (aS = {}));
      let sv = "NEXT_NOT_FOUND";
      r(568), "undefined" == typeof URLPattern || URLPattern;
      let sw = { Headers: { NextRewrite: "x-middleware-rewrite", NextResume: "x-middleware-next", NextRedirect: "Location", NextUrl: "next-url", NextAction: "next-action", NextjsData: "x-nextjs-data" } }, sk = (e10) => e10.headers.get(sw.Headers.NextRedirect), sS = (e10, t10, r10) => (e10.headers.set(t10, r10), e10), sT = "__clerk_db_jwt", sx = (e10, t10, r10) => {
        let n10 = t10.headers.get("location");
        if ("true" === t10.headers.get(rr.Headers.ClerkRedirectTo) && n10 && eV(r10.secretKey) && e10.clerkUrl.isCrossOrigin(n10)) {
          let r11 = e10.cookies.get(sT) || "", i10 = function(e11, t11) {
            let r12 = new URL(e11), n11 = r12.searchParams.get(sT);
            r12.searchParams.delete(sT);
            let i11 = n11 || t11;
            return i11 && r12.searchParams.set(sT, i11), r12;
          }(new URL(n10), r11);
          return K.redirect(i10.href, t10);
        }
        return t10;
      }, sE = { i8: "14.2.3" }, sO = (e10) => {
        if (!e10 || "string" != typeof e10) return e10;
        try {
          return (e10 || "").replace(/^(sk_(live|test)_)(.+?)(.{3})$/, "$1*********$4");
        } catch {
          return "";
        }
      }, sC = (e10) => (Array.isArray(e10) ? e10 : [e10]).map((e11) => "string" == typeof e11 ? sO(e11) : JSON.stringify(Object.fromEntries(Object.entries(e11).map(([e12, t10]) => [e12, sO(t10)])), null, 2)).join(", "), sI = (e10, t10) => () => {
        let r10 = [], n10 = false;
        return { enable: () => {
          n10 = true;
        }, debug: (...e11) => {
          n10 && r10.push(e11.map((e12) => "function" == typeof e12 ? e12() : e12));
        }, commit: () => {
          if (n10) {
            for (let n11 of (console.log(`[clerk debug start: ${e10}]`), r10)) {
              let e11 = t10(n11);
              e11 = e11.split("\n").map((e12) => `  ${e12}`).join("\n"), process.env.VERCEL && (e11 = function(e12, t11) {
                let r11 = new TextEncoder(), n12 = new TextDecoder("utf-8"), i10 = r11.encode(e12).slice(0, 4096);
                return n12.decode(i10).replace(/\uFFFD/g, "");
              }(e11, 0)), console.log(e11);
            }
            console.log(`[clerk debug end: ${e10}] (@clerk/nextjs=7.0.1,next=${sE.i8},timestamp=${Math.round((/* @__PURE__ */ new Date()).getTime() / 1e3)})`);
          }
        } };
      }, sP = (e10, t10) => (...r10) => {
        let n10 = ("string" == typeof e10 ? sI(e10, sC) : e10)(), i10 = t10(n10);
        try {
          let e11 = i10(...r10);
          if ("object" == typeof e11 && "then" in e11 && "function" == typeof e11.then) return e11.then((e12) => (n10.commit(), e12)).catch((e12) => {
            throw n10.commit(), e12;
          });
          return n10.commit(), e11;
        } catch (e11) {
          throw n10.commit(), e11;
        }
      };
      function sA(e10, t10, r10) {
        return "function" == typeof e10 ? e10(t10) : void 0 !== e10 ? e10 : void 0 !== r10 ? r10 : void 0;
      }
      let sR = (e10) => {
        let t10 = (r10) => {
          if (!r10) return r10;
          if (Array.isArray(r10)) return r10.map((e11) => "object" == typeof e11 || Array.isArray(e11) ? t10(e11) : e11);
          let n10 = { ...r10 };
          for (let r11 of Object.keys(n10)) {
            let i10 = e10(r11.toString());
            i10 !== r11 && (n10[i10] = n10[r11], delete n10[r11]), "object" == typeof n10[i10] && (n10[i10] = t10(n10[i10]));
          }
          return n10;
        };
        return t10;
      };
      function sN(e10) {
        if ("boolean" == typeof e10) return e10;
        if (null == e10) return false;
        if ("string" == typeof e10) {
          if ("true" === e10.toLowerCase()) return true;
          if ("false" === e10.toLowerCase()) return false;
        }
        let t10 = parseInt(e10, 10);
        return !isNaN(t10) && t10 > 0;
      }
      sR(function(e10) {
        return e10 ? e10.replace(/[A-Z]/g, (e11) => `_${e11.toLowerCase()}`) : "";
      }), sR(function(e10) {
        return e10 ? e10.replace(/([-_][a-z])/g, (e11) => e11.toUpperCase().replace(/-|_/, "")) : "";
      }), process.env.NEXT_PUBLIC_CLERK_JS_VERSION, process.env.NEXT_PUBLIC_CLERK_JS_URL, process.env.NEXT_PUBLIC_CLERK_UI_URL, process.env.NEXT_PUBLIC_CLERK_UI_VERSION;
      let sU = process.env.CLERK_API_VERSION || "v1", sM = process.env.CLERK_SECRET_KEY || "", sL = process.env.CLERK_MACHINE_SECRET_KEY || "", sq = "pk_test_c2luY2VyZS1oYW1zdGVyLTkuY2xlcmsuYWNjb3VudHMuZGV2JA", sD = process.env.CLERK_ENCRYPTION_KEY || "", sj = process.env.CLERK_API_URL || ((e10) => {
        let t10 = eF(e10)?.frontendApi;
        return t10?.startsWith("clerk.") && eN.some((e11) => t10?.endsWith(e11)) ? eD : eL.some((e11) => t10?.endsWith(e11)) ? "https://api.lclclerk.com" : eq.some((e11) => t10?.endsWith(e11)) ? "https://api.clerkstage.dev" : eD;
      })(sq), sB = process.env.NEXT_PUBLIC_CLERK_DOMAIN || "", sH = process.env.NEXT_PUBLIC_CLERK_PROXY_URL || "", sK = sN(process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE) || false, s$ = "/sign-in", sz = sN(process.env.NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED), sF = sN(process.env.NEXT_PUBLIC_CLERK_TELEMETRY_DEBUG), sJ = (sN(process.env.NEXT_PUBLIC_CLERK_KEYLESS_DISABLED), Symbol.for("clerk_use_cache_error"));
      class sV extends (ax = Error, aT = sJ, ax) {
        constructor(e10, t10) {
          super(e10), this.originalError = t10, this[aT] = true, this.name = "ClerkUseCacheError";
        }
      }
      let sW = (e10) => e10 instanceof Error && sJ in e10, sG = /inside\s+["']use cache["']|["']use cache["'].*(?:headers|cookies)|(?:headers|cookies).*["']use cache["']/i, sX = /cache scope/i, sY = /dynamic data source/i, sQ = /Route .*? needs to bail out of prerendering at this point because it used .*?./, sZ = (e10) => {
        if (!(e10 instanceof Error) || !("message" in e10)) return false;
        let { message: t10 } = e10, r10 = t10.toLowerCase();
        return sQ.test(t10) || r10.includes("dynamic server usage") || r10.includes("this page needs to bail out of prerendering") || r10.includes("during prerendering");
      }, s0 = (e10) => {
        if (!(e10 instanceof Error)) return false;
        let { message: t10 } = e10;
        return !!(sG.test(t10) || sX.test(t10) && sY.test(t10));
      }, s1 = `Clerk: auth() and currentUser() cannot be called inside a "use cache" function. These functions access \`headers()\` internally, which is a dynamic API not allowed in cached contexts.

To fix this, call auth() outside the cached function and pass the values you need as arguments:

  import { auth, clerkClient } from '@clerk/nextjs/server';

  async function getCachedUser(userId: string) {
    "use cache";
    const client = await clerkClient();
    return client.users.getUser(userId);
  }

  // In your component/page:
  const { userId } = await auth();
  if (userId) {
    const user = await getCachedUser(userId);
  }`;
      async function s2() {
        try {
          let { headers: e10 } = await Promise.resolve().then(r.bind(r, 907)), t10 = await e10();
          return new D("https://placeholder.com", { headers: t10 });
        } catch (e10) {
          if (e10 && sZ(e10)) throw e10;
          if (e10 && s0(e10)) throw new sV(`${s1}

Original error: ${e10.message}`, e10);
          throw Error(`Clerk: auth(), currentUser() and clerkClient(), are only supported in App Router (/app directory).
If you're using /pages, try getAuth() instead.
Original error: ${e10}`);
        }
      }
      var s4 = class {
        #e;
        #t = 864e5;
        constructor(e10) {
          this.#e = e10;
        }
        isEventThrottled(e10) {
          let t10 = Date.now(), r10 = this.#r(e10), n10 = this.#e.getItem(r10);
          return !!n10 && !(t10 - n10 > this.#t) || (this.#e.setItem(r10, t10), false);
        }
        #r(e10) {
          let { sk: t10, pk: r10, payload: n10, ...i10 } = e10, s10 = { ...n10, ...i10 };
          return JSON.stringify(Object.keys({ ...n10, ...i10 }).sort().map((e11) => s10[e11]));
        }
      }, s3 = class {
        #n = "clerk_telemetry_throttler";
        getItem(e10) {
          return this.#i()[e10];
        }
        setItem(e10, t10) {
          try {
            let r10 = this.#i();
            r10[e10] = t10, localStorage.setItem(this.#n, JSON.stringify(r10));
          } catch (e11) {
            e11 instanceof DOMException && ("QuotaExceededError" === e11.name || "NS_ERROR_DOM_QUOTA_REACHED" === e11.name) && localStorage.length > 0 && localStorage.removeItem(this.#n);
          }
        }
        removeItem(e10) {
          try {
            let t10 = this.#i();
            delete t10[e10], localStorage.setItem(this.#n, JSON.stringify(t10));
          } catch {
          }
        }
        #i() {
          try {
            let e10 = localStorage.getItem(this.#n);
            if (!e10) return {};
            return JSON.parse(e10);
          } catch {
            return {};
          }
        }
        static isSupported() {
          return "undefined" != typeof window && !!window.localStorage;
        }
      }, s5 = class {
        #e = /* @__PURE__ */ new Map();
        #s = 1e4;
        getItem(e10) {
          if (this.#e.size > this.#s) {
            this.#e.clear();
            return;
          }
          return this.#e.get(e10);
        }
        setItem(e10, t10) {
          this.#e.set(e10, t10);
        }
        removeItem(e10) {
          this.#e.delete(e10);
        }
      };
      let s6 = /* @__PURE__ */ new Set(["error", "warn", "info", "debug", "trace"]), s8 = { samplingRate: 1, maxBufferSize: 5, endpoint: "https://clerk-telemetry.com" };
      var s9 = class {
        #a;
        #o;
        #l = {};
        #c = [];
        #u = null;
        constructor(e10) {
          this.#a = { maxBufferSize: e10.maxBufferSize ?? s8.maxBufferSize, samplingRate: e10.samplingRate ?? s8.samplingRate, perEventSampling: e10.perEventSampling ?? true, disabled: e10.disabled ?? false, debug: e10.debug ?? false, endpoint: s8.endpoint }, e10.clerkVersion || "undefined" != typeof window ? this.#l.clerkVersion = e10.clerkVersion ?? "" : this.#l.clerkVersion = "", this.#l.sdk = e10.sdk, this.#l.sdkVersion = e10.sdkVersion, this.#l.publishableKey = e10.publishableKey ?? "";
          let t10 = eF(e10.publishableKey);
          t10 && (this.#l.instanceType = t10.instanceType), e10.secretKey && (this.#l.secretKey = e10.secretKey.substring(0, 16)), this.#o = new s4(s3.isSupported() ? new s3() : new s5());
        }
        get isEnabled() {
          return !("development" !== this.#l.instanceType || this.#a.disabled || "undefined" != typeof process && process.env && sN(process.env.CLERK_TELEMETRY_DISABLED) || "undefined" != typeof window && window?.navigator?.webdriver);
        }
        get isDebug() {
          return this.#a.debug || "undefined" != typeof process && process.env && sN(process.env.CLERK_TELEMETRY_DEBUG);
        }
        record(e10) {
          try {
            let t10 = this.#d(e10.event, e10.payload);
            if (this.#h(t10.event, t10), !this.#p(t10, e10.eventSamplingRate)) return;
            this.#c.push({ kind: "event", value: t10 }), this.#f();
          } catch (e11) {
            console.error("[clerk/telemetry] Error recording telemetry event", e11);
          }
        }
        recordLog(e10) {
          try {
            if (!this.#g(e10)) return;
            let t10 = "string" == typeof e10?.level && s6.has(e10.level), r10 = "string" == typeof e10?.message && e10.message.trim().length > 0, n10 = null, i10 = e10?.timestamp;
            if ("number" == typeof i10 || "string" == typeof i10) {
              let e11 = new Date(i10);
              Number.isNaN(e11.getTime()) || (n10 = e11);
            }
            if (!t10 || !r10 || null === n10) {
              this.isDebug && "undefined" != typeof console && console.warn("[clerk/telemetry] Dropping invalid telemetry log entry", { levelIsValid: t10, messageIsValid: r10, timestampIsValid: null !== n10 });
              return;
            }
            let s10 = this.#m(), a10 = { sdk: s10.name, sdkv: s10.version, cv: this.#l.clerkVersion ?? "", lvl: e10.level, msg: e10.message, ts: n10.toISOString(), pk: this.#l.publishableKey || null, payload: this.#y(e10.context) };
            this.#c.push({ kind: "log", value: a10 }), this.#f();
          } catch (e11) {
            console.error("[clerk/telemetry] Error recording telemetry log entry", e11);
          }
        }
        #p(e10, t10) {
          return this.isEnabled && !this.isDebug && this.#b(e10, t10);
        }
        #g(e10) {
          return true;
        }
        #b(e10, t10) {
          let r10 = Math.random();
          return r10 <= this.#a.samplingRate && (false === this.#a.perEventSampling || void 0 === t10 || r10 <= t10) && !this.#o.isEventThrottled(e10);
        }
        #f() {
          if ("undefined" == typeof window) {
            this.#_();
            return;
          }
          if (this.#c.length >= this.#a.maxBufferSize) {
            this.#u && ("undefined" != typeof cancelIdleCallback ? cancelIdleCallback(Number(this.#u)) : clearTimeout(Number(this.#u))), this.#_();
            return;
          }
          this.#u || ("requestIdleCallback" in window ? this.#u = requestIdleCallback(() => {
            this.#_(), this.#u = null;
          }) : this.#u = setTimeout(() => {
            this.#_(), this.#u = null;
          }, 0));
        }
        #_() {
          let e10 = [...this.#c];
          if (this.#c = [], this.#u = null, 0 === e10.length) return;
          let t10 = e10.filter((e11) => "event" === e11.kind).map((e11) => e11.value), r10 = e10.filter((e11) => "log" === e11.kind).map((e11) => e11.value);
          t10.length > 0 && fetch(new URL("/v1/event", this.#a.endpoint), { headers: { "Content-Type": "application/json" }, keepalive: true, method: "POST", body: JSON.stringify({ events: t10 }) }).catch(() => void 0), r10.length > 0 && fetch(new URL("/v1/logs", this.#a.endpoint), { headers: { "Content-Type": "application/json" }, keepalive: true, method: "POST", body: JSON.stringify({ logs: r10 }) }).catch(() => void 0);
        }
        #h(e10, t10) {
          this.isDebug && (void 0 !== console.groupCollapsed ? (console.groupCollapsed("[clerk/telemetry]", e10), console.log(t10), console.groupEnd()) : console.log("[clerk/telemetry]", e10, t10));
        }
        #m() {
          let e10 = { name: this.#l.sdk, version: this.#l.sdkVersion };
          if ("undefined" != typeof window) {
            let t10 = window;
            if (t10.Clerk) {
              let r10 = t10.Clerk;
              if ("object" == typeof r10 && null !== r10 && "constructor" in r10 && "function" == typeof r10.constructor && r10.constructor.sdkMetadata) {
                let { name: t11, version: n10 } = r10.constructor.sdkMetadata;
                void 0 !== t11 && (e10.name = t11), void 0 !== n10 && (e10.version = n10);
              }
            }
          }
          return e10;
        }
        #d(e10, t10) {
          let r10 = this.#m();
          return { event: e10, cv: this.#l.clerkVersion ?? "", it: this.#l.instanceType ?? "", sdk: r10.name, sdkv: r10.version, ...this.#l.publishableKey ? { pk: this.#l.publishableKey } : {}, ...this.#l.secretKey ? { sk: this.#l.secretKey } : {}, payload: t10 };
        }
        #y(e10) {
          if (null == e10 || "object" != typeof e10) return null;
          try {
            let t10 = JSON.parse(JSON.stringify(e10));
            if (t10 && "object" == typeof t10 && !Array.isArray(t10)) return t10;
            return null;
          } catch {
            return null;
          }
        }
      };
      let s7 = { secretKey: sM, publishableKey: sq, apiUrl: sj, apiVersion: sU, userAgent: "@clerk/nextjs@7.0.1", proxyUrl: sH, domain: sB, isSatellite: sK, machineSecretKey: sL, sdkMetadata: { name: "@clerk/nextjs", version: "7.0.1", environment: "production" }, telemetry: { disabled: sz, debug: sF } }, ae = (e10) => function(e11) {
        let t10 = { ...e11 }, r10 = iz(t10), n10 = function(e12) {
          let t11 = ra(sg, e12.options), r11 = e12.apiClient;
          return { authenticateRequest: (e13, n11 = {}) => {
            let { apiUrl: i11, apiVersion: s10 } = t11, a10 = ra(t11, n11);
            return sh(e13, { ...n11, ...a10, apiUrl: i11, apiVersion: s10, apiClient: r11 });
          }, debugRequestState: sp };
        }({ options: t10, apiClient: r10 }), i10 = new s9({ publishableKey: t10.publishableKey, secretKey: t10.secretKey, samplingRate: 0.1, ...t10.sdkMetadata ? { sdk: t10.sdkMetadata.name, sdkVersion: t10.sdkMetadata.version } : {}, ...t10.telemetry || {} });
        return { ...r10, ...n10, telemetry: i10 };
      }({ ...s7, ...e10 });
      function at(e10, t10) {
        var r10, n10;
        return function(e11) {
          try {
            let { headers: t11, nextUrl: r11, cookies: n11 } = e11 || {};
            return "function" == typeof (null == t11 ? void 0 : t11.get) && "function" == typeof (null == r11 ? void 0 : r11.searchParams.get) && "function" == typeof (null == n11 ? void 0 : n11.get);
          } catch {
            return false;
          }
        }(e10) || function(e11) {
          try {
            let { headers: t11 } = e11 || {};
            return "function" == typeof (null == t11 ? void 0 : t11.get);
          } catch {
            return false;
          }
        }(e10) ? e10.headers.get(t10) : e10.headers[t10] || e10.headers[t10.toLowerCase()] || (null == (n10 = null == (r10 = e10.socket) ? void 0 : r10._httpMessage) ? void 0 : n10.getHeader(t10));
      }
      var ar = r(67);
      let an = /* @__PURE__ */ new Map(), ai = new ar.AsyncLocalStorage();
      function as(e10) {
        return /^http(s)?:\/\//.test(e10 || "");
      }
      var aa, ao, al, ac, au, ad, ah, ap, af, ag, am, ay, ab, a_, av, aw, ak, aS, aT, ax, aE, aO, aC, aI, aP, aA, aR, aN = Object.defineProperty, aU = (null == (aE = "undefined" != typeof globalThis ? globalThis : void 0) ? void 0 : aE.crypto) || (null == (aO = void 0 !== r.g ? r.g : void 0) ? void 0 : aO.crypto) || (null == (aC = "undefined" != typeof window ? window : void 0) ? void 0 : aC.crypto) || (null == (aI = "undefined" != typeof self ? self : void 0) ? void 0 : aI.crypto) || (null == (aA = null == (aP = "undefined" != typeof frames ? frames : void 0) ? void 0 : aP[0]) ? void 0 : aA.crypto);
      aR = aU ? (e10) => {
        let t10 = [];
        for (let r10 = 0; r10 < e10; r10 += 4) t10.push(aU.getRandomValues(new Uint32Array(1))[0]);
        return new aL(t10, e10);
      } : (e10) => {
        let t10 = [], r10 = (e11) => {
          let t11 = e11, r11 = 987654321;
          return () => {
            let e12 = ((r11 = 36969 * (65535 & r11) + (r11 >> 16) & 4294967295) << 16) + (t11 = 18e3 * (65535 & t11) + (t11 >> 16) & 4294967295) & 4294967295;
            return e12 /= 4294967296, (e12 += 0.5) * (Math.random() > 0.5 ? 1 : -1);
          };
        };
        for (let n10 = 0, i10; n10 < e10; n10 += 4) {
          let e11 = r10(4294967296 * (i10 || Math.random()));
          i10 = 987654071 * e11(), t10.push(4294967296 * e11() | 0);
        }
        return new aL(t10, e10);
      };
      var aM = class {
        static create(...e10) {
          return new this(...e10);
        }
        mixIn(e10) {
          return Object.assign(this, e10);
        }
        clone() {
          let e10 = new this.constructor();
          return Object.assign(e10, this), e10;
        }
      }, aL = class extends aM {
        constructor(e10 = [], t10 = 4 * e10.length) {
          super();
          let r10 = e10;
          if (r10 instanceof ArrayBuffer && (r10 = new Uint8Array(r10)), (r10 instanceof Int8Array || r10 instanceof Uint8ClampedArray || r10 instanceof Int16Array || r10 instanceof Uint16Array || r10 instanceof Int32Array || r10 instanceof Uint32Array || r10 instanceof Float32Array || r10 instanceof Float64Array) && (r10 = new Uint8Array(r10.buffer, r10.byteOffset, r10.byteLength)), r10 instanceof Uint8Array) {
            let e11 = r10.byteLength, t11 = [];
            for (let n10 = 0; n10 < e11; n10 += 1) t11[n10 >>> 2] |= r10[n10] << 24 - n10 % 4 * 8;
            this.words = t11, this.sigBytes = e11;
          } else this.words = e10, this.sigBytes = t10;
        }
        toString(e10 = aq) {
          return e10.stringify(this);
        }
        concat(e10) {
          let t10 = this.words, r10 = e10.words, n10 = this.sigBytes, i10 = e10.sigBytes;
          if (this.clamp(), n10 % 4) for (let e11 = 0; e11 < i10; e11 += 1) {
            let i11 = r10[e11 >>> 2] >>> 24 - e11 % 4 * 8 & 255;
            t10[n10 + e11 >>> 2] |= i11 << 24 - (n10 + e11) % 4 * 8;
          }
          else for (let e11 = 0; e11 < i10; e11 += 4) t10[n10 + e11 >>> 2] = r10[e11 >>> 2];
          return this.sigBytes += i10, this;
        }
        clamp() {
          let { words: e10, sigBytes: t10 } = this;
          e10[t10 >>> 2] &= 4294967295 << 32 - t10 % 4 * 8, e10.length = Math.ceil(t10 / 4);
        }
        clone() {
          let e10 = super.clone.call(this);
          return e10.words = this.words.slice(0), e10;
        }
      };
      (u = "symbol" != typeof (c = "random") ? c + "" : c) in aL ? aN(aL, u, { enumerable: true, configurable: true, writable: true, value: aR }) : aL[u] = aR;
      var aq = { stringify(e10) {
        let { words: t10, sigBytes: r10 } = e10, n10 = [];
        for (let e11 = 0; e11 < r10; e11 += 1) {
          let r11 = t10[e11 >>> 2] >>> 24 - e11 % 4 * 8 & 255;
          n10.push((r11 >>> 4).toString(16)), n10.push((15 & r11).toString(16));
        }
        return n10.join("");
      }, parse(e10) {
        let t10 = e10.length, r10 = [];
        for (let n10 = 0; n10 < t10; n10 += 2) r10[n10 >>> 3] |= parseInt(e10.substr(n10, 2), 16) << 24 - n10 % 8 * 4;
        return new aL(r10, t10 / 2);
      } }, aD = { stringify(e10) {
        let { words: t10, sigBytes: r10 } = e10, n10 = [];
        for (let e11 = 0; e11 < r10; e11 += 1) {
          let r11 = t10[e11 >>> 2] >>> 24 - e11 % 4 * 8 & 255;
          n10.push(String.fromCharCode(r11));
        }
        return n10.join("");
      }, parse(e10) {
        let t10 = e10.length, r10 = [];
        for (let n10 = 0; n10 < t10; n10 += 1) r10[n10 >>> 2] |= (255 & e10.charCodeAt(n10)) << 24 - n10 % 4 * 8;
        return new aL(r10, t10);
      } }, aj = { stringify(e10) {
        try {
          return decodeURIComponent(escape(aD.stringify(e10)));
        } catch {
          throw Error("Malformed UTF-8 data");
        }
      }, parse: (e10) => aD.parse(unescape(encodeURIComponent(e10))) }, aB = class extends aM {
        constructor() {
          super(), this._minBufferSize = 0;
        }
        reset() {
          this._data = new aL(), this._nDataBytes = 0;
        }
        _append(e10) {
          let t10 = e10;
          "string" == typeof t10 && (t10 = aj.parse(t10)), this._data.concat(t10), this._nDataBytes += t10.sigBytes;
        }
        _process(e10) {
          let t10, { _data: r10, blockSize: n10 } = this, i10 = r10.words, s10 = r10.sigBytes, a10 = s10 / (4 * n10), o10 = (a10 = e10 ? Math.ceil(a10) : Math.max((0 | a10) - this._minBufferSize, 0)) * n10, l2 = Math.min(4 * o10, s10);
          if (o10) {
            for (let e11 = 0; e11 < o10; e11 += n10) this._doProcessBlock(i10, e11);
            t10 = i10.splice(0, o10), r10.sigBytes -= l2;
          }
          return new aL(t10, l2);
        }
        clone() {
          let e10 = super.clone.call(this);
          return e10._data = this._data.clone(), e10;
        }
      }, aH = class extends aB {
        constructor(e10) {
          super(), this.blockSize = 16, this.cfg = Object.assign(new aM(), e10), this.reset();
        }
        static _createHelper(e10) {
          return (t10, r10) => new e10(r10).finalize(t10);
        }
        static _createHmacHelper(e10) {
          return (t10, r10) => new aK(e10, r10).finalize(t10);
        }
        reset() {
          super.reset.call(this), this._doReset();
        }
        update(e10) {
          return this._append(e10), this._process(), this;
        }
        finalize(e10) {
          return e10 && this._append(e10), this._doFinalize();
        }
      }, aK = class extends aM {
        constructor(e10, t10) {
          super();
          let r10 = new e10();
          this._hasher = r10;
          let n10 = t10;
          "string" == typeof n10 && (n10 = aj.parse(n10));
          let i10 = r10.blockSize, s10 = 4 * i10;
          n10.sigBytes > s10 && (n10 = r10.finalize(t10)), n10.clamp();
          let a10 = n10.clone();
          this._oKey = a10;
          let o10 = n10.clone();
          this._iKey = o10;
          let l2 = a10.words, c2 = o10.words;
          for (let e11 = 0; e11 < i10; e11 += 1) l2[e11] ^= 1549556828, c2[e11] ^= 909522486;
          a10.sigBytes = s10, o10.sigBytes = s10, this.reset();
        }
        reset() {
          let e10 = this._hasher;
          e10.reset(), e10.update(this._iKey);
        }
        update(e10) {
          return this._hasher.update(e10), this;
        }
        finalize(e10) {
          let t10 = this._hasher, r10 = t10.finalize(e10);
          return t10.reset(), t10.finalize(this._oKey.clone().concat(r10));
        }
      }, a$ = (e10, t10, r10) => {
        let n10 = [], i10 = 0;
        for (let s10 = 0; s10 < t10; s10 += 1) if (s10 % 4) {
          let t11 = r10[e10.charCodeAt(s10 - 1)] << s10 % 4 * 2 | r10[e10.charCodeAt(s10)] >>> 6 - s10 % 4 * 2;
          n10[i10 >>> 2] |= t11 << 24 - i10 % 4 * 8, i10 += 1;
        }
        return aL.create(n10, i10);
      }, az = { stringify(e10) {
        let { words: t10, sigBytes: r10 } = e10, n10 = this._map;
        e10.clamp();
        let i10 = [];
        for (let e11 = 0; e11 < r10; e11 += 3) {
          let s11 = (t10[e11 >>> 2] >>> 24 - e11 % 4 * 8 & 255) << 16 | (t10[e11 + 1 >>> 2] >>> 24 - (e11 + 1) % 4 * 8 & 255) << 8 | t10[e11 + 2 >>> 2] >>> 24 - (e11 + 2) % 4 * 8 & 255;
          for (let t11 = 0; t11 < 4 && e11 + 0.75 * t11 < r10; t11 += 1) i10.push(n10.charAt(s11 >>> 6 * (3 - t11) & 63));
        }
        let s10 = n10.charAt(64);
        if (s10) for (; i10.length % 4; ) i10.push(s10);
        return i10.join("");
      }, parse(e10) {
        let t10 = e10.length, r10 = this._map, n10 = this._reverseMap;
        if (!n10) {
          this._reverseMap = [], n10 = this._reverseMap;
          for (let e11 = 0; e11 < r10.length; e11 += 1) n10[r10.charCodeAt(e11)] = e11;
        }
        let i10 = r10.charAt(64);
        if (i10) {
          let r11 = e10.indexOf(i10);
          -1 !== r11 && (t10 = r11);
        }
        return a$(e10, t10, n10);
      }, _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=" }, aF = [];
      for (let e10 = 0; e10 < 64; e10 += 1) aF[e10] = 4294967296 * Math.abs(Math.sin(e10 + 1)) | 0;
      var aJ = (e10, t10, r10, n10, i10, s10, a10) => {
        let o10 = e10 + (t10 & r10 | ~t10 & n10) + i10 + a10;
        return (o10 << s10 | o10 >>> 32 - s10) + t10;
      }, aV = (e10, t10, r10, n10, i10, s10, a10) => {
        let o10 = e10 + (t10 & n10 | r10 & ~n10) + i10 + a10;
        return (o10 << s10 | o10 >>> 32 - s10) + t10;
      }, aW = (e10, t10, r10, n10, i10, s10, a10) => {
        let o10 = e10 + (t10 ^ r10 ^ n10) + i10 + a10;
        return (o10 << s10 | o10 >>> 32 - s10) + t10;
      }, aG = (e10, t10, r10, n10, i10, s10, a10) => {
        let o10 = e10 + (r10 ^ (t10 | ~n10)) + i10 + a10;
        return (o10 << s10 | o10 >>> 32 - s10) + t10;
      }, aX = class extends aH {
        _doReset() {
          this._hash = new aL([1732584193, 4023233417, 2562383102, 271733878]);
        }
        _doProcessBlock(e10, t10) {
          for (let r11 = 0; r11 < 16; r11 += 1) {
            let n11 = t10 + r11, i11 = e10[n11];
            e10[n11] = (i11 << 8 | i11 >>> 24) & 16711935 | (i11 << 24 | i11 >>> 8) & 4278255360;
          }
          let r10 = this._hash.words, n10 = e10[t10 + 0], i10 = e10[t10 + 1], s10 = e10[t10 + 2], a10 = e10[t10 + 3], o10 = e10[t10 + 4], l2 = e10[t10 + 5], c2 = e10[t10 + 6], u2 = e10[t10 + 7], d2 = e10[t10 + 8], h2 = e10[t10 + 9], p2 = e10[t10 + 10], f2 = e10[t10 + 11], g2 = e10[t10 + 12], m2 = e10[t10 + 13], y2 = e10[t10 + 14], b2 = e10[t10 + 15], _2 = r10[0], v2 = r10[1], w2 = r10[2], k2 = r10[3];
          _2 = aJ(_2, v2, w2, k2, n10, 7, aF[0]), k2 = aJ(k2, _2, v2, w2, i10, 12, aF[1]), w2 = aJ(w2, k2, _2, v2, s10, 17, aF[2]), v2 = aJ(v2, w2, k2, _2, a10, 22, aF[3]), _2 = aJ(_2, v2, w2, k2, o10, 7, aF[4]), k2 = aJ(k2, _2, v2, w2, l2, 12, aF[5]), w2 = aJ(w2, k2, _2, v2, c2, 17, aF[6]), v2 = aJ(v2, w2, k2, _2, u2, 22, aF[7]), _2 = aJ(_2, v2, w2, k2, d2, 7, aF[8]), k2 = aJ(k2, _2, v2, w2, h2, 12, aF[9]), w2 = aJ(w2, k2, _2, v2, p2, 17, aF[10]), v2 = aJ(v2, w2, k2, _2, f2, 22, aF[11]), _2 = aJ(_2, v2, w2, k2, g2, 7, aF[12]), k2 = aJ(k2, _2, v2, w2, m2, 12, aF[13]), w2 = aJ(w2, k2, _2, v2, y2, 17, aF[14]), v2 = aJ(v2, w2, k2, _2, b2, 22, aF[15]), _2 = aV(_2, v2, w2, k2, i10, 5, aF[16]), k2 = aV(k2, _2, v2, w2, c2, 9, aF[17]), w2 = aV(w2, k2, _2, v2, f2, 14, aF[18]), v2 = aV(v2, w2, k2, _2, n10, 20, aF[19]), _2 = aV(_2, v2, w2, k2, l2, 5, aF[20]), k2 = aV(k2, _2, v2, w2, p2, 9, aF[21]), w2 = aV(w2, k2, _2, v2, b2, 14, aF[22]), v2 = aV(v2, w2, k2, _2, o10, 20, aF[23]), _2 = aV(_2, v2, w2, k2, h2, 5, aF[24]), k2 = aV(k2, _2, v2, w2, y2, 9, aF[25]), w2 = aV(w2, k2, _2, v2, a10, 14, aF[26]), v2 = aV(v2, w2, k2, _2, d2, 20, aF[27]), _2 = aV(_2, v2, w2, k2, m2, 5, aF[28]), k2 = aV(k2, _2, v2, w2, s10, 9, aF[29]), w2 = aV(w2, k2, _2, v2, u2, 14, aF[30]), v2 = aV(v2, w2, k2, _2, g2, 20, aF[31]), _2 = aW(_2, v2, w2, k2, l2, 4, aF[32]), k2 = aW(k2, _2, v2, w2, d2, 11, aF[33]), w2 = aW(w2, k2, _2, v2, f2, 16, aF[34]), v2 = aW(v2, w2, k2, _2, y2, 23, aF[35]), _2 = aW(_2, v2, w2, k2, i10, 4, aF[36]), k2 = aW(k2, _2, v2, w2, o10, 11, aF[37]), w2 = aW(w2, k2, _2, v2, u2, 16, aF[38]), v2 = aW(v2, w2, k2, _2, p2, 23, aF[39]), _2 = aW(_2, v2, w2, k2, m2, 4, aF[40]), k2 = aW(k2, _2, v2, w2, n10, 11, aF[41]), w2 = aW(w2, k2, _2, v2, a10, 16, aF[42]), v2 = aW(v2, w2, k2, _2, c2, 23, aF[43]), _2 = aW(_2, v2, w2, k2, h2, 4, aF[44]), k2 = aW(k2, _2, v2, w2, g2, 11, aF[45]), w2 = aW(w2, k2, _2, v2, b2, 16, aF[46]), v2 = aW(v2, w2, k2, _2, s10, 23, aF[47]), _2 = aG(_2, v2, w2, k2, n10, 6, aF[48]), k2 = aG(k2, _2, v2, w2, u2, 10, aF[49]), w2 = aG(w2, k2, _2, v2, y2, 15, aF[50]), v2 = aG(v2, w2, k2, _2, l2, 21, aF[51]), _2 = aG(_2, v2, w2, k2, g2, 6, aF[52]), k2 = aG(k2, _2, v2, w2, a10, 10, aF[53]), w2 = aG(w2, k2, _2, v2, p2, 15, aF[54]), v2 = aG(v2, w2, k2, _2, i10, 21, aF[55]), _2 = aG(_2, v2, w2, k2, d2, 6, aF[56]), k2 = aG(k2, _2, v2, w2, b2, 10, aF[57]), w2 = aG(w2, k2, _2, v2, c2, 15, aF[58]), v2 = aG(v2, w2, k2, _2, m2, 21, aF[59]), _2 = aG(_2, v2, w2, k2, o10, 6, aF[60]), k2 = aG(k2, _2, v2, w2, f2, 10, aF[61]), w2 = aG(w2, k2, _2, v2, s10, 15, aF[62]), v2 = aG(v2, w2, k2, _2, h2, 21, aF[63]), r10[0] = r10[0] + _2 | 0, r10[1] = r10[1] + v2 | 0, r10[2] = r10[2] + w2 | 0, r10[3] = r10[3] + k2 | 0;
        }
        _doFinalize() {
          let e10 = this._data, t10 = e10.words, r10 = 8 * this._nDataBytes, n10 = 8 * e10.sigBytes;
          t10[n10 >>> 5] |= 128 << 24 - n10 % 32;
          let i10 = Math.floor(r10 / 4294967296);
          t10[(n10 + 64 >>> 9 << 4) + 15] = (i10 << 8 | i10 >>> 24) & 16711935 | (i10 << 24 | i10 >>> 8) & 4278255360, t10[(n10 + 64 >>> 9 << 4) + 14] = (r10 << 8 | r10 >>> 24) & 16711935 | (r10 << 24 | r10 >>> 8) & 4278255360, e10.sigBytes = (t10.length + 1) * 4, this._process();
          let s10 = this._hash, a10 = s10.words;
          for (let e11 = 0; e11 < 4; e11 += 1) {
            let t11 = a10[e11];
            a10[e11] = (t11 << 8 | t11 >>> 24) & 16711935 | (t11 << 24 | t11 >>> 8) & 4278255360;
          }
          return s10;
        }
        clone() {
          let e10 = super.clone.call(this);
          return e10._hash = this._hash.clone(), e10;
        }
      };
      aH._createHelper(aX), aH._createHmacHelper(aX);
      var aY = class extends aM {
        constructor(e10) {
          super(), this.cfg = Object.assign(new aM(), { keySize: 4, hasher: aX, iterations: 1 }, e10);
        }
        compute(e10, t10) {
          let r10, { cfg: n10 } = this, i10 = n10.hasher.create(), s10 = aL.create(), a10 = s10.words, { keySize: o10, iterations: l2 } = n10;
          for (; a10.length < o10; ) {
            r10 && i10.update(r10), r10 = i10.update(e10).finalize(t10), i10.reset();
            for (let e11 = 1; e11 < l2; e11 += 1) r10 = i10.finalize(r10), i10.reset();
            s10.concat(r10);
          }
          return s10.sigBytes = 4 * o10, s10;
        }
      }, aQ = class extends aB {
        constructor(e10, t10, r10) {
          super(), this.cfg = Object.assign(new aM(), r10), this._xformMode = e10, this._key = t10, this.reset();
        }
        static createEncryptor(e10, t10) {
          return this.create(this._ENC_XFORM_MODE, e10, t10);
        }
        static createDecryptor(e10, t10) {
          return this.create(this._DEC_XFORM_MODE, e10, t10);
        }
        static _createHelper(e10) {
          let t10 = (e11) => "string" == typeof e11 ? a6 : a5;
          return { encrypt: (r10, n10, i10) => t10(n10).encrypt(e10, r10, n10, i10), decrypt: (r10, n10, i10) => t10(n10).decrypt(e10, r10, n10, i10) };
        }
        reset() {
          super.reset.call(this), this._doReset();
        }
        process(e10) {
          return this._append(e10), this._process();
        }
        finalize(e10) {
          return e10 && this._append(e10), this._doFinalize();
        }
      };
      aQ._ENC_XFORM_MODE = 1, aQ._DEC_XFORM_MODE = 2, aQ.keySize = 4, aQ.ivSize = 4;
      var aZ = class extends aM {
        constructor(e10, t10) {
          super(), this._cipher = e10, this._iv = t10;
        }
        static createEncryptor(e10, t10) {
          return this.Encryptor.create(e10, t10);
        }
        static createDecryptor(e10, t10) {
          return this.Decryptor.create(e10, t10);
        }
      };
      function a0(e10, t10, r10) {
        let n10, i10 = this._iv;
        i10 ? (n10 = i10, this._iv = void 0) : n10 = this._prevBlock;
        for (let i11 = 0; i11 < r10; i11 += 1) e10[t10 + i11] ^= n10[i11];
      }
      var a1 = class extends aZ {
      };
      a1.Encryptor = class extends a1 {
        processBlock(e10, t10) {
          let r10 = this._cipher, { blockSize: n10 } = r10;
          a0.call(this, e10, t10, n10), r10.encryptBlock(e10, t10), this._prevBlock = e10.slice(t10, t10 + n10);
        }
      }, a1.Decryptor = class extends a1 {
        processBlock(e10, t10) {
          let r10 = this._cipher, { blockSize: n10 } = r10, i10 = e10.slice(t10, t10 + n10);
          r10.decryptBlock(e10, t10), a0.call(this, e10, t10, n10), this._prevBlock = i10;
        }
      };
      var a2 = { pad(e10, t10) {
        let r10 = 4 * t10, n10 = r10 - e10.sigBytes % r10, i10 = n10 << 24 | n10 << 16 | n10 << 8 | n10, s10 = [];
        for (let e11 = 0; e11 < n10; e11 += 4) s10.push(i10);
        let a10 = aL.create(s10, n10);
        e10.concat(a10);
      }, unpad(e10) {
        let t10 = 255 & e10.words[e10.sigBytes - 1 >>> 2];
        e10.sigBytes -= t10;
      } }, a4 = class extends aQ {
        constructor(e10, t10, r10) {
          super(e10, t10, Object.assign({ mode: a1, padding: a2 }, r10)), this.blockSize = 4;
        }
        reset() {
          let e10;
          super.reset.call(this);
          let { cfg: t10 } = this, { iv: r10, mode: n10 } = t10;
          this._xformMode === this.constructor._ENC_XFORM_MODE ? e10 = n10.createEncryptor : (e10 = n10.createDecryptor, this._minBufferSize = 1), this._mode = e10.call(n10, this, r10 && r10.words), this._mode.__creator = e10;
        }
        _doProcessBlock(e10, t10) {
          this._mode.processBlock(e10, t10);
        }
        _doFinalize() {
          let e10, { padding: t10 } = this.cfg;
          return this._xformMode === this.constructor._ENC_XFORM_MODE ? (t10.pad(this._data, this.blockSize), e10 = this._process(true)) : (e10 = this._process(true), t10.unpad(e10)), e10;
        }
      }, a3 = class extends aM {
        constructor(e10) {
          super(), this.mixIn(e10);
        }
        toString(e10) {
          return (e10 || this.formatter).stringify(this);
        }
      }, a5 = class extends aM {
        static encrypt(e10, t10, r10, n10) {
          let i10 = Object.assign(new aM(), this.cfg, n10), s10 = e10.createEncryptor(r10, i10), a10 = s10.finalize(t10), o10 = s10.cfg;
          return a3.create({ ciphertext: a10, key: r10, iv: o10.iv, algorithm: e10, mode: o10.mode, padding: o10.padding, blockSize: s10.blockSize, formatter: i10.format });
        }
        static decrypt(e10, t10, r10, n10) {
          let i10 = t10, s10 = Object.assign(new aM(), this.cfg, n10);
          return i10 = this._parse(i10, s10.format), e10.createDecryptor(r10, s10).finalize(i10.ciphertext);
        }
        static _parse(e10, t10) {
          return "string" == typeof e10 ? t10.parse(e10, this) : e10;
        }
      };
      a5.cfg = Object.assign(new aM(), { format: { stringify(e10) {
        let { ciphertext: t10, salt: r10 } = e10;
        return (r10 ? aL.create([1398893684, 1701076831]).concat(r10).concat(t10) : t10).toString(az);
      }, parse(e10) {
        let t10, r10 = az.parse(e10), n10 = r10.words;
        return 1398893684 === n10[0] && 1701076831 === n10[1] && (t10 = aL.create(n10.slice(2, 4)), n10.splice(0, 4), r10.sigBytes -= 16), a3.create({ ciphertext: r10, salt: t10 });
      } } });
      var a6 = class extends a5 {
        static encrypt(e10, t10, r10, n10) {
          let i10 = Object.assign(new aM(), this.cfg, n10), s10 = i10.kdf.execute(r10, e10.keySize, e10.ivSize, i10.salt, i10.hasher);
          i10.iv = s10.iv;
          let a10 = a5.encrypt.call(this, e10, t10, s10.key, i10);
          return a10.mixIn(s10), a10;
        }
        static decrypt(e10, t10, r10, n10) {
          let i10 = t10, s10 = Object.assign(new aM(), this.cfg, n10);
          i10 = this._parse(i10, s10.format);
          let a10 = s10.kdf.execute(r10, e10.keySize, e10.ivSize, i10.salt, s10.hasher);
          return s10.iv = a10.iv, a5.decrypt.call(this, e10, i10, a10.key, s10);
        }
      };
      a6.cfg = Object.assign(a5.cfg, { kdf: { execute(e10, t10, r10, n10, i10) {
        let s10, a10 = n10;
        a10 || (a10 = aL.random(8)), s10 = i10 ? aY.create({ keySize: t10 + r10, hasher: i10 }).compute(e10, a10) : aY.create({ keySize: t10 + r10 }).compute(e10, a10);
        let o10 = aL.create(s10.words.slice(t10), 4 * r10);
        return s10.sigBytes = 4 * t10, a3.create({ key: s10, iv: o10, salt: a10 });
      } } });
      var a8 = [], a9 = [], a7 = [], oe = [], ot = [], or = [], on = [], oi = [], os = [], oa = [], oo = [];
      for (let e10 = 0; e10 < 256; e10 += 1) e10 < 128 ? oo[e10] = e10 << 1 : oo[e10] = e10 << 1 ^ 283;
      var ol = 0, oc = 0;
      for (let e10 = 0; e10 < 256; e10 += 1) {
        let e11 = oc ^ oc << 1 ^ oc << 2 ^ oc << 3 ^ oc << 4;
        e11 = e11 >>> 8 ^ 255 & e11 ^ 99, a8[ol] = e11, a9[e11] = ol;
        let t10 = oo[ol], r10 = oo[t10], n10 = oo[r10], i10 = 257 * oo[e11] ^ 16843008 * e11;
        a7[ol] = i10 << 24 | i10 >>> 8, oe[ol] = i10 << 16 | i10 >>> 16, ot[ol] = i10 << 8 | i10 >>> 24, or[ol] = i10, i10 = 16843009 * n10 ^ 65537 * r10 ^ 257 * t10 ^ 16843008 * ol, on[e11] = i10 << 24 | i10 >>> 8, oi[e11] = i10 << 16 | i10 >>> 16, os[e11] = i10 << 8 | i10 >>> 24, oa[e11] = i10, ol ? (ol = t10 ^ oo[oo[oo[n10 ^ t10]]], oc ^= oo[oo[oc]]) : ol = oc = 1;
      }
      var ou = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54], od = class extends a4 {
        _doReset() {
          let e10;
          if (this._nRounds && this._keyPriorReset === this._key) return;
          this._keyPriorReset = this._key;
          let t10 = this._keyPriorReset, r10 = t10.words, n10 = t10.sigBytes / 4;
          this._nRounds = n10 + 6;
          let i10 = (this._nRounds + 1) * 4;
          this._keySchedule = [];
          let s10 = this._keySchedule;
          for (let t11 = 0; t11 < i10; t11 += 1) t11 < n10 ? s10[t11] = r10[t11] : (e10 = s10[t11 - 1], t11 % n10 ? n10 > 6 && t11 % n10 == 4 && (e10 = a8[e10 >>> 24] << 24 | a8[e10 >>> 16 & 255] << 16 | a8[e10 >>> 8 & 255] << 8 | a8[255 & e10]) : e10 = (a8[(e10 = e10 << 8 | e10 >>> 24) >>> 24] << 24 | a8[e10 >>> 16 & 255] << 16 | a8[e10 >>> 8 & 255] << 8 | a8[255 & e10]) ^ ou[t11 / n10 | 0] << 24, s10[t11] = s10[t11 - n10] ^ e10);
          this._invKeySchedule = [];
          let a10 = this._invKeySchedule;
          for (let t11 = 0; t11 < i10; t11 += 1) {
            let r11 = i10 - t11;
            e10 = t11 % 4 ? s10[r11] : s10[r11 - 4], t11 < 4 || r11 <= 4 ? a10[t11] = e10 : a10[t11] = on[a8[e10 >>> 24]] ^ oi[a8[e10 >>> 16 & 255]] ^ os[a8[e10 >>> 8 & 255]] ^ oa[a8[255 & e10]];
          }
        }
        encryptBlock(e10, t10) {
          this._doCryptBlock(e10, t10, this._keySchedule, a7, oe, ot, or, a8);
        }
        decryptBlock(e10, t10) {
          let r10 = e10[t10 + 1];
          e10[t10 + 1] = e10[t10 + 3], e10[t10 + 3] = r10, this._doCryptBlock(e10, t10, this._invKeySchedule, on, oi, os, oa, a9), r10 = e10[t10 + 1], e10[t10 + 1] = e10[t10 + 3], e10[t10 + 3] = r10;
        }
        _doCryptBlock(e10, t10, r10, n10, i10, s10, a10, o10) {
          let l2 = this._nRounds, c2 = e10[t10] ^ r10[0], u2 = e10[t10 + 1] ^ r10[1], d2 = e10[t10 + 2] ^ r10[2], h2 = e10[t10 + 3] ^ r10[3], p2 = 4;
          for (let e11 = 1; e11 < l2; e11 += 1) {
            let e12 = n10[c2 >>> 24] ^ i10[u2 >>> 16 & 255] ^ s10[d2 >>> 8 & 255] ^ a10[255 & h2] ^ r10[p2];
            p2 += 1;
            let t11 = n10[u2 >>> 24] ^ i10[d2 >>> 16 & 255] ^ s10[h2 >>> 8 & 255] ^ a10[255 & c2] ^ r10[p2];
            p2 += 1;
            let o11 = n10[d2 >>> 24] ^ i10[h2 >>> 16 & 255] ^ s10[c2 >>> 8 & 255] ^ a10[255 & u2] ^ r10[p2];
            p2 += 1;
            let l3 = n10[h2 >>> 24] ^ i10[c2 >>> 16 & 255] ^ s10[u2 >>> 8 & 255] ^ a10[255 & d2] ^ r10[p2];
            p2 += 1, c2 = e12, u2 = t11, d2 = o11, h2 = l3;
          }
          let f2 = (o10[c2 >>> 24] << 24 | o10[u2 >>> 16 & 255] << 16 | o10[d2 >>> 8 & 255] << 8 | o10[255 & h2]) ^ r10[p2];
          p2 += 1;
          let g2 = (o10[u2 >>> 24] << 24 | o10[d2 >>> 16 & 255] << 16 | o10[h2 >>> 8 & 255] << 8 | o10[255 & c2]) ^ r10[p2];
          p2 += 1;
          let m2 = (o10[d2 >>> 24] << 24 | o10[h2 >>> 16 & 255] << 16 | o10[c2 >>> 8 & 255] << 8 | o10[255 & u2]) ^ r10[p2];
          p2 += 1;
          let y2 = (o10[h2 >>> 24] << 24 | o10[c2 >>> 16 & 255] << 16 | o10[u2 >>> 8 & 255] << 8 | o10[255 & d2]) ^ r10[p2];
          p2 += 1, e10[t10] = f2, e10[t10 + 1] = g2, e10[t10 + 2] = m2, e10[t10 + 3] = y2;
        }
      };
      od.keySize = 8;
      var oh = a4._createHelper(od), op = [], of = class extends aH {
        _doReset() {
          this._hash = new aL([1732584193, 4023233417, 2562383102, 271733878, 3285377520]);
        }
        _doProcessBlock(e10, t10) {
          let r10 = this._hash.words, n10 = r10[0], i10 = r10[1], s10 = r10[2], a10 = r10[3], o10 = r10[4];
          for (let r11 = 0; r11 < 80; r11 += 1) {
            if (r11 < 16) op[r11] = 0 | e10[t10 + r11];
            else {
              let e11 = op[r11 - 3] ^ op[r11 - 8] ^ op[r11 - 14] ^ op[r11 - 16];
              op[r11] = e11 << 1 | e11 >>> 31;
            }
            let l2 = (n10 << 5 | n10 >>> 27) + o10 + op[r11];
            r11 < 20 ? l2 += (i10 & s10 | ~i10 & a10) + 1518500249 : r11 < 40 ? l2 += (i10 ^ s10 ^ a10) + 1859775393 : r11 < 60 ? l2 += (i10 & s10 | i10 & a10 | s10 & a10) - 1894007588 : l2 += (i10 ^ s10 ^ a10) - 899497514, o10 = a10, a10 = s10, s10 = i10 << 30 | i10 >>> 2, i10 = n10, n10 = l2;
          }
          r10[0] = r10[0] + n10 | 0, r10[1] = r10[1] + i10 | 0, r10[2] = r10[2] + s10 | 0, r10[3] = r10[3] + a10 | 0, r10[4] = r10[4] + o10 | 0;
        }
        _doFinalize() {
          let e10 = this._data, t10 = e10.words, r10 = 8 * this._nDataBytes, n10 = 8 * e10.sigBytes;
          return t10[n10 >>> 5] |= 128 << 24 - n10 % 32, t10[(n10 + 64 >>> 9 << 4) + 14] = Math.floor(r10 / 4294967296), t10[(n10 + 64 >>> 9 << 4) + 15] = r10, e10.sigBytes = 4 * t10.length, this._process(), this._hash;
        }
        clone() {
          let e10 = super.clone.call(this);
          return e10._hash = this._hash.clone(), e10;
        }
      }, og = (aH._createHelper(of), aH._createHmacHelper(of));
      let om = `
Missing domain and proxyUrl. A satellite application needs to specify a domain or a proxyUrl.

1) With middleware
   e.g. export default clerkMiddleware({domain:'YOUR_DOMAIN',isSatellite:true});
2) With environment variables e.g.
   NEXT_PUBLIC_CLERK_DOMAIN='YOUR_DOMAIN'
   NEXT_PUBLIC_CLERK_IS_SATELLITE='true'
   `, oy = `
Invalid signInUrl. A satellite application requires a signInUrl for development instances.
Check if signInUrl is missing from your configuration or if it is not an absolute URL

1) With middleware
   e.g. export default clerkMiddleware({signInUrl:'SOME_URL', isSatellite:true});
2) With environment variables e.g.
   NEXT_PUBLIC_CLERK_SIGN_IN_URL='SOME_URL'
   NEXT_PUBLIC_CLERK_IS_SATELLITE='true'`, ob = `Clerk: Unable to decrypt request data.

Refresh the page if your .env file was just updated. If the issue persists, ensure the encryption key is valid and properly set.

For more information, see: https://clerk.com/docs/reference/nextjs/clerk-middleware#dynamic-keys. (code=encryption_key_invalid)`, o_ = e9({ packageName: "@clerk/nextjs" }), ov = "x-middleware-override-headers", ow = "x-middleware-request", ok = (e10, t10, r10) => {
        e10.headers.get(ov) || (e10.headers.set(ov, [...t10.headers.keys()]), t10.headers.forEach((t11, r11) => {
          e10.headers.set(`${ow}-${r11}`, t11);
        })), Object.entries(r10).forEach(([t11, r11]) => {
          e10.headers.set(ov, `${e10.headers.get(ov)},${t11}`), e10.headers.set(`${ow}-${t11}`, r11);
        });
      }, oS = (e10, t10) => {
        let r10;
        let n10 = sA(null == t10 ? void 0 : t10.proxyUrl, e10.clerkUrl, sH);
        r10 = n10 && !as(n10) ? new URL(n10, e10.clerkUrl).toString() : n10;
        let i10 = sA(t10.isSatellite, new URL(e10.url), sK), s10 = sA(t10.domain, new URL(e10.url), sB), a10 = (null == t10 ? void 0 : t10.signInUrl) || s$;
        if (i10 && !r10 && !s10) throw Error(om);
        if (i10 && !as(a10) && eV(t10.secretKey || sM)) throw Error(oy);
        return { proxyUrl: r10, isSatellite: i10, domain: s10, signInUrl: a10 };
      }, oT = (e10) => K.redirect(e10, { headers: { [rr.Headers.ClerkRedirectTo]: "true" } }), ox = "clerk_keyless_dummy_key";
      function oE() {
        if (eP()) throw Error("Clerk: Unable to decrypt request data, this usually means the encryption key is invalid. Ensure the encryption key is properly set. For more information, see: https://clerk.com/docs/reference/nextjs/clerk-middleware#dynamic-keys. (code=encryption_key_invalid)");
        throw Error(ob);
      }
      function oO(e10, t10) {
        return JSON.parse(oh.decrypt(e10, t10).toString(aj));
      }
      let oC = async () => {
        var e10, t10;
        let r10;
        try {
          let e11 = await s2(), t11 = at(e11, rr.Headers.ClerkRequestData);
          r10 = function(e12) {
            if (!e12) return {};
            let t12 = eP() ? sD || sM : sD || sM || ox;
            try {
              return oO(e12, t12);
            } catch {
              oE();
            }
          }(t11);
        } catch (e11) {
          if (e11 && sZ(e11) || e11 && sW(e11)) throw e11;
        }
        let n10 = null != (t10 = null == (e10 = ai.getStore()) ? void 0 : e10.get("requestData")) ? t10 : r10;
        return (null == n10 ? void 0 : n10.secretKey) || (null == n10 ? void 0 : n10.publishableKey) ? ae(n10) : ae({});
      };
      class oI {
        static createDefaultDirectives() {
          return Object.entries(this.DEFAULT_DIRECTIVES).reduce((e10, [t10, r10]) => (e10[t10] = new Set(r10), e10), {});
        }
        static isKeyword(e10) {
          return this.KEYWORDS.has(e10.replace(/^'|'$/g, ""));
        }
        static formatValue(e10) {
          let t10 = e10.replace(/^'|'$/g, "");
          return this.isKeyword(t10) ? `'${t10}'` : e10;
        }
        static handleDirectiveValues(e10) {
          let t10 = /* @__PURE__ */ new Set();
          return e10.includes("'none'") || e10.includes("none") ? t10.add("'none'") : e10.forEach((e11) => t10.add(this.formatValue(e11))), t10;
        }
      }
      oI.KEYWORDS = /* @__PURE__ */ new Set(["none", "self", "strict-dynamic", "unsafe-eval", "unsafe-hashes", "unsafe-inline"]), oI.DEFAULT_DIRECTIVES = { "connect-src": ["self", "https://clerk-telemetry.com", "https://*.clerk-telemetry.com", "https://api.stripe.com", "https://maps.googleapis.com", "https://img.clerk.com", "https://images.clerkstage.dev"], "default-src": ["self"], "form-action": ["self"], "frame-src": ["self", "https://challenges.cloudflare.com", "https://*.js.stripe.com", "https://js.stripe.com", "https://hooks.stripe.com"], "img-src": ["self", "https://img.clerk.com"], "script-src": ["self", "unsafe-inline", "https:", "http:", "https://*.js.stripe.com", "https://js.stripe.com", "https://maps.googleapis.com"], "style-src": ["self", "unsafe-inline"], "worker-src": ["self", "blob:"] };
      let oP = "__clerk_keys_";
      async function oA(e10) {
        let t10 = new TextEncoder().encode(e10);
        return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", t10))).map((e11) => e11.toString(16).padStart(2, "0")).join("").slice(0, 16);
      }
      async function oR() {
        let e10 = process.env.PWD;
        if (!e10) return `${oP}0`;
        let t10 = e10.split("/").filter(Boolean).slice(-3).reverse().join("/"), r10 = await oA(t10);
        return `${oP}${r10}`;
      }
      async function oN(e10) {
        let t10;
      }
      let oU = { REDIRECT_TO_URL: "CLERK_PROTECT_REDIRECT_TO_URL", REDIRECT_TO_SIGN_IN: "CLERK_PROTECT_REDIRECT_TO_SIGN_IN", REDIRECT_TO_SIGN_UP: "CLERK_PROTECT_REDIRECT_TO_SIGN_UP" }, oM = { NOT_FOUND: 404, FORBIDDEN: 403, UNAUTHORIZED: 401 }, oL = new Set(Object.values(oM)), oq = "NEXT_HTTP_ERROR_FALLBACK";
      function oD(e10) {
        if (!function(e11) {
          if ("object" != typeof e11 || null === e11 || !("digest" in e11) || "string" != typeof e11.digest) return false;
          let [t11, r10] = e11.digest.split(";");
          return t11 === oq && oL.has(Number(r10));
        }(e10)) return;
        let [, t10] = e10.digest.split(";");
        return Number(t10);
      }
      let oj = "NEXT_REDIRECT";
      function oB(e10, t10, r10 = "replace", n10 = 307) {
        let i10 = Error(oj);
        throw i10.digest = `${oj};${r10};${e10};${n10};`, i10.clerk_digest = oU.REDIRECT_TO_URL, Object.assign(i10, t10), i10;
      }
      function oH(e10, t10) {
        return null === t10 ? "" : t10 || e10;
      }
      function oK(e10) {
        if ("object" != typeof e10 || null === e10 || !("digest" in e10) || "string" != typeof e10.digest) return false;
        let t10 = e10.digest.split(";"), [r10, n10] = t10, i10 = t10.slice(2, -2).join(";"), s10 = Number(t10.at(-2));
        return r10 === oj && ("replace" === n10 || "push" === n10) && "string" == typeof i10 && !isNaN(s10) && 307 === s10;
      }
      function o$() {
        let e10 = Error(oq);
        throw e10.digest = `${oq};${oM.UNAUTHORIZED}`, e10;
      }
      let oz = (e10) => {
        if (e10 && !e10.unauthenticatedUrl && !e10.unauthorizedUrl && !e10.token && (1 !== Object.keys(e10).length || !("token" in e10))) return e10;
      }, oF = (e10) => {
        var t10, r10;
        return !!e10.headers.get(sw.Headers.NextUrl) && ((null == (t10 = e10.headers.get(rr.Headers.Accept)) ? void 0 : t10.includes("text/x-component")) || (null == (r10 = e10.headers.get(rr.Headers.ContentType)) ? void 0 : r10.includes("multipart/form-data")) || !!e10.headers.get(sw.Headers.NextAction));
      }, oJ = (e10) => {
        var t10;
        return "document" === e10.headers.get(rr.Headers.SecFetchDest) || "iframe" === e10.headers.get(rr.Headers.SecFetchDest) || (null == (t10 = e10.headers.get(rr.Headers.Accept)) ? void 0 : t10.includes("text/html")) || oV(e10) || oG(e10);
      }, oV = (e10) => !!e10.headers.get(sw.Headers.NextUrl) && !oF(e10) || oW(), oW = () => {
        let e10 = globalThis.fetch;
        if (!function(e11) {
          return "__nextPatched" in e11 && true === e11.__nextPatched;
        }(e10)) return false;
        let { page: t10 } = e10.__nextGetStaticStore().getStore() || {};
        return !!t10;
      }, oG = (e10) => !!e10.headers.get(sw.Headers.NextjsData), oX = (e10) => [e10[0] instanceof Request ? e10[0] : void 0, e10[0] instanceof Request ? e10[1] : void 0], oY = (e10) => ["function" == typeof e10[0] ? e10[0] : void 0, (2 === e10.length ? e10[1] : "function" == typeof e10[0] ? {} : e10[0]) || {}], oQ = (e10) => "/clerk-sync-keyless" === e10.nextUrl.pathname, oZ = (e10) => {
        let t10 = e10.nextUrl.searchParams.get("returnUrl"), r10 = new URL(e10.url);
        return r10.pathname = "", K.redirect(t10 || r10.toString());
      }, o0 = (e10, t10) => {
        let r10 = t10;
        if (t10.frontendApiProxy && !t10.proxyUrl) {
          let { enabled: n10, path: i10 = eB } = t10.frontendApiProxy, s10 = new URL(e10.url);
          if ("function" == typeof n10 ? n10(s10) : n10) {
            let e11 = `${s10.origin}${i10}`;
            r10 = { ...t10, proxyUrl: e11 };
          }
        }
        return { ...r10, ...oS(e10, r10), acceptsToken: "any" };
      }, o1 = (e10) => (t10 = {}) => {
        !function(e11, t11) {
          oB(e11, { clerk_digest: oU.REDIRECT_TO_SIGN_IN, returnBackUrl: oH(e11, t11) });
        }(e10.clerkUrl.toString(), t10.returnBackUrl);
      }, o2 = (e10) => (t10 = {}) => {
        !function(e11, t11) {
          oB(e11, { clerk_digest: oU.REDIRECT_TO_SIGN_UP, returnBackUrl: oH(e11, t11) });
        }(e10.clerkUrl.toString(), t10.returnBackUrl);
      }, o4 = (e10, t10, r10) => async (n10, i10) => function(e11) {
        let { redirectToSignIn: t11, authObject: r11, redirect: n11, notFound: i11, request: s10, unauthorized: a10 } = e11;
        return async (...e12) => {
          var o10, l2, c2, u2, d2, h2;
          let p2 = oz(e12[0]), f2 = (null == (o10 = e12[0]) ? void 0 : o10.unauthenticatedUrl) || (null == (l2 = e12[1]) ? void 0 : l2.unauthenticatedUrl), g2 = (null == (c2 = e12[0]) ? void 0 : c2.unauthorizedUrl) || (null == (u2 = e12[1]) ? void 0 : u2.unauthorizedUrl), m2 = (null == (d2 = e12[0]) ? void 0 : d2.token) || (null == (h2 = e12[1]) ? void 0 : h2.token) || rl.SessionToken, y2 = () => r11.tokenType === rl.SessionToken && r6(rl.SessionToken, m2) ? g2 ? n11(g2) : i11() : a10();
          return r6(r11.tokenType, m2) ? r11.tokenType !== rl.SessionToken ? r11.isAuthenticated ? r11 : y2() : "pending" !== r11.sessionStatus && r11.userId ? p2 ? "function" == typeof p2 ? p2(r11.has) ? r11 : y2() : r11.has(p2) ? r11 : y2() : r11 : f2 ? n11(f2) : oJ(s10) ? t11() : oF(s10) ? a10() : i11() : y2();
        };
      }({ request: e10, redirect: (e11) => oB(e11, { redirectUrl: e11 }), notFound: () => function() {
        let e11 = Error(sv);
        throw e11.digest = sv, e11;
      }(), unauthorized: o$, authObject: iY({ authObject: t10, acceptsToken: (null == n10 ? void 0 : n10.token) || (null == i10 ? void 0 : i10.token) || rl.SessionToken }), redirectToSignIn: r10 })(n10, i10), o3 = (e10, t10, r10) => async (n10) => {
        var i10;
        let s10 = e10.toAuth({ treatPendingAsSignedOut: null == n10 ? void 0 : n10.treatPendingAsSignedOut }), a10 = null != (i10 = null == n10 ? void 0 : n10.acceptsToken) ? i10 : rl.SessionToken, o10 = iY({ authObject: s10, acceptsToken: a10 });
        return o10.tokenType === rl.SessionToken && r6(rl.SessionToken, a10) ? Object.assign(o10, { redirectToSignIn: t10, redirectToSignUp: r10 }) : o10;
      }, o5 = (e10, t10, r10, n10) => {
        var i10;
        if (oD(e10) === oM.UNAUTHORIZED) {
          let e11 = new K(null, { status: 401 }), t11 = n10.toAuth();
          if (t11 && t11.tokenType === rl.OAuthToken) {
            let t12 = eF(n10.publishableKey);
            return sS(e11, "WWW-Authenticate", `Bearer resource_metadata="https://${null == t12 ? void 0 : t12.frontendApi}/.well-known/oauth-protected-resource"`);
          }
          return e11;
        }
        if (function(e11) {
          return "object" == typeof e11 && null !== e11 && "digest" in e11 && "NEXT_NOT_FOUND" === e11.digest || oD(e11) === oM.NOT_FOUND;
        }(e10)) return sS(K.rewrite(new URL(`/clerk_${Date.now()}`, r10.url)), rr.Headers.AuthReason, "protect-rewrite");
        let s10 = function(e11) {
          return !!oK(e11) && "clerk_digest" in e11 && e11.clerk_digest === oU.REDIRECT_TO_SIGN_IN;
        }(e10), a10 = function(e11) {
          return !!oK(e11) && "clerk_digest" in e11 && e11.clerk_digest === oU.REDIRECT_TO_SIGN_UP;
        }(e10);
        if (s10 || a10) {
          let r11 = rs({ redirectAdapter: oT, baseUrl: t10.clerkUrl, signInUrl: n10.signInUrl, signUpUrl: n10.signUpUrl, publishableKey: n10.publishableKey, sessionStatus: null == (i10 = n10.toAuth()) ? void 0 : i10.sessionStatus, isSatellite: n10.isSatellite }), { returnBackUrl: a11 } = e10;
          return r11[s10 ? "redirectToSignIn" : "redirectToSignUp"]({ returnBackUrl: a11 });
        }
        if (oK(e10)) return oT(e10.redirectUrl);
        throw e10;
      }, o6 = ((e10) => {
        if ("function" == typeof e10) return (t11) => e10(t11);
        let t10 = eC(e10);
        return (e11) => t10(e11.nextUrl.pathname);
      })(["/sign-in(.*)", "/sign-up(.*)"]), o8 = ((...e10) => {
        let [t10, r10] = oX(e10), [n10, i10] = oY(e10);
        return ai.run(an, () => {
          let e11 = sP("clerkMiddleware", (e12) => async (t11, r11) => {
            var s11, a11;
            let o10 = "function" == typeof i10 ? await i10(t11) : i10, l2 = await oN((e13) => {
              var r12;
              return null == (r12 = t11.cookies.get(e13)) ? void 0 : r12.value;
            }), c2 = function(e13, t12) {
              return e13 || t12(), e13;
            }(o10.publishableKey || sq || (null == l2 ? void 0 : l2.publishableKey), () => o_.throwMissingPublishableKeyError()), u2 = function(e13, t12) {
              return e13 || t12(), e13;
            }(o10.secretKey || sM || (null == l2 ? void 0 : l2.secretKey), () => o_.throwMissingSecretKeyError()), d2 = o10.frontendApiProxy;
            if (d2) {
              let { enabled: e13, path: r12 = eB } = d2, n11 = new URL(t11.url);
              if (("function" == typeof e13 ? e13(n11) : e13) && function(e14, t12) {
                let r13 = sy(t12?.proxyPath || eB), n12 = new URL(e14.url);
                return n12.pathname === r13 || n12.pathname.startsWith(r13 + "/");
              }(t11, { proxyPath: r12 })) return s_(t11, { proxyPath: r12, publishableKey: c2, secretKey: u2 });
            }
            let h2 = { publishableKey: c2, secretKey: u2, signInUrl: o10.signInUrl || s$, signUpUrl: o10.signUpUrl || "/sign-up", ...o10 };
            an.set("requestData", h2);
            let p2 = await oC();
            h2.debug && e12.enable();
            let f2 = i8(t11);
            e12.debug("options", h2), e12.debug("url", () => f2.toJSON());
            let g2 = t11.headers.get(rr.Headers.Authorization);
            g2 && g2.startsWith("Basic ") && e12.debug("Basic Auth detected");
            let m2 = t11.headers.get(rr.Headers.ContentSecurityPolicy);
            m2 && e12.debug("Content-Security-Policy detected", () => ({ value: m2 }));
            let y2 = await p2.authenticateRequest(f2, o0(f2, h2));
            e12.debug("requestState", () => ({ status: y2.status, headers: JSON.stringify(Object.fromEntries(y2.headers)), reason: y2.reason }));
            let b2 = y2.headers.get(rr.Headers.Location);
            if (b2) {
              !function({ locationHeader: e14, requestStateHeaders: t12, publishableKey: r12 }) {
                let n11 = "undefined" != typeof process && !!process.env && (!!process.env.NETLIFY || !!process.env.NETLIFY_FUNCTIONS_TOKEN || "string" == typeof process.env.URL && process.env.URL.endsWith("netlify.app")), i11 = r12.startsWith("test_") || r12.startsWith("pk_test_");
                if (n11 && i11 && !e14.includes("__clerk_handshake")) {
                  let r13 = new URL(e14);
                  r13.searchParams.append("__clerk_netlify_cache_bust", Date.now().toString()), t12.set("Location", r13.toString());
                }
              }({ locationHeader: b2, requestStateHeaders: y2.headers, publishableKey: y2.publishableKey });
              let e13 = K.redirect(y2.headers.get(rr.Headers.Location) || b2);
              return y2.headers.forEach((t12, r12) => {
                r12 !== rr.Headers.Location && e13.headers.append(r12, t12);
              }), e13;
            }
            if (y2.status === iQ.Handshake) throw Error("Clerk: handshake status without redirect");
            let _2 = y2.toAuth();
            e12.debug("auth", () => ({ auth: _2, debug: _2.debug() }));
            let v2 = o1(f2), w2 = o2(f2), k2 = await o4(f2, _2, v2), S2 = o3(y2, v2, w2);
            S2.protect = k2;
            let T2 = K.next();
            try {
              T2 = await ai.run(an, async () => null == n10 ? void 0 : n10(S2, t11, r11)) || T2;
            } catch (e13) {
              T2 = o5(e13, f2, t11, y2);
            }
            if (h2.contentSecurityPolicy) {
              let { headers: t12 } = function(e13, t13) {
                var r13;
                let n11 = [], i11 = t13.strict ? function() {
                  let e14 = new Uint8Array(16);
                  return crypto.getRandomValues(e14), btoa(Array.from(e14, (e15) => String.fromCharCode(e15)).join(""));
                }() : void 0, s12 = function(e14, t14, r14, n12) {
                  let i12 = Object.entries(oI.DEFAULT_DIRECTIVES).reduce((e15, [t15, r15]) => (e15[t15] = new Set(r15), e15), {});
                  if (i12["connect-src"].add(t14), e14 && (i12["script-src"].delete("http:"), i12["script-src"].delete("https:"), i12["script-src"].add("'strict-dynamic'"), n12 && i12["script-src"].add(`'nonce-${n12}'`)), r14) {
                    let e15 = /* @__PURE__ */ new Map();
                    Object.entries(r14).forEach(([t15, r15]) => {
                      let n13 = Array.isArray(r15) ? r15 : [r15];
                      oI.DEFAULT_DIRECTIVES[t15] ? function(e16, t16, r16) {
                        if (r16.includes("'none'") || r16.includes("none")) {
                          e16[t16] = /* @__PURE__ */ new Set(["'none'"]);
                          return;
                        }
                        let n14 = /* @__PURE__ */ new Set();
                        e16[t16].forEach((e17) => {
                          n14.add(oI.formatValue(e17));
                        }), r16.forEach((e17) => {
                          n14.add(oI.formatValue(e17));
                        }), e16[t16] = n14;
                      }(i12, t15, n13) : function(e16, t16, r16) {
                        if (r16.includes("'none'") || r16.includes("none")) {
                          e16.set(t16, /* @__PURE__ */ new Set(["'none'"]));
                          return;
                        }
                        let n14 = /* @__PURE__ */ new Set();
                        r16.forEach((e17) => {
                          let t17 = oI.formatValue(e17);
                          n14.add(t17);
                        }), e16.set(t16, n14);
                      }(e15, t15, n13);
                    }), e15.forEach((e16, t15) => {
                      i12[t15] = e16;
                    });
                  }
                  return Object.entries(i12).sort(([e15], [t15]) => e15.localeCompare(t15)).map(([e15, t15]) => {
                    let r15 = Array.from(t15).map((e16) => ({ raw: e16, formatted: oI.formatValue(e16) }));
                    return `${e15} ${r15.map((e16) => e16.formatted).join(" ")}`;
                  }).join("; ");
                }(null != (r13 = t13.strict) && r13, e13, t13.directives, i11);
                return t13.reportTo && (s12 += "; report-to csp-endpoint", n11.push([rr.Headers.ReportingEndpoints, `csp-endpoint="${t13.reportTo}"`])), t13.reportOnly ? n11.push([rr.Headers.ContentSecurityPolicyReportOnly, s12]) : n11.push([rr.Headers.ContentSecurityPolicy, s12]), i11 && n11.push([rr.Headers.Nonce, i11]), { headers: n11 };
              }((null != (a11 = null == (s11 = eF(c2)) ? void 0 : s11.frontendApi) ? a11 : "").replace("$", ""), h2.contentSecurityPolicy), r12 = {};
              t12.forEach(([e13, t13]) => {
                sS(T2, e13, t13), r12[e13] = t13;
              }), ok(T2, f2, r12), e12.debug("Clerk generated CSP", () => ({ headers: t12 }));
            }
            if (y2.headers && y2.headers.forEach((t12, r12) => {
              r12 === rr.Headers.ContentSecurityPolicy && e12.debug("Content-Security-Policy detected", () => ({ value: t12 })), T2.headers.append(r12, t12);
            }), sk(T2)) return e12.debug("handlerResult is redirect"), sx(f2, T2, h2);
            h2.debug && ok(T2, f2, { [rr.Headers.EnableDebug]: "true" });
            let x2 = u2 === (null == l2 ? void 0 : l2.secretKey) ? { publishableKey: null == l2 ? void 0 : l2.publishableKey, secretKey: null == l2 ? void 0 : l2.secretKey } : {};
            return !function(e13, t12, r12, n11, i11, s12) {
              let a12;
              let { reason: o11, message: l3, status: c3, token: u3 } = r12;
              if (t12 || (t12 = K.next()), t12.headers.get(sw.Headers.NextRedirect)) return;
              "1" === t12.headers.get(sw.Headers.NextResume) && (t12.headers.delete(sw.Headers.NextResume), a12 = new URL(e13.url));
              let d3 = t12.headers.get(sw.Headers.NextRewrite);
              if (d3) {
                let t13 = new URL(e13.url);
                if ((a12 = new URL(d3)).origin !== t13.origin) return;
              }
              if (a12) {
                let r13 = function(e14, t13, r14) {
                  var n12;
                  let i12 = (e15) => !e15 || !Object.values(e15).some((e16) => void 0 !== e16);
                  if (i12(e14) && i12(t13) && !r14) return;
                  if (e14.secretKey && !sD) throw Error("Clerk: Missing `CLERK_ENCRYPTION_KEY`. Required for propagating `secretKey` middleware option. See docs: https://clerk.com/docs/references/nextjs/clerk-middleware#dynamic-keys. (code=encryption_key_missing)");
                  let s13 = eP() ? sD || (n12 = () => o_.throwMissingSecretKeyError(), sM || n12(), sM) : sD || sM || ox;
                  return oh.encrypt(JSON.stringify({ ...t13, ...e14, machineAuthObject: null != r14 ? r14 : void 0 }), s13).toString();
                }(n11, i11, s12);
                ok(t12, e13, { [rr.Headers.AuthStatus]: c3, [rr.Headers.AuthToken]: u3 || "", [rr.Headers.AuthSignature]: u3 ? og(u3, (null == n11 ? void 0 : n11.secretKey) || sM || i11.secretKey || "").toString() : "", [rr.Headers.AuthMessage]: l3 || "", [rr.Headers.AuthReason]: o11 || "", [rr.Headers.ClerkUrl]: e13.clerkUrl.toString(), ...r13 ? { [rr.Headers.ClerkRequestData]: r13 } : {} }), t12.headers.set(sw.Headers.NextRewrite, a12.href);
              }
            }(f2, T2, y2, o10, x2, "session_token" === _2.tokenType ? null : iG(_2)), T2;
          }), s10 = async (t11, r11) => {
            var n11, s11;
            if (oQ(t11)) return oZ(t11);
            let a11 = "function" == typeof i10 ? await i10(t11) : i10, o10 = await oN((e12) => {
              var r12;
              return null == (r12 = t11.cookies.get(e12)) ? void 0 : r12.value;
            }), l2 = !(a11.publishableKey || sq || (null == o10 ? void 0 : o10.publishableKey)), c2 = null != (s11 = null == (n11 = at(t11, rr.Headers.Authorization)) ? void 0 : n11.replace("Bearer ", "")) ? s11 : "";
            if (l2 && !r4(c2)) {
              let e12 = K.next();
              return ok(e12, t11, { [rr.Headers.AuthStatus]: "signed-out" }), e12;
            }
            return e11(t11, r11);
          }, a10 = async (t11, r11) => e11(t11, r11);
          return t10 && r10 ? a10(t10, r10) : a10;
        });
      })(async (e10, t10) => {
        o6(t10) || await e10.protect();
      }), o9 = { matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"] }, o7 = { ...d }, le = o7.middleware || o7.default, lt = "/src/middleware";
      if ("function" != typeof le) throw Error(`The Middleware "${lt}" must export a \`middleware\` or a \`default\` function`);
      function lr(e10) {
        return ek({ ...e10, page: lt, handler: le });
      }
    }, 447: (e) => {
      "use strict";
      var t = Object.defineProperty, r = Object.getOwnPropertyDescriptor, n = Object.getOwnPropertyNames, i = Object.prototype.hasOwnProperty, s = {};
      function a(e2) {
        var t2;
        let r2 = ["path" in e2 && e2.path && `Path=${e2.path}`, "expires" in e2 && (e2.expires || 0 === e2.expires) && `Expires=${("number" == typeof e2.expires ? new Date(e2.expires) : e2.expires).toUTCString()}`, "maxAge" in e2 && "number" == typeof e2.maxAge && `Max-Age=${e2.maxAge}`, "domain" in e2 && e2.domain && `Domain=${e2.domain}`, "secure" in e2 && e2.secure && "Secure", "httpOnly" in e2 && e2.httpOnly && "HttpOnly", "sameSite" in e2 && e2.sameSite && `SameSite=${e2.sameSite}`, "partitioned" in e2 && e2.partitioned && "Partitioned", "priority" in e2 && e2.priority && `Priority=${e2.priority}`].filter(Boolean), n2 = `${e2.name}=${encodeURIComponent(null != (t2 = e2.value) ? t2 : "")}`;
        return 0 === r2.length ? n2 : `${n2}; ${r2.join("; ")}`;
      }
      function o(e2) {
        let t2 = /* @__PURE__ */ new Map();
        for (let r2 of e2.split(/; */)) {
          if (!r2) continue;
          let e3 = r2.indexOf("=");
          if (-1 === e3) {
            t2.set(r2, "true");
            continue;
          }
          let [n2, i2] = [r2.slice(0, e3), r2.slice(e3 + 1)];
          try {
            t2.set(n2, decodeURIComponent(null != i2 ? i2 : "true"));
          } catch {
          }
        }
        return t2;
      }
      function l(e2) {
        var t2, r2;
        if (!e2) return;
        let [[n2, i2], ...s2] = o(e2), { domain: a2, expires: l2, httponly: d2, maxage: h2, path: p, samesite: f, secure: g, partitioned: m, priority: y } = Object.fromEntries(s2.map(([e3, t3]) => [e3.toLowerCase(), t3]));
        return function(e3) {
          let t3 = {};
          for (let r3 in e3) e3[r3] && (t3[r3] = e3[r3]);
          return t3;
        }({ name: n2, value: decodeURIComponent(i2), domain: a2, ...l2 && { expires: new Date(l2) }, ...d2 && { httpOnly: true }, ..."string" == typeof h2 && { maxAge: Number(h2) }, path: p, ...f && { sameSite: c.includes(t2 = (t2 = f).toLowerCase()) ? t2 : void 0 }, ...g && { secure: true }, ...y && { priority: u.includes(r2 = (r2 = y).toLowerCase()) ? r2 : void 0 }, ...m && { partitioned: true } });
      }
      ((e2, r2) => {
        for (var n2 in r2) t(e2, n2, { get: r2[n2], enumerable: true });
      })(s, { RequestCookies: () => d, ResponseCookies: () => h, parseCookie: () => o, parseSetCookie: () => l, stringifyCookie: () => a }), e.exports = ((e2, s2, a2, o2) => {
        if (s2 && "object" == typeof s2 || "function" == typeof s2) for (let l2 of n(s2)) i.call(e2, l2) || l2 === a2 || t(e2, l2, { get: () => s2[l2], enumerable: !(o2 = r(s2, l2)) || o2.enumerable });
        return e2;
      })(t({}, "__esModule", { value: true }), s);
      var c = ["strict", "lax", "none"], u = ["low", "medium", "high"], d = class {
        constructor(e2) {
          this._parsed = /* @__PURE__ */ new Map(), this._headers = e2;
          let t2 = e2.get("cookie");
          if (t2) for (let [e3, r2] of o(t2)) this._parsed.set(e3, { name: e3, value: r2 });
        }
        [Symbol.iterator]() {
          return this._parsed[Symbol.iterator]();
        }
        get size() {
          return this._parsed.size;
        }
        get(...e2) {
          let t2 = "string" == typeof e2[0] ? e2[0] : e2[0].name;
          return this._parsed.get(t2);
        }
        getAll(...e2) {
          var t2;
          let r2 = Array.from(this._parsed);
          if (!e2.length) return r2.map(([e3, t3]) => t3);
          let n2 = "string" == typeof e2[0] ? e2[0] : null == (t2 = e2[0]) ? void 0 : t2.name;
          return r2.filter(([e3]) => e3 === n2).map(([e3, t3]) => t3);
        }
        has(e2) {
          return this._parsed.has(e2);
        }
        set(...e2) {
          let [t2, r2] = 1 === e2.length ? [e2[0].name, e2[0].value] : e2, n2 = this._parsed;
          return n2.set(t2, { name: t2, value: r2 }), this._headers.set("cookie", Array.from(n2).map(([e3, t3]) => a(t3)).join("; ")), this;
        }
        delete(e2) {
          let t2 = this._parsed, r2 = Array.isArray(e2) ? e2.map((e3) => t2.delete(e3)) : t2.delete(e2);
          return this._headers.set("cookie", Array.from(t2).map(([e3, t3]) => a(t3)).join("; ")), r2;
        }
        clear() {
          return this.delete(Array.from(this._parsed.keys())), this;
        }
        [Symbol.for("edge-runtime.inspect.custom")]() {
          return `RequestCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`;
        }
        toString() {
          return [...this._parsed.values()].map((e2) => `${e2.name}=${encodeURIComponent(e2.value)}`).join("; ");
        }
      }, h = class {
        constructor(e2) {
          var t2, r2, n2;
          this._parsed = /* @__PURE__ */ new Map(), this._headers = e2;
          let i2 = null != (n2 = null != (r2 = null == (t2 = e2.getSetCookie) ? void 0 : t2.call(e2)) ? r2 : e2.get("set-cookie")) ? n2 : [];
          for (let e3 of Array.isArray(i2) ? i2 : function(e4) {
            if (!e4) return [];
            var t3, r3, n3, i3, s2, a2 = [], o2 = 0;
            function l2() {
              for (; o2 < e4.length && /\s/.test(e4.charAt(o2)); ) o2 += 1;
              return o2 < e4.length;
            }
            for (; o2 < e4.length; ) {
              for (t3 = o2, s2 = false; l2(); ) if ("," === (r3 = e4.charAt(o2))) {
                for (n3 = o2, o2 += 1, l2(), i3 = o2; o2 < e4.length && "=" !== (r3 = e4.charAt(o2)) && ";" !== r3 && "," !== r3; ) o2 += 1;
                o2 < e4.length && "=" === e4.charAt(o2) ? (s2 = true, o2 = i3, a2.push(e4.substring(t3, n3)), t3 = o2) : o2 = n3 + 1;
              } else o2 += 1;
              (!s2 || o2 >= e4.length) && a2.push(e4.substring(t3, e4.length));
            }
            return a2;
          }(i2)) {
            let t3 = l(e3);
            t3 && this._parsed.set(t3.name, t3);
          }
        }
        get(...e2) {
          let t2 = "string" == typeof e2[0] ? e2[0] : e2[0].name;
          return this._parsed.get(t2);
        }
        getAll(...e2) {
          var t2;
          let r2 = Array.from(this._parsed.values());
          if (!e2.length) return r2;
          let n2 = "string" == typeof e2[0] ? e2[0] : null == (t2 = e2[0]) ? void 0 : t2.name;
          return r2.filter((e3) => e3.name === n2);
        }
        has(e2) {
          return this._parsed.has(e2);
        }
        set(...e2) {
          let [t2, r2, n2] = 1 === e2.length ? [e2[0].name, e2[0].value, e2[0]] : e2, i2 = this._parsed;
          return i2.set(t2, function(e3 = { name: "", value: "" }) {
            return "number" == typeof e3.expires && (e3.expires = new Date(e3.expires)), e3.maxAge && (e3.expires = new Date(Date.now() + 1e3 * e3.maxAge)), (null === e3.path || void 0 === e3.path) && (e3.path = "/"), e3;
          }({ name: t2, value: r2, ...n2 })), function(e3, t3) {
            for (let [, r3] of (t3.delete("set-cookie"), e3)) {
              let e4 = a(r3);
              t3.append("set-cookie", e4);
            }
          }(i2, this._headers), this;
        }
        delete(...e2) {
          let [t2, r2, n2] = "string" == typeof e2[0] ? [e2[0]] : [e2[0].name, e2[0].path, e2[0].domain];
          return this.set({ name: t2, path: r2, domain: n2, value: "", expires: /* @__PURE__ */ new Date(0) });
        }
        [Symbol.for("edge-runtime.inspect.custom")]() {
          return `ResponseCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`;
        }
        toString() {
          return [...this._parsed.values()].map(a).join("; ");
        }
      };
    }, 692: (e, t, r) => {
      (() => {
        "use strict";
        var t2 = { 491: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.ContextAPI = void 0;
          let n2 = r2(223), i2 = r2(172), s2 = r2(930), a = "context", o = new n2.NoopContextManager();
          class l {
            constructor() {
            }
            static getInstance() {
              return this._instance || (this._instance = new l()), this._instance;
            }
            setGlobalContextManager(e3) {
              return (0, i2.registerGlobal)(a, e3, s2.DiagAPI.instance());
            }
            active() {
              return this._getContextManager().active();
            }
            with(e3, t4, r3, ...n3) {
              return this._getContextManager().with(e3, t4, r3, ...n3);
            }
            bind(e3, t4) {
              return this._getContextManager().bind(e3, t4);
            }
            _getContextManager() {
              return (0, i2.getGlobal)(a) || o;
            }
            disable() {
              this._getContextManager().disable(), (0, i2.unregisterGlobal)(a, s2.DiagAPI.instance());
            }
          }
          t3.ContextAPI = l;
        }, 930: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.DiagAPI = void 0;
          let n2 = r2(56), i2 = r2(912), s2 = r2(957), a = r2(172);
          class o {
            constructor() {
              function e3(e4) {
                return function(...t5) {
                  let r3 = (0, a.getGlobal)("diag");
                  if (r3) return r3[e4](...t5);
                };
              }
              let t4 = this;
              t4.setLogger = (e4, r3 = { logLevel: s2.DiagLogLevel.INFO }) => {
                var n3, o2, l;
                if (e4 === t4) {
                  let e5 = Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
                  return t4.error(null !== (n3 = e5.stack) && void 0 !== n3 ? n3 : e5.message), false;
                }
                "number" == typeof r3 && (r3 = { logLevel: r3 });
                let c = (0, a.getGlobal)("diag"), u = (0, i2.createLogLevelDiagLogger)(null !== (o2 = r3.logLevel) && void 0 !== o2 ? o2 : s2.DiagLogLevel.INFO, e4);
                if (c && !r3.suppressOverrideMessage) {
                  let e5 = null !== (l = Error().stack) && void 0 !== l ? l : "<failed to generate stacktrace>";
                  c.warn(`Current logger will be overwritten from ${e5}`), u.warn(`Current logger will overwrite one already registered from ${e5}`);
                }
                return (0, a.registerGlobal)("diag", u, t4, true);
              }, t4.disable = () => {
                (0, a.unregisterGlobal)("diag", t4);
              }, t4.createComponentLogger = (e4) => new n2.DiagComponentLogger(e4), t4.verbose = e3("verbose"), t4.debug = e3("debug"), t4.info = e3("info"), t4.warn = e3("warn"), t4.error = e3("error");
            }
            static instance() {
              return this._instance || (this._instance = new o()), this._instance;
            }
          }
          t3.DiagAPI = o;
        }, 653: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.MetricsAPI = void 0;
          let n2 = r2(660), i2 = r2(172), s2 = r2(930), a = "metrics";
          class o {
            constructor() {
            }
            static getInstance() {
              return this._instance || (this._instance = new o()), this._instance;
            }
            setGlobalMeterProvider(e3) {
              return (0, i2.registerGlobal)(a, e3, s2.DiagAPI.instance());
            }
            getMeterProvider() {
              return (0, i2.getGlobal)(a) || n2.NOOP_METER_PROVIDER;
            }
            getMeter(e3, t4, r3) {
              return this.getMeterProvider().getMeter(e3, t4, r3);
            }
            disable() {
              (0, i2.unregisterGlobal)(a, s2.DiagAPI.instance());
            }
          }
          t3.MetricsAPI = o;
        }, 181: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.PropagationAPI = void 0;
          let n2 = r2(172), i2 = r2(874), s2 = r2(194), a = r2(277), o = r2(369), l = r2(930), c = "propagation", u = new i2.NoopTextMapPropagator();
          class d {
            constructor() {
              this.createBaggage = o.createBaggage, this.getBaggage = a.getBaggage, this.getActiveBaggage = a.getActiveBaggage, this.setBaggage = a.setBaggage, this.deleteBaggage = a.deleteBaggage;
            }
            static getInstance() {
              return this._instance || (this._instance = new d()), this._instance;
            }
            setGlobalPropagator(e3) {
              return (0, n2.registerGlobal)(c, e3, l.DiagAPI.instance());
            }
            inject(e3, t4, r3 = s2.defaultTextMapSetter) {
              return this._getGlobalPropagator().inject(e3, t4, r3);
            }
            extract(e3, t4, r3 = s2.defaultTextMapGetter) {
              return this._getGlobalPropagator().extract(e3, t4, r3);
            }
            fields() {
              return this._getGlobalPropagator().fields();
            }
            disable() {
              (0, n2.unregisterGlobal)(c, l.DiagAPI.instance());
            }
            _getGlobalPropagator() {
              return (0, n2.getGlobal)(c) || u;
            }
          }
          t3.PropagationAPI = d;
        }, 997: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.TraceAPI = void 0;
          let n2 = r2(172), i2 = r2(846), s2 = r2(139), a = r2(607), o = r2(930), l = "trace";
          class c {
            constructor() {
              this._proxyTracerProvider = new i2.ProxyTracerProvider(), this.wrapSpanContext = s2.wrapSpanContext, this.isSpanContextValid = s2.isSpanContextValid, this.deleteSpan = a.deleteSpan, this.getSpan = a.getSpan, this.getActiveSpan = a.getActiveSpan, this.getSpanContext = a.getSpanContext, this.setSpan = a.setSpan, this.setSpanContext = a.setSpanContext;
            }
            static getInstance() {
              return this._instance || (this._instance = new c()), this._instance;
            }
            setGlobalTracerProvider(e3) {
              let t4 = (0, n2.registerGlobal)(l, this._proxyTracerProvider, o.DiagAPI.instance());
              return t4 && this._proxyTracerProvider.setDelegate(e3), t4;
            }
            getTracerProvider() {
              return (0, n2.getGlobal)(l) || this._proxyTracerProvider;
            }
            getTracer(e3, t4) {
              return this.getTracerProvider().getTracer(e3, t4);
            }
            disable() {
              (0, n2.unregisterGlobal)(l, o.DiagAPI.instance()), this._proxyTracerProvider = new i2.ProxyTracerProvider();
            }
          }
          t3.TraceAPI = c;
        }, 277: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.deleteBaggage = t3.setBaggage = t3.getActiveBaggage = t3.getBaggage = void 0;
          let n2 = r2(491), i2 = (0, r2(780).createContextKey)("OpenTelemetry Baggage Key");
          function s2(e3) {
            return e3.getValue(i2) || void 0;
          }
          t3.getBaggage = s2, t3.getActiveBaggage = function() {
            return s2(n2.ContextAPI.getInstance().active());
          }, t3.setBaggage = function(e3, t4) {
            return e3.setValue(i2, t4);
          }, t3.deleteBaggage = function(e3) {
            return e3.deleteValue(i2);
          };
        }, 993: (e2, t3) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.BaggageImpl = void 0;
          class r2 {
            constructor(e3) {
              this._entries = e3 ? new Map(e3) : /* @__PURE__ */ new Map();
            }
            getEntry(e3) {
              let t4 = this._entries.get(e3);
              if (t4) return Object.assign({}, t4);
            }
            getAllEntries() {
              return Array.from(this._entries.entries()).map(([e3, t4]) => [e3, t4]);
            }
            setEntry(e3, t4) {
              let n2 = new r2(this._entries);
              return n2._entries.set(e3, t4), n2;
            }
            removeEntry(e3) {
              let t4 = new r2(this._entries);
              return t4._entries.delete(e3), t4;
            }
            removeEntries(...e3) {
              let t4 = new r2(this._entries);
              for (let r3 of e3) t4._entries.delete(r3);
              return t4;
            }
            clear() {
              return new r2();
            }
          }
          t3.BaggageImpl = r2;
        }, 830: (e2, t3) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.baggageEntryMetadataSymbol = void 0, t3.baggageEntryMetadataSymbol = Symbol("BaggageEntryMetadata");
        }, 369: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.baggageEntryMetadataFromString = t3.createBaggage = void 0;
          let n2 = r2(930), i2 = r2(993), s2 = r2(830), a = n2.DiagAPI.instance();
          t3.createBaggage = function(e3 = {}) {
            return new i2.BaggageImpl(new Map(Object.entries(e3)));
          }, t3.baggageEntryMetadataFromString = function(e3) {
            return "string" != typeof e3 && (a.error(`Cannot create baggage metadata from unknown type: ${typeof e3}`), e3 = ""), { __TYPE__: s2.baggageEntryMetadataSymbol, toString: () => e3 };
          };
        }, 67: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.context = void 0;
          let n2 = r2(491);
          t3.context = n2.ContextAPI.getInstance();
        }, 223: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.NoopContextManager = void 0;
          let n2 = r2(780);
          class i2 {
            active() {
              return n2.ROOT_CONTEXT;
            }
            with(e3, t4, r3, ...n3) {
              return t4.call(r3, ...n3);
            }
            bind(e3, t4) {
              return t4;
            }
            enable() {
              return this;
            }
            disable() {
              return this;
            }
          }
          t3.NoopContextManager = i2;
        }, 780: (e2, t3) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.ROOT_CONTEXT = t3.createContextKey = void 0, t3.createContextKey = function(e3) {
            return Symbol.for(e3);
          };
          class r2 {
            constructor(e3) {
              let t4 = this;
              t4._currentContext = e3 ? new Map(e3) : /* @__PURE__ */ new Map(), t4.getValue = (e4) => t4._currentContext.get(e4), t4.setValue = (e4, n2) => {
                let i2 = new r2(t4._currentContext);
                return i2._currentContext.set(e4, n2), i2;
              }, t4.deleteValue = (e4) => {
                let n2 = new r2(t4._currentContext);
                return n2._currentContext.delete(e4), n2;
              };
            }
          }
          t3.ROOT_CONTEXT = new r2();
        }, 506: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.diag = void 0;
          let n2 = r2(930);
          t3.diag = n2.DiagAPI.instance();
        }, 56: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.DiagComponentLogger = void 0;
          let n2 = r2(172);
          class i2 {
            constructor(e3) {
              this._namespace = e3.namespace || "DiagComponentLogger";
            }
            debug(...e3) {
              return s2("debug", this._namespace, e3);
            }
            error(...e3) {
              return s2("error", this._namespace, e3);
            }
            info(...e3) {
              return s2("info", this._namespace, e3);
            }
            warn(...e3) {
              return s2("warn", this._namespace, e3);
            }
            verbose(...e3) {
              return s2("verbose", this._namespace, e3);
            }
          }
          function s2(e3, t4, r3) {
            let i3 = (0, n2.getGlobal)("diag");
            if (i3) return r3.unshift(t4), i3[e3](...r3);
          }
          t3.DiagComponentLogger = i2;
        }, 972: (e2, t3) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.DiagConsoleLogger = void 0;
          let r2 = [{ n: "error", c: "error" }, { n: "warn", c: "warn" }, { n: "info", c: "info" }, { n: "debug", c: "debug" }, { n: "verbose", c: "trace" }];
          class n2 {
            constructor() {
              for (let e3 = 0; e3 < r2.length; e3++) this[r2[e3].n] = /* @__PURE__ */ function(e4) {
                return function(...t4) {
                  if (console) {
                    let r3 = console[e4];
                    if ("function" != typeof r3 && (r3 = console.log), "function" == typeof r3) return r3.apply(console, t4);
                  }
                };
              }(r2[e3].c);
            }
          }
          t3.DiagConsoleLogger = n2;
        }, 912: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.createLogLevelDiagLogger = void 0;
          let n2 = r2(957);
          t3.createLogLevelDiagLogger = function(e3, t4) {
            function r3(r4, n3) {
              let i2 = t4[r4];
              return "function" == typeof i2 && e3 >= n3 ? i2.bind(t4) : function() {
              };
            }
            return e3 < n2.DiagLogLevel.NONE ? e3 = n2.DiagLogLevel.NONE : e3 > n2.DiagLogLevel.ALL && (e3 = n2.DiagLogLevel.ALL), t4 = t4 || {}, { error: r3("error", n2.DiagLogLevel.ERROR), warn: r3("warn", n2.DiagLogLevel.WARN), info: r3("info", n2.DiagLogLevel.INFO), debug: r3("debug", n2.DiagLogLevel.DEBUG), verbose: r3("verbose", n2.DiagLogLevel.VERBOSE) };
          };
        }, 957: (e2, t3) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.DiagLogLevel = void 0, function(e3) {
            e3[e3.NONE = 0] = "NONE", e3[e3.ERROR = 30] = "ERROR", e3[e3.WARN = 50] = "WARN", e3[e3.INFO = 60] = "INFO", e3[e3.DEBUG = 70] = "DEBUG", e3[e3.VERBOSE = 80] = "VERBOSE", e3[e3.ALL = 9999] = "ALL";
          }(t3.DiagLogLevel || (t3.DiagLogLevel = {}));
        }, 172: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.unregisterGlobal = t3.getGlobal = t3.registerGlobal = void 0;
          let n2 = r2(200), i2 = r2(521), s2 = r2(130), a = i2.VERSION.split(".")[0], o = Symbol.for(`opentelemetry.js.api.${a}`), l = n2._globalThis;
          t3.registerGlobal = function(e3, t4, r3, n3 = false) {
            var s3;
            let a2 = l[o] = null !== (s3 = l[o]) && void 0 !== s3 ? s3 : { version: i2.VERSION };
            if (!n3 && a2[e3]) {
              let t5 = Error(`@opentelemetry/api: Attempted duplicate registration of API: ${e3}`);
              return r3.error(t5.stack || t5.message), false;
            }
            if (a2.version !== i2.VERSION) {
              let t5 = Error(`@opentelemetry/api: Registration of version v${a2.version} for ${e3} does not match previously registered API v${i2.VERSION}`);
              return r3.error(t5.stack || t5.message), false;
            }
            return a2[e3] = t4, r3.debug(`@opentelemetry/api: Registered a global for ${e3} v${i2.VERSION}.`), true;
          }, t3.getGlobal = function(e3) {
            var t4, r3;
            let n3 = null === (t4 = l[o]) || void 0 === t4 ? void 0 : t4.version;
            if (n3 && (0, s2.isCompatible)(n3)) return null === (r3 = l[o]) || void 0 === r3 ? void 0 : r3[e3];
          }, t3.unregisterGlobal = function(e3, t4) {
            t4.debug(`@opentelemetry/api: Unregistering a global for ${e3} v${i2.VERSION}.`);
            let r3 = l[o];
            r3 && delete r3[e3];
          };
        }, 130: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.isCompatible = t3._makeCompatibilityCheck = void 0;
          let n2 = r2(521), i2 = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
          function s2(e3) {
            let t4 = /* @__PURE__ */ new Set([e3]), r3 = /* @__PURE__ */ new Set(), n3 = e3.match(i2);
            if (!n3) return () => false;
            let s3 = { major: +n3[1], minor: +n3[2], patch: +n3[3], prerelease: n3[4] };
            if (null != s3.prerelease) return function(t5) {
              return t5 === e3;
            };
            function a(e4) {
              return r3.add(e4), false;
            }
            return function(e4) {
              if (t4.has(e4)) return true;
              if (r3.has(e4)) return false;
              let n4 = e4.match(i2);
              if (!n4) return a(e4);
              let o = { major: +n4[1], minor: +n4[2], patch: +n4[3], prerelease: n4[4] };
              return null != o.prerelease || s3.major !== o.major ? a(e4) : 0 === s3.major ? s3.minor === o.minor && s3.patch <= o.patch ? (t4.add(e4), true) : a(e4) : s3.minor <= o.minor ? (t4.add(e4), true) : a(e4);
            };
          }
          t3._makeCompatibilityCheck = s2, t3.isCompatible = s2(n2.VERSION);
        }, 886: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.metrics = void 0;
          let n2 = r2(653);
          t3.metrics = n2.MetricsAPI.getInstance();
        }, 901: (e2, t3) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.ValueType = void 0, function(e3) {
            e3[e3.INT = 0] = "INT", e3[e3.DOUBLE = 1] = "DOUBLE";
          }(t3.ValueType || (t3.ValueType = {}));
        }, 102: (e2, t3) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.createNoopMeter = t3.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = t3.NOOP_OBSERVABLE_GAUGE_METRIC = t3.NOOP_OBSERVABLE_COUNTER_METRIC = t3.NOOP_UP_DOWN_COUNTER_METRIC = t3.NOOP_HISTOGRAM_METRIC = t3.NOOP_COUNTER_METRIC = t3.NOOP_METER = t3.NoopObservableUpDownCounterMetric = t3.NoopObservableGaugeMetric = t3.NoopObservableCounterMetric = t3.NoopObservableMetric = t3.NoopHistogramMetric = t3.NoopUpDownCounterMetric = t3.NoopCounterMetric = t3.NoopMetric = t3.NoopMeter = void 0;
          class r2 {
            constructor() {
            }
            createHistogram(e3, r3) {
              return t3.NOOP_HISTOGRAM_METRIC;
            }
            createCounter(e3, r3) {
              return t3.NOOP_COUNTER_METRIC;
            }
            createUpDownCounter(e3, r3) {
              return t3.NOOP_UP_DOWN_COUNTER_METRIC;
            }
            createObservableGauge(e3, r3) {
              return t3.NOOP_OBSERVABLE_GAUGE_METRIC;
            }
            createObservableCounter(e3, r3) {
              return t3.NOOP_OBSERVABLE_COUNTER_METRIC;
            }
            createObservableUpDownCounter(e3, r3) {
              return t3.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
            }
            addBatchObservableCallback(e3, t4) {
            }
            removeBatchObservableCallback(e3) {
            }
          }
          t3.NoopMeter = r2;
          class n2 {
          }
          t3.NoopMetric = n2;
          class i2 extends n2 {
            add(e3, t4) {
            }
          }
          t3.NoopCounterMetric = i2;
          class s2 extends n2 {
            add(e3, t4) {
            }
          }
          t3.NoopUpDownCounterMetric = s2;
          class a extends n2 {
            record(e3, t4) {
            }
          }
          t3.NoopHistogramMetric = a;
          class o {
            addCallback(e3) {
            }
            removeCallback(e3) {
            }
          }
          t3.NoopObservableMetric = o;
          class l extends o {
          }
          t3.NoopObservableCounterMetric = l;
          class c extends o {
          }
          t3.NoopObservableGaugeMetric = c;
          class u extends o {
          }
          t3.NoopObservableUpDownCounterMetric = u, t3.NOOP_METER = new r2(), t3.NOOP_COUNTER_METRIC = new i2(), t3.NOOP_HISTOGRAM_METRIC = new a(), t3.NOOP_UP_DOWN_COUNTER_METRIC = new s2(), t3.NOOP_OBSERVABLE_COUNTER_METRIC = new l(), t3.NOOP_OBSERVABLE_GAUGE_METRIC = new c(), t3.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = new u(), t3.createNoopMeter = function() {
            return t3.NOOP_METER;
          };
        }, 660: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.NOOP_METER_PROVIDER = t3.NoopMeterProvider = void 0;
          let n2 = r2(102);
          class i2 {
            getMeter(e3, t4, r3) {
              return n2.NOOP_METER;
            }
          }
          t3.NoopMeterProvider = i2, t3.NOOP_METER_PROVIDER = new i2();
        }, 200: function(e2, t3, r2) {
          var n2 = this && this.__createBinding || (Object.create ? function(e3, t4, r3, n3) {
            void 0 === n3 && (n3 = r3), Object.defineProperty(e3, n3, { enumerable: true, get: function() {
              return t4[r3];
            } });
          } : function(e3, t4, r3, n3) {
            void 0 === n3 && (n3 = r3), e3[n3] = t4[r3];
          }), i2 = this && this.__exportStar || function(e3, t4) {
            for (var r3 in e3) "default" === r3 || Object.prototype.hasOwnProperty.call(t4, r3) || n2(t4, e3, r3);
          };
          Object.defineProperty(t3, "__esModule", { value: true }), i2(r2(46), t3);
        }, 651: (e2, t3) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3._globalThis = void 0, t3._globalThis = "object" == typeof globalThis ? globalThis : r.g;
        }, 46: function(e2, t3, r2) {
          var n2 = this && this.__createBinding || (Object.create ? function(e3, t4, r3, n3) {
            void 0 === n3 && (n3 = r3), Object.defineProperty(e3, n3, { enumerable: true, get: function() {
              return t4[r3];
            } });
          } : function(e3, t4, r3, n3) {
            void 0 === n3 && (n3 = r3), e3[n3] = t4[r3];
          }), i2 = this && this.__exportStar || function(e3, t4) {
            for (var r3 in e3) "default" === r3 || Object.prototype.hasOwnProperty.call(t4, r3) || n2(t4, e3, r3);
          };
          Object.defineProperty(t3, "__esModule", { value: true }), i2(r2(651), t3);
        }, 939: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.propagation = void 0;
          let n2 = r2(181);
          t3.propagation = n2.PropagationAPI.getInstance();
        }, 874: (e2, t3) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.NoopTextMapPropagator = void 0;
          class r2 {
            inject(e3, t4) {
            }
            extract(e3, t4) {
              return e3;
            }
            fields() {
              return [];
            }
          }
          t3.NoopTextMapPropagator = r2;
        }, 194: (e2, t3) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.defaultTextMapSetter = t3.defaultTextMapGetter = void 0, t3.defaultTextMapGetter = { get(e3, t4) {
            if (null != e3) return e3[t4];
          }, keys: (e3) => null == e3 ? [] : Object.keys(e3) }, t3.defaultTextMapSetter = { set(e3, t4, r2) {
            null != e3 && (e3[t4] = r2);
          } };
        }, 845: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.trace = void 0;
          let n2 = r2(997);
          t3.trace = n2.TraceAPI.getInstance();
        }, 403: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.NonRecordingSpan = void 0;
          let n2 = r2(476);
          class i2 {
            constructor(e3 = n2.INVALID_SPAN_CONTEXT) {
              this._spanContext = e3;
            }
            spanContext() {
              return this._spanContext;
            }
            setAttribute(e3, t4) {
              return this;
            }
            setAttributes(e3) {
              return this;
            }
            addEvent(e3, t4) {
              return this;
            }
            setStatus(e3) {
              return this;
            }
            updateName(e3) {
              return this;
            }
            end(e3) {
            }
            isRecording() {
              return false;
            }
            recordException(e3, t4) {
            }
          }
          t3.NonRecordingSpan = i2;
        }, 614: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.NoopTracer = void 0;
          let n2 = r2(491), i2 = r2(607), s2 = r2(403), a = r2(139), o = n2.ContextAPI.getInstance();
          class l {
            startSpan(e3, t4, r3 = o.active()) {
              if (null == t4 ? void 0 : t4.root) return new s2.NonRecordingSpan();
              let n3 = r3 && (0, i2.getSpanContext)(r3);
              return "object" == typeof n3 && "string" == typeof n3.spanId && "string" == typeof n3.traceId && "number" == typeof n3.traceFlags && (0, a.isSpanContextValid)(n3) ? new s2.NonRecordingSpan(n3) : new s2.NonRecordingSpan();
            }
            startActiveSpan(e3, t4, r3, n3) {
              let s3, a2, l2;
              if (arguments.length < 2) return;
              2 == arguments.length ? l2 = t4 : 3 == arguments.length ? (s3 = t4, l2 = r3) : (s3 = t4, a2 = r3, l2 = n3);
              let c = null != a2 ? a2 : o.active(), u = this.startSpan(e3, s3, c), d = (0, i2.setSpan)(c, u);
              return o.with(d, l2, void 0, u);
            }
          }
          t3.NoopTracer = l;
        }, 124: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.NoopTracerProvider = void 0;
          let n2 = r2(614);
          class i2 {
            getTracer(e3, t4, r3) {
              return new n2.NoopTracer();
            }
          }
          t3.NoopTracerProvider = i2;
        }, 125: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.ProxyTracer = void 0;
          let n2 = new (r2(614)).NoopTracer();
          class i2 {
            constructor(e3, t4, r3, n3) {
              this._provider = e3, this.name = t4, this.version = r3, this.options = n3;
            }
            startSpan(e3, t4, r3) {
              return this._getTracer().startSpan(e3, t4, r3);
            }
            startActiveSpan(e3, t4, r3, n3) {
              let i3 = this._getTracer();
              return Reflect.apply(i3.startActiveSpan, i3, arguments);
            }
            _getTracer() {
              if (this._delegate) return this._delegate;
              let e3 = this._provider.getDelegateTracer(this.name, this.version, this.options);
              return e3 ? (this._delegate = e3, this._delegate) : n2;
            }
          }
          t3.ProxyTracer = i2;
        }, 846: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.ProxyTracerProvider = void 0;
          let n2 = r2(125), i2 = new (r2(124)).NoopTracerProvider();
          class s2 {
            getTracer(e3, t4, r3) {
              var i3;
              return null !== (i3 = this.getDelegateTracer(e3, t4, r3)) && void 0 !== i3 ? i3 : new n2.ProxyTracer(this, e3, t4, r3);
            }
            getDelegate() {
              var e3;
              return null !== (e3 = this._delegate) && void 0 !== e3 ? e3 : i2;
            }
            setDelegate(e3) {
              this._delegate = e3;
            }
            getDelegateTracer(e3, t4, r3) {
              var n3;
              return null === (n3 = this._delegate) || void 0 === n3 ? void 0 : n3.getTracer(e3, t4, r3);
            }
          }
          t3.ProxyTracerProvider = s2;
        }, 996: (e2, t3) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.SamplingDecision = void 0, function(e3) {
            e3[e3.NOT_RECORD = 0] = "NOT_RECORD", e3[e3.RECORD = 1] = "RECORD", e3[e3.RECORD_AND_SAMPLED = 2] = "RECORD_AND_SAMPLED";
          }(t3.SamplingDecision || (t3.SamplingDecision = {}));
        }, 607: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.getSpanContext = t3.setSpanContext = t3.deleteSpan = t3.setSpan = t3.getActiveSpan = t3.getSpan = void 0;
          let n2 = r2(780), i2 = r2(403), s2 = r2(491), a = (0, n2.createContextKey)("OpenTelemetry Context Key SPAN");
          function o(e3) {
            return e3.getValue(a) || void 0;
          }
          function l(e3, t4) {
            return e3.setValue(a, t4);
          }
          t3.getSpan = o, t3.getActiveSpan = function() {
            return o(s2.ContextAPI.getInstance().active());
          }, t3.setSpan = l, t3.deleteSpan = function(e3) {
            return e3.deleteValue(a);
          }, t3.setSpanContext = function(e3, t4) {
            return l(e3, new i2.NonRecordingSpan(t4));
          }, t3.getSpanContext = function(e3) {
            var t4;
            return null === (t4 = o(e3)) || void 0 === t4 ? void 0 : t4.spanContext();
          };
        }, 325: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.TraceStateImpl = void 0;
          let n2 = r2(564);
          class i2 {
            constructor(e3) {
              this._internalState = /* @__PURE__ */ new Map(), e3 && this._parse(e3);
            }
            set(e3, t4) {
              let r3 = this._clone();
              return r3._internalState.has(e3) && r3._internalState.delete(e3), r3._internalState.set(e3, t4), r3;
            }
            unset(e3) {
              let t4 = this._clone();
              return t4._internalState.delete(e3), t4;
            }
            get(e3) {
              return this._internalState.get(e3);
            }
            serialize() {
              return this._keys().reduce((e3, t4) => (e3.push(t4 + "=" + this.get(t4)), e3), []).join(",");
            }
            _parse(e3) {
              !(e3.length > 512) && (this._internalState = e3.split(",").reverse().reduce((e4, t4) => {
                let r3 = t4.trim(), i3 = r3.indexOf("=");
                if (-1 !== i3) {
                  let s2 = r3.slice(0, i3), a = r3.slice(i3 + 1, t4.length);
                  (0, n2.validateKey)(s2) && (0, n2.validateValue)(a) && e4.set(s2, a);
                }
                return e4;
              }, /* @__PURE__ */ new Map()), this._internalState.size > 32 && (this._internalState = new Map(Array.from(this._internalState.entries()).reverse().slice(0, 32))));
            }
            _keys() {
              return Array.from(this._internalState.keys()).reverse();
            }
            _clone() {
              let e3 = new i2();
              return e3._internalState = new Map(this._internalState), e3;
            }
          }
          t3.TraceStateImpl = i2;
        }, 564: (e2, t3) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.validateValue = t3.validateKey = void 0;
          let r2 = "[_0-9a-z-*/]", n2 = `[a-z]${r2}{0,255}`, i2 = `[a-z0-9]${r2}{0,240}@[a-z]${r2}{0,13}`, s2 = RegExp(`^(?:${n2}|${i2})$`), a = /^[ -~]{0,255}[!-~]$/, o = /,|=/;
          t3.validateKey = function(e3) {
            return s2.test(e3);
          }, t3.validateValue = function(e3) {
            return a.test(e3) && !o.test(e3);
          };
        }, 98: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.createTraceState = void 0;
          let n2 = r2(325);
          t3.createTraceState = function(e3) {
            return new n2.TraceStateImpl(e3);
          };
        }, 476: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.INVALID_SPAN_CONTEXT = t3.INVALID_TRACEID = t3.INVALID_SPANID = void 0;
          let n2 = r2(475);
          t3.INVALID_SPANID = "0000000000000000", t3.INVALID_TRACEID = "00000000000000000000000000000000", t3.INVALID_SPAN_CONTEXT = { traceId: t3.INVALID_TRACEID, spanId: t3.INVALID_SPANID, traceFlags: n2.TraceFlags.NONE };
        }, 357: (e2, t3) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.SpanKind = void 0, function(e3) {
            e3[e3.INTERNAL = 0] = "INTERNAL", e3[e3.SERVER = 1] = "SERVER", e3[e3.CLIENT = 2] = "CLIENT", e3[e3.PRODUCER = 3] = "PRODUCER", e3[e3.CONSUMER = 4] = "CONSUMER";
          }(t3.SpanKind || (t3.SpanKind = {}));
        }, 139: (e2, t3, r2) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.wrapSpanContext = t3.isSpanContextValid = t3.isValidSpanId = t3.isValidTraceId = void 0;
          let n2 = r2(476), i2 = r2(403), s2 = /^([0-9a-f]{32})$/i, a = /^[0-9a-f]{16}$/i;
          function o(e3) {
            return s2.test(e3) && e3 !== n2.INVALID_TRACEID;
          }
          function l(e3) {
            return a.test(e3) && e3 !== n2.INVALID_SPANID;
          }
          t3.isValidTraceId = o, t3.isValidSpanId = l, t3.isSpanContextValid = function(e3) {
            return o(e3.traceId) && l(e3.spanId);
          }, t3.wrapSpanContext = function(e3) {
            return new i2.NonRecordingSpan(e3);
          };
        }, 847: (e2, t3) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.SpanStatusCode = void 0, function(e3) {
            e3[e3.UNSET = 0] = "UNSET", e3[e3.OK = 1] = "OK", e3[e3.ERROR = 2] = "ERROR";
          }(t3.SpanStatusCode || (t3.SpanStatusCode = {}));
        }, 475: (e2, t3) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.TraceFlags = void 0, function(e3) {
            e3[e3.NONE = 0] = "NONE", e3[e3.SAMPLED = 1] = "SAMPLED";
          }(t3.TraceFlags || (t3.TraceFlags = {}));
        }, 521: (e2, t3) => {
          Object.defineProperty(t3, "__esModule", { value: true }), t3.VERSION = void 0, t3.VERSION = "1.6.0";
        } }, n = {};
        function i(e2) {
          var r2 = n[e2];
          if (void 0 !== r2) return r2.exports;
          var s2 = n[e2] = { exports: {} }, a = true;
          try {
            t2[e2].call(s2.exports, s2, s2.exports, i), a = false;
          } finally {
            a && delete n[e2];
          }
          return s2.exports;
        }
        i.ab = "//";
        var s = {};
        (() => {
          Object.defineProperty(s, "__esModule", { value: true }), s.trace = s.propagation = s.metrics = s.diag = s.context = s.INVALID_SPAN_CONTEXT = s.INVALID_TRACEID = s.INVALID_SPANID = s.isValidSpanId = s.isValidTraceId = s.isSpanContextValid = s.createTraceState = s.TraceFlags = s.SpanStatusCode = s.SpanKind = s.SamplingDecision = s.ProxyTracerProvider = s.ProxyTracer = s.defaultTextMapSetter = s.defaultTextMapGetter = s.ValueType = s.createNoopMeter = s.DiagLogLevel = s.DiagConsoleLogger = s.ROOT_CONTEXT = s.createContextKey = s.baggageEntryMetadataFromString = void 0;
          var e2 = i(369);
          Object.defineProperty(s, "baggageEntryMetadataFromString", { enumerable: true, get: function() {
            return e2.baggageEntryMetadataFromString;
          } });
          var t3 = i(780);
          Object.defineProperty(s, "createContextKey", { enumerable: true, get: function() {
            return t3.createContextKey;
          } }), Object.defineProperty(s, "ROOT_CONTEXT", { enumerable: true, get: function() {
            return t3.ROOT_CONTEXT;
          } });
          var r2 = i(972);
          Object.defineProperty(s, "DiagConsoleLogger", { enumerable: true, get: function() {
            return r2.DiagConsoleLogger;
          } });
          var n2 = i(957);
          Object.defineProperty(s, "DiagLogLevel", { enumerable: true, get: function() {
            return n2.DiagLogLevel;
          } });
          var a = i(102);
          Object.defineProperty(s, "createNoopMeter", { enumerable: true, get: function() {
            return a.createNoopMeter;
          } });
          var o = i(901);
          Object.defineProperty(s, "ValueType", { enumerable: true, get: function() {
            return o.ValueType;
          } });
          var l = i(194);
          Object.defineProperty(s, "defaultTextMapGetter", { enumerable: true, get: function() {
            return l.defaultTextMapGetter;
          } }), Object.defineProperty(s, "defaultTextMapSetter", { enumerable: true, get: function() {
            return l.defaultTextMapSetter;
          } });
          var c = i(125);
          Object.defineProperty(s, "ProxyTracer", { enumerable: true, get: function() {
            return c.ProxyTracer;
          } });
          var u = i(846);
          Object.defineProperty(s, "ProxyTracerProvider", { enumerable: true, get: function() {
            return u.ProxyTracerProvider;
          } });
          var d = i(996);
          Object.defineProperty(s, "SamplingDecision", { enumerable: true, get: function() {
            return d.SamplingDecision;
          } });
          var h = i(357);
          Object.defineProperty(s, "SpanKind", { enumerable: true, get: function() {
            return h.SpanKind;
          } });
          var p = i(847);
          Object.defineProperty(s, "SpanStatusCode", { enumerable: true, get: function() {
            return p.SpanStatusCode;
          } });
          var f = i(475);
          Object.defineProperty(s, "TraceFlags", { enumerable: true, get: function() {
            return f.TraceFlags;
          } });
          var g = i(98);
          Object.defineProperty(s, "createTraceState", { enumerable: true, get: function() {
            return g.createTraceState;
          } });
          var m = i(139);
          Object.defineProperty(s, "isSpanContextValid", { enumerable: true, get: function() {
            return m.isSpanContextValid;
          } }), Object.defineProperty(s, "isValidTraceId", { enumerable: true, get: function() {
            return m.isValidTraceId;
          } }), Object.defineProperty(s, "isValidSpanId", { enumerable: true, get: function() {
            return m.isValidSpanId;
          } });
          var y = i(476);
          Object.defineProperty(s, "INVALID_SPANID", { enumerable: true, get: function() {
            return y.INVALID_SPANID;
          } }), Object.defineProperty(s, "INVALID_TRACEID", { enumerable: true, get: function() {
            return y.INVALID_TRACEID;
          } }), Object.defineProperty(s, "INVALID_SPAN_CONTEXT", { enumerable: true, get: function() {
            return y.INVALID_SPAN_CONTEXT;
          } });
          let b = i(67);
          Object.defineProperty(s, "context", { enumerable: true, get: function() {
            return b.context;
          } });
          let _ = i(506);
          Object.defineProperty(s, "diag", { enumerable: true, get: function() {
            return _.diag;
          } });
          let v = i(886);
          Object.defineProperty(s, "metrics", { enumerable: true, get: function() {
            return v.metrics;
          } });
          let w = i(939);
          Object.defineProperty(s, "propagation", { enumerable: true, get: function() {
            return w.propagation;
          } });
          let k = i(845);
          Object.defineProperty(s, "trace", { enumerable: true, get: function() {
            return k.trace;
          } }), s.default = { context: b.context, diag: _.diag, metrics: v.metrics, propagation: w.propagation, trace: k.trace };
        })(), e.exports = s;
      })();
    }, 373: (e) => {
      (() => {
        "use strict";
        "undefined" != typeof __nccwpck_require__ && (__nccwpck_require__.ab = "//");
        var t = {};
        (() => {
          t.parse = function(t2, r2) {
            if ("string" != typeof t2) throw TypeError("argument str must be a string");
            for (var i2 = {}, s = t2.split(n), a = (r2 || {}).decode || e2, o = 0; o < s.length; o++) {
              var l = s[o], c = l.indexOf("=");
              if (!(c < 0)) {
                var u = l.substr(0, c).trim(), d = l.substr(++c, l.length).trim();
                '"' == d[0] && (d = d.slice(1, -1)), void 0 == i2[u] && (i2[u] = function(e3, t3) {
                  try {
                    return t3(e3);
                  } catch (t4) {
                    return e3;
                  }
                }(d, a));
              }
            }
            return i2;
          }, t.serialize = function(e3, t2, n2) {
            var s = n2 || {}, a = s.encode || r;
            if ("function" != typeof a) throw TypeError("option encode is invalid");
            if (!i.test(e3)) throw TypeError("argument name is invalid");
            var o = a(t2);
            if (o && !i.test(o)) throw TypeError("argument val is invalid");
            var l = e3 + "=" + o;
            if (null != s.maxAge) {
              var c = s.maxAge - 0;
              if (isNaN(c) || !isFinite(c)) throw TypeError("option maxAge is invalid");
              l += "; Max-Age=" + Math.floor(c);
            }
            if (s.domain) {
              if (!i.test(s.domain)) throw TypeError("option domain is invalid");
              l += "; Domain=" + s.domain;
            }
            if (s.path) {
              if (!i.test(s.path)) throw TypeError("option path is invalid");
              l += "; Path=" + s.path;
            }
            if (s.expires) {
              if ("function" != typeof s.expires.toUTCString) throw TypeError("option expires is invalid");
              l += "; Expires=" + s.expires.toUTCString();
            }
            if (s.httpOnly && (l += "; HttpOnly"), s.secure && (l += "; Secure"), s.sameSite) switch ("string" == typeof s.sameSite ? s.sameSite.toLowerCase() : s.sameSite) {
              case true:
              case "strict":
                l += "; SameSite=Strict";
                break;
              case "lax":
                l += "; SameSite=Lax";
                break;
              case "none":
                l += "; SameSite=None";
                break;
              default:
                throw TypeError("option sameSite is invalid");
            }
            return l;
          };
          var e2 = decodeURIComponent, r = encodeURIComponent, n = /; */, i = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
        })(), e.exports = t;
      })();
    }, 568: (e, t, r) => {
      var n;
      (() => {
        var i = { 226: function(i2, s2) {
          !function(a2, o2) {
            "use strict";
            var l = "function", c = "undefined", u = "object", d = "string", h = "major", p = "model", f = "name", g = "type", m = "vendor", y = "version", b = "architecture", _ = "console", v = "mobile", w = "tablet", k = "smarttv", S = "wearable", T = "embedded", x = "Amazon", E = "Apple", O = "ASUS", C = "BlackBerry", I = "Browser", P = "Chrome", A = "Firefox", R = "Google", N = "Huawei", U = "Microsoft", M = "Motorola", L = "Opera", q = "Samsung", D = "Sharp", j = "Sony", B = "Xiaomi", H = "Zebra", K = "Facebook", $ = "Chromium OS", z = "Mac OS", F = function(e2, t2) {
              var r2 = {};
              for (var n2 in e2) t2[n2] && t2[n2].length % 2 == 0 ? r2[n2] = t2[n2].concat(e2[n2]) : r2[n2] = e2[n2];
              return r2;
            }, J = function(e2) {
              for (var t2 = {}, r2 = 0; r2 < e2.length; r2++) t2[e2[r2].toUpperCase()] = e2[r2];
              return t2;
            }, V = function(e2, t2) {
              return typeof e2 === d && -1 !== W(t2).indexOf(W(e2));
            }, W = function(e2) {
              return e2.toLowerCase();
            }, G = function(e2, t2) {
              if (typeof e2 === d) return e2 = e2.replace(/^\s\s*/, ""), typeof t2 === c ? e2 : e2.substring(0, 350);
            }, X = function(e2, t2) {
              for (var r2, n2, i3, s3, a3, c2, d2 = 0; d2 < t2.length && !a3; ) {
                var h2 = t2[d2], p2 = t2[d2 + 1];
                for (r2 = n2 = 0; r2 < h2.length && !a3 && h2[r2]; ) if (a3 = h2[r2++].exec(e2)) for (i3 = 0; i3 < p2.length; i3++) c2 = a3[++n2], typeof (s3 = p2[i3]) === u && s3.length > 0 ? 2 === s3.length ? typeof s3[1] == l ? this[s3[0]] = s3[1].call(this, c2) : this[s3[0]] = s3[1] : 3 === s3.length ? typeof s3[1] !== l || s3[1].exec && s3[1].test ? this[s3[0]] = c2 ? c2.replace(s3[1], s3[2]) : void 0 : this[s3[0]] = c2 ? s3[1].call(this, c2, s3[2]) : void 0 : 4 === s3.length && (this[s3[0]] = c2 ? s3[3].call(this, c2.replace(s3[1], s3[2])) : void 0) : this[s3] = c2 || o2;
                d2 += 2;
              }
            }, Y = function(e2, t2) {
              for (var r2 in t2) if (typeof t2[r2] === u && t2[r2].length > 0) {
                for (var n2 = 0; n2 < t2[r2].length; n2++) if (V(t2[r2][n2], e2)) return "?" === r2 ? o2 : r2;
              } else if (V(t2[r2], e2)) return "?" === r2 ? o2 : r2;
              return e2;
            }, Q = { ME: "4.90", "NT 3.11": "NT3.51", "NT 4.0": "NT4.0", 2e3: "NT 5.0", XP: ["NT 5.1", "NT 5.2"], Vista: "NT 6.0", 7: "NT 6.1", 8: "NT 6.2", 8.1: "NT 6.3", 10: ["NT 6.4", "NT 10.0"], RT: "ARM" }, Z = { browser: [[/\b(?:crmo|crios)\/([\w\.]+)/i], [y, [f, "Chrome"]], [/edg(?:e|ios|a)?\/([\w\.]+)/i], [y, [f, "Edge"]], [/(opera mini)\/([-\w\.]+)/i, /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i, /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i], [f, y], [/opios[\/ ]+([\w\.]+)/i], [y, [f, L + " Mini"]], [/\bopr\/([\w\.]+)/i], [y, [f, L]], [/(kindle)\/([\w\.]+)/i, /(lunascape|maxthon|netfront|jasmine|blazer)[\/ ]?([\w\.]*)/i, /(avant |iemobile|slim)(?:browser)?[\/ ]?([\w\.]*)/i, /(ba?idubrowser)[\/ ]?([\w\.]+)/i, /(?:ms|\()(ie) ([\w\.]+)/i, /(flock|rockmelt|midori|epiphany|silk|skyfire|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon|rekonq|puffin|brave|whale(?!.+naver)|qqbrowserlite|qq|duckduckgo)\/([-\w\.]+)/i, /(heytap|ovi)browser\/([\d\.]+)/i, /(weibo)__([\d\.]+)/i], [f, y], [/(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i], [y, [f, "UC" + I]], [/microm.+\bqbcore\/([\w\.]+)/i, /\bqbcore\/([\w\.]+).+microm/i], [y, [f, "WeChat(Win) Desktop"]], [/micromessenger\/([\w\.]+)/i], [y, [f, "WeChat"]], [/konqueror\/([\w\.]+)/i], [y, [f, "Konqueror"]], [/trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i], [y, [f, "IE"]], [/ya(?:search)?browser\/([\w\.]+)/i], [y, [f, "Yandex"]], [/(avast|avg)\/([\w\.]+)/i], [[f, /(.+)/, "$1 Secure " + I], y], [/\bfocus\/([\w\.]+)/i], [y, [f, A + " Focus"]], [/\bopt\/([\w\.]+)/i], [y, [f, L + " Touch"]], [/coc_coc\w+\/([\w\.]+)/i], [y, [f, "Coc Coc"]], [/dolfin\/([\w\.]+)/i], [y, [f, "Dolphin"]], [/coast\/([\w\.]+)/i], [y, [f, L + " Coast"]], [/miuibrowser\/([\w\.]+)/i], [y, [f, "MIUI " + I]], [/fxios\/([-\w\.]+)/i], [y, [f, A]], [/\bqihu|(qi?ho?o?|360)browser/i], [[f, "360 " + I]], [/(oculus|samsung|sailfish|huawei)browser\/([\w\.]+)/i], [[f, /(.+)/, "$1 " + I], y], [/(comodo_dragon)\/([\w\.]+)/i], [[f, /_/g, " "], y], [/(electron)\/([\w\.]+) safari/i, /(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i, /m?(qqbrowser|baiduboxapp|2345Explorer)[\/ ]?([\w\.]+)/i], [f, y], [/(metasr)[\/ ]?([\w\.]+)/i, /(lbbrowser)/i, /\[(linkedin)app\]/i], [f], [/((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i], [[f, K], y], [/(kakao(?:talk|story))[\/ ]([\w\.]+)/i, /(naver)\(.*?(\d+\.[\w\.]+).*\)/i, /safari (line)\/([\w\.]+)/i, /\b(line)\/([\w\.]+)\/iab/i, /(chromium|instagram)[\/ ]([-\w\.]+)/i], [f, y], [/\bgsa\/([\w\.]+) .*safari\//i], [y, [f, "GSA"]], [/musical_ly(?:.+app_?version\/|_)([\w\.]+)/i], [y, [f, "TikTok"]], [/headlesschrome(?:\/([\w\.]+)| )/i], [y, [f, P + " Headless"]], [/ wv\).+(chrome)\/([\w\.]+)/i], [[f, P + " WebView"], y], [/droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i], [y, [f, "Android " + I]], [/(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i], [f, y], [/version\/([\w\.\,]+) .*mobile\/\w+ (safari)/i], [y, [f, "Mobile Safari"]], [/version\/([\w(\.|\,)]+) .*(mobile ?safari|safari)/i], [y, f], [/webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i], [f, [y, Y, { "1.0": "/8", 1.2: "/1", 1.3: "/3", "2.0": "/412", "2.0.2": "/416", "2.0.3": "/417", "2.0.4": "/419", "?": "/" }]], [/(webkit|khtml)\/([\w\.]+)/i], [f, y], [/(navigator|netscape\d?)\/([-\w\.]+)/i], [[f, "Netscape"], y], [/mobile vr; rv:([\w\.]+)\).+firefox/i], [y, [f, A + " Reality"]], [/ekiohf.+(flow)\/([\w\.]+)/i, /(swiftfox)/i, /(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror|klar)[\/ ]?([\w\.\+]+)/i, /(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i, /(firefox)\/([\w\.]+)/i, /(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i, /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir|obigo|mosaic|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i, /(links) \(([\w\.]+)/i, /panasonic;(viera)/i], [f, y], [/(cobalt)\/([\w\.]+)/i], [f, [y, /master.|lts./, ""]]], cpu: [[/(?:(amd|x(?:(?:86|64)[-_])?|wow|win)64)[;\)]/i], [[b, "amd64"]], [/(ia32(?=;))/i], [[b, W]], [/((?:i[346]|x)86)[;\)]/i], [[b, "ia32"]], [/\b(aarch64|arm(v?8e?l?|_?64))\b/i], [[b, "arm64"]], [/\b(arm(?:v[67])?ht?n?[fl]p?)\b/i], [[b, "armhf"]], [/windows (ce|mobile); ppc;/i], [[b, "arm"]], [/((?:ppc|powerpc)(?:64)?)(?: mac|;|\))/i], [[b, /ower/, "", W]], [/(sun4\w)[;\)]/i], [[b, "sparc"]], [/((?:avr32|ia64(?=;))|68k(?=\))|\barm(?=v(?:[1-7]|[5-7]1)l?|;|eabi)|(?=atmel )avr|(?:irix|mips|sparc)(?:64)?\b|pa-risc)/i], [[b, W]]], device: [[/\b(sch-i[89]0\d|shw-m380s|sm-[ptx]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i], [p, [m, q], [g, w]], [/\b((?:s[cgp]h|gt|sm)-\w+|sc[g-]?[\d]+a?|galaxy nexus)/i, /samsung[- ]([-\w]+)/i, /sec-(sgh\w+)/i], [p, [m, q], [g, v]], [/(?:\/|\()(ip(?:hone|od)[\w, ]*)(?:\/|;)/i], [p, [m, E], [g, v]], [/\((ipad);[-\w\),; ]+apple/i, /applecoremedia\/[\w\.]+ \((ipad)/i, /\b(ipad)\d\d?,\d\d?[;\]].+ios/i], [p, [m, E], [g, w]], [/(macintosh);/i], [p, [m, E]], [/\b(sh-?[altvz]?\d\d[a-ekm]?)/i], [p, [m, D], [g, v]], [/\b((?:ag[rs][23]?|bah2?|sht?|btv)-a?[lw]\d{2})\b(?!.+d\/s)/i], [p, [m, N], [g, w]], [/(?:huawei|honor)([-\w ]+)[;\)]/i, /\b(nexus 6p|\w{2,4}e?-[atu]?[ln][\dx][012359c][adn]?)\b(?!.+d\/s)/i], [p, [m, N], [g, v]], [/\b(poco[\w ]+)(?: bui|\))/i, /\b; (\w+) build\/hm\1/i, /\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i, /\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i, /\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max|cc)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite)?)(?: bui|\))/i], [[p, /_/g, " "], [m, B], [g, v]], [/\b(mi[-_ ]?(?:pad)(?:[\w_ ]+))(?: bui|\))/i], [[p, /_/g, " "], [m, B], [g, w]], [/; (\w+) bui.+ oppo/i, /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007|a101op)\b/i], [p, [m, "OPPO"], [g, v]], [/vivo (\w+)(?: bui|\))/i, /\b(v[12]\d{3}\w?[at])(?: bui|;)/i], [p, [m, "Vivo"], [g, v]], [/\b(rmx[12]\d{3})(?: bui|;|\))/i], [p, [m, "Realme"], [g, v]], [/\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i, /\bmot(?:orola)?[- ](\w*)/i, /((?:moto[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i], [p, [m, M], [g, v]], [/\b(mz60\d|xoom[2 ]{0,2}) build\//i], [p, [m, M], [g, w]], [/((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i], [p, [m, "LG"], [g, w]], [/(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i, /\blg[-e;\/ ]+((?!browser|netcast|android tv)\w+)/i, /\blg-?([\d\w]+) bui/i], [p, [m, "LG"], [g, v]], [/(ideatab[-\w ]+)/i, /lenovo ?(s[56]000[-\w]+|tab(?:[\w ]+)|yt[-\d\w]{6}|tb[-\d\w]{6})/i], [p, [m, "Lenovo"], [g, w]], [/(?:maemo|nokia).*(n900|lumia \d+)/i, /nokia[-_ ]?([-\w\.]*)/i], [[p, /_/g, " "], [m, "Nokia"], [g, v]], [/(pixel c)\b/i], [p, [m, R], [g, w]], [/droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i], [p, [m, R], [g, v]], [/droid.+ (a?\d[0-2]{2}so|[c-g]\d{4}|so[-gl]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i], [p, [m, j], [g, v]], [/sony tablet [ps]/i, /\b(?:sony)?sgp\w+(?: bui|\))/i], [[p, "Xperia Tablet"], [m, j], [g, w]], [/ (kb2005|in20[12]5|be20[12][59])\b/i, /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i], [p, [m, "OnePlus"], [g, v]], [/(alexa)webm/i, /(kf[a-z]{2}wi|aeo[c-r]{2})( bui|\))/i, /(kf[a-z]+)( bui|\)).+silk\//i], [p, [m, x], [g, w]], [/((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i], [[p, /(.+)/g, "Fire Phone $1"], [m, x], [g, v]], [/(playbook);[-\w\),; ]+(rim)/i], [p, m, [g, w]], [/\b((?:bb[a-f]|st[hv])100-\d)/i, /\(bb10; (\w+)/i], [p, [m, C], [g, v]], [/(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i], [p, [m, O], [g, w]], [/ (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i], [p, [m, O], [g, v]], [/(nexus 9)/i], [p, [m, "HTC"], [g, w]], [/(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i, /(zte)[- ]([\w ]+?)(?: bui|\/|\))/i, /(alcatel|geeksphone|nexian|panasonic(?!(?:;|\.))|sony(?!-bra))[-_ ]?([-\w]*)/i], [m, [p, /_/g, " "], [g, v]], [/droid.+; ([ab][1-7]-?[0178a]\d\d?)/i], [p, [m, "Acer"], [g, w]], [/droid.+; (m[1-5] note) bui/i, /\bmz-([-\w]{2,})/i], [p, [m, "Meizu"], [g, v]], [/(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[-_ ]?([-\w]*)/i, /(hp) ([\w ]+\w)/i, /(asus)-?(\w+)/i, /(microsoft); (lumia[\w ]+)/i, /(lenovo)[-_ ]?([-\w]+)/i, /(jolla)/i, /(oppo) ?([\w ]+) bui/i], [m, p, [g, v]], [/(kobo)\s(ereader|touch)/i, /(archos) (gamepad2?)/i, /(hp).+(touchpad(?!.+tablet)|tablet)/i, /(kindle)\/([\w\.]+)/i, /(nook)[\w ]+build\/(\w+)/i, /(dell) (strea[kpr\d ]*[\dko])/i, /(le[- ]+pan)[- ]+(\w{1,9}) bui/i, /(trinity)[- ]*(t\d{3}) bui/i, /(gigaset)[- ]+(q\w{1,9}) bui/i, /(vodafone) ([\w ]+)(?:\)| bui)/i], [m, p, [g, w]], [/(surface duo)/i], [p, [m, U], [g, w]], [/droid [\d\.]+; (fp\du?)(?: b|\))/i], [p, [m, "Fairphone"], [g, v]], [/(u304aa)/i], [p, [m, "AT&T"], [g, v]], [/\bsie-(\w*)/i], [p, [m, "Siemens"], [g, v]], [/\b(rct\w+) b/i], [p, [m, "RCA"], [g, w]], [/\b(venue[\d ]{2,7}) b/i], [p, [m, "Dell"], [g, w]], [/\b(q(?:mv|ta)\w+) b/i], [p, [m, "Verizon"], [g, w]], [/\b(?:barnes[& ]+noble |bn[rt])([\w\+ ]*) b/i], [p, [m, "Barnes & Noble"], [g, w]], [/\b(tm\d{3}\w+) b/i], [p, [m, "NuVision"], [g, w]], [/\b(k88) b/i], [p, [m, "ZTE"], [g, w]], [/\b(nx\d{3}j) b/i], [p, [m, "ZTE"], [g, v]], [/\b(gen\d{3}) b.+49h/i], [p, [m, "Swiss"], [g, v]], [/\b(zur\d{3}) b/i], [p, [m, "Swiss"], [g, w]], [/\b((zeki)?tb.*\b) b/i], [p, [m, "Zeki"], [g, w]], [/\b([yr]\d{2}) b/i, /\b(dragon[- ]+touch |dt)(\w{5}) b/i], [[m, "Dragon Touch"], p, [g, w]], [/\b(ns-?\w{0,9}) b/i], [p, [m, "Insignia"], [g, w]], [/\b((nxa|next)-?\w{0,9}) b/i], [p, [m, "NextBook"], [g, w]], [/\b(xtreme\_)?(v(1[045]|2[015]|[3469]0|7[05])) b/i], [[m, "Voice"], p, [g, v]], [/\b(lvtel\-)?(v1[12]) b/i], [[m, "LvTel"], p, [g, v]], [/\b(ph-1) /i], [p, [m, "Essential"], [g, v]], [/\b(v(100md|700na|7011|917g).*\b) b/i], [p, [m, "Envizen"], [g, w]], [/\b(trio[-\w\. ]+) b/i], [p, [m, "MachSpeed"], [g, w]], [/\btu_(1491) b/i], [p, [m, "Rotor"], [g, w]], [/(shield[\w ]+) b/i], [p, [m, "Nvidia"], [g, w]], [/(sprint) (\w+)/i], [m, p, [g, v]], [/(kin\.[onetw]{3})/i], [[p, /\./g, " "], [m, U], [g, v]], [/droid.+; (cc6666?|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i], [p, [m, H], [g, w]], [/droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i], [p, [m, H], [g, v]], [/smart-tv.+(samsung)/i], [m, [g, k]], [/hbbtv.+maple;(\d+)/i], [[p, /^/, "SmartTV"], [m, q], [g, k]], [/(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i], [[m, "LG"], [g, k]], [/(apple) ?tv/i], [m, [p, E + " TV"], [g, k]], [/crkey/i], [[p, P + "cast"], [m, R], [g, k]], [/droid.+aft(\w)( bui|\))/i], [p, [m, x], [g, k]], [/\(dtv[\);].+(aquos)/i, /(aquos-tv[\w ]+)\)/i], [p, [m, D], [g, k]], [/(bravia[\w ]+)( bui|\))/i], [p, [m, j], [g, k]], [/(mitv-\w{5}) bui/i], [p, [m, B], [g, k]], [/Hbbtv.*(technisat) (.*);/i], [m, p, [g, k]], [/\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i, /hbbtv\/\d+\.\d+\.\d+ +\([\w\+ ]*; *([\w\d][^;]*);([^;]*)/i], [[m, G], [p, G], [g, k]], [/\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i], [[g, k]], [/(ouya)/i, /(nintendo) ([wids3utch]+)/i], [m, p, [g, _]], [/droid.+; (shield) bui/i], [p, [m, "Nvidia"], [g, _]], [/(playstation [345portablevi]+)/i], [p, [m, j], [g, _]], [/\b(xbox(?: one)?(?!; xbox))[\); ]/i], [p, [m, U], [g, _]], [/((pebble))app/i], [m, p, [g, S]], [/(watch)(?: ?os[,\/]|\d,\d\/)[\d\.]+/i], [p, [m, E], [g, S]], [/droid.+; (glass) \d/i], [p, [m, R], [g, S]], [/droid.+; (wt63?0{2,3})\)/i], [p, [m, H], [g, S]], [/(quest( 2| pro)?)/i], [p, [m, K], [g, S]], [/(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i], [m, [g, T]], [/(aeobc)\b/i], [p, [m, x], [g, T]], [/droid .+?; ([^;]+?)(?: bui|\) applew).+? mobile safari/i], [p, [g, v]], [/droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i], [p, [g, w]], [/\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i], [[g, w]], [/(phone|mobile(?:[;\/]| [ \w\/\.]*safari)|pda(?=.+windows ce))/i], [[g, v]], [/(android[-\w\. ]{0,9});.+buil/i], [p, [m, "Generic"]]], engine: [[/windows.+ edge\/([\w\.]+)/i], [y, [f, "EdgeHTML"]], [/webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i], [y, [f, "Blink"]], [/(presto)\/([\w\.]+)/i, /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i, /ekioh(flow)\/([\w\.]+)/i, /(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i, /(icab)[\/ ]([23]\.[\d\.]+)/i, /\b(libweb)/i], [f, y], [/rv\:([\w\.]{1,9})\b.+(gecko)/i], [y, f]], os: [[/microsoft (windows) (vista|xp)/i], [f, y], [/(windows) nt 6\.2; (arm)/i, /(windows (?:phone(?: os)?|mobile))[\/ ]?([\d\.\w ]*)/i, /(windows)[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i], [f, [y, Y, Q]], [/(win(?=3|9|n)|win 9x )([nt\d\.]+)/i], [[f, "Windows"], [y, Y, Q]], [/ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i, /ios;fbsv\/([\d\.]+)/i, /cfnetwork\/.+darwin/i], [[y, /_/g, "."], [f, "iOS"]], [/(mac os x) ?([\w\. ]*)/i, /(macintosh|mac_powerpc\b)(?!.+haiku)/i], [[f, z], [y, /_/g, "."]], [/droid ([\w\.]+)\b.+(android[- ]x86|harmonyos)/i], [y, f], [/(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i, /(blackberry)\w*\/([\w\.]*)/i, /(tizen|kaios)[\/ ]([\w\.]+)/i, /\((series40);/i], [f, y], [/\(bb(10);/i], [y, [f, C]], [/(?:symbian ?os|symbos|s60(?=;)|series60)[-\/ ]?([\w\.]*)/i], [y, [f, "Symbian"]], [/mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i], [y, [f, A + " OS"]], [/web0s;.+rt(tv)/i, /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i], [y, [f, "webOS"]], [/watch(?: ?os[,\/]|\d,\d\/)([\d\.]+)/i], [y, [f, "watchOS"]], [/crkey\/([\d\.]+)/i], [y, [f, P + "cast"]], [/(cros) [\w]+(?:\)| ([\w\.]+)\b)/i], [[f, $], y], [/panasonic;(viera)/i, /(netrange)mmh/i, /(nettv)\/(\d+\.[\w\.]+)/i, /(nintendo|playstation) ([wids345portablevuch]+)/i, /(xbox); +xbox ([^\);]+)/i, /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i, /(mint)[\/\(\) ]?(\w*)/i, /(mageia|vectorlinux)[; ]/i, /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i, /(hurd|linux) ?([\w\.]*)/i, /(gnu) ?([\w\.]*)/i, /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i, /(haiku) (\w+)/i], [f, y], [/(sunos) ?([\w\.\d]*)/i], [[f, "Solaris"], y], [/((?:open)?solaris)[-\/ ]?([\w\.]*)/i, /(aix) ((\d)(?=\.|\)| )[\w\.])*/i, /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux|serenityos)/i, /(unix) ?([\w\.]*)/i], [f, y]] }, ee = function(e2, t2) {
              if (typeof e2 === u && (t2 = e2, e2 = o2), !(this instanceof ee)) return new ee(e2, t2).getResult();
              var r2 = typeof a2 !== c && a2.navigator ? a2.navigator : o2, n2 = e2 || (r2 && r2.userAgent ? r2.userAgent : ""), i3 = r2 && r2.userAgentData ? r2.userAgentData : o2, s3 = t2 ? F(Z, t2) : Z, _2 = r2 && r2.userAgent == n2;
              return this.getBrowser = function() {
                var e3, t3 = {};
                return t3[f] = o2, t3[y] = o2, X.call(t3, n2, s3.browser), t3[h] = typeof (e3 = t3[y]) === d ? e3.replace(/[^\d\.]/g, "").split(".")[0] : o2, _2 && r2 && r2.brave && typeof r2.brave.isBrave == l && (t3[f] = "Brave"), t3;
              }, this.getCPU = function() {
                var e3 = {};
                return e3[b] = o2, X.call(e3, n2, s3.cpu), e3;
              }, this.getDevice = function() {
                var e3 = {};
                return e3[m] = o2, e3[p] = o2, e3[g] = o2, X.call(e3, n2, s3.device), _2 && !e3[g] && i3 && i3.mobile && (e3[g] = v), _2 && "Macintosh" == e3[p] && r2 && typeof r2.standalone !== c && r2.maxTouchPoints && r2.maxTouchPoints > 2 && (e3[p] = "iPad", e3[g] = w), e3;
              }, this.getEngine = function() {
                var e3 = {};
                return e3[f] = o2, e3[y] = o2, X.call(e3, n2, s3.engine), e3;
              }, this.getOS = function() {
                var e3 = {};
                return e3[f] = o2, e3[y] = o2, X.call(e3, n2, s3.os), _2 && !e3[f] && i3 && "Unknown" != i3.platform && (e3[f] = i3.platform.replace(/chrome os/i, $).replace(/macos/i, z)), e3;
              }, this.getResult = function() {
                return { ua: this.getUA(), browser: this.getBrowser(), engine: this.getEngine(), os: this.getOS(), device: this.getDevice(), cpu: this.getCPU() };
              }, this.getUA = function() {
                return n2;
              }, this.setUA = function(e3) {
                return n2 = typeof e3 === d && e3.length > 350 ? G(e3, 350) : e3, this;
              }, this.setUA(n2), this;
            };
            ee.VERSION = "1.0.35", ee.BROWSER = J([f, y, h]), ee.CPU = J([b]), ee.DEVICE = J([p, m, g, _, v, k, w, S, T]), ee.ENGINE = ee.OS = J([f, y]), typeof s2 !== c ? (i2.exports && (s2 = i2.exports = ee), s2.UAParser = ee) : r.amdO ? void 0 !== (n = function() {
              return ee;
            }.call(t, r, t, e)) && (e.exports = n) : typeof a2 !== c && (a2.UAParser = ee);
            var et = typeof a2 !== c && (a2.jQuery || a2.Zepto);
            if (et && !et.ua) {
              var er = new ee();
              et.ua = er.getResult(), et.ua.get = function() {
                return er.getUA();
              }, et.ua.set = function(e2) {
                er.setUA(e2);
                var t2 = er.getResult();
                for (var r2 in t2) et.ua[r2] = t2[r2];
              };
            }
          }("object" == typeof window ? window : this);
        } }, s = {};
        function a(e2) {
          var t2 = s[e2];
          if (void 0 !== t2) return t2.exports;
          var r2 = s[e2] = { exports: {} }, n2 = true;
          try {
            i[e2].call(r2.exports, r2, r2.exports, a), n2 = false;
          } finally {
            n2 && delete s[e2];
          }
          return r2.exports;
        }
        a.ab = "//";
        var o = a(226);
        e.exports = o;
      })();
    }, 907: (e, t, r) => {
      "use strict";
      r.d(t, { headers: () => u }), r(991);
      var n = r(226);
      r(701), r(786);
      var i = r(850), s = r(942);
      class a extends Error {
        constructor(e2) {
          super("Dynamic server usage: " + e2), this.description = e2, this.digest = "DYNAMIC_SERVER_USAGE";
        }
      }
      class o extends Error {
        constructor(...e2) {
          super(...e2), this.code = "NEXT_STATIC_GEN_BAILOUT";
        }
      }
      let l = "function" == typeof s.unstable_postpone;
      var c = r(369);
      function u() {
        let e2 = "headers", t2 = i.A.getStore();
        if (t2) {
          if (t2.forceStatic) return n.h.seal(new Headers({}));
          !function(e3, t3) {
            let r2 = new URL(e3.urlPathname, "http://n").pathname;
            if (e3.isUnstableCacheCallback) throw Error(`Route ${r2} used "${t3}" inside a function cached with "unstable_cache(...)". Accessing Dynamic data sources inside a cache scope is not supported. If you need this data inside a cached function use "${t3}" outside of the cached function and pass the required dynamic data in as an argument. See more info here: https://nextjs.org/docs/app/api-reference/functions/unstable_cache`);
            if (e3.dynamicShouldError) throw new o(`Route ${r2} with \`dynamic = "error"\` couldn't be rendered statically because it used \`${t3}\`. See more info here: https://nextjs.org/docs/app/building-your-application/rendering/static-and-dynamic#dynamic-rendering`);
            if (e3.prerenderState) !function(e4, t4, r3) {
              !function() {
                if (!l) throw Error("Invariant: React.unstable_postpone is not defined. This suggests the wrong version of React was loaded. This is a bug in Next.js");
              }();
              let n2 = `Route ${r3} needs to bail out of prerendering at this point because it used ${t4}. React throws this special object to indicate where. It should not be caught by your own try/catch. Learn more: https://nextjs.org/docs/messages/ppr-caught-error`;
              e4.dynamicAccesses.push({ stack: e4.isDebugSkeleton ? Error().stack : void 0, expression: t4 }), s.unstable_postpone(n2);
            }(e3.prerenderState, t3, r2);
            else if (e3.revalidate = 0, e3.isStaticGeneration) {
              let n2 = new a(`Route ${r2} couldn't be rendered statically because it used ${t3}. See more info here: https://nextjs.org/docs/messages/dynamic-server-error`);
              throw e3.dynamicUsageDescription = t3, e3.dynamicUsageStack = n2.stack, n2;
            }
          }(t2, e2);
        }
        return (0, c.F)(e2).headers;
      }
    }, 786: (e, t, r) => {
      "use strict";
      (0, r(612).P)();
    }, 566: (e, t, r) => {
      "use strict";
      r.r(t), r.d(t, { bailoutToClientRendering: () => s });
      class n extends Error {
        constructor(e2) {
          super("Bail out to client-side rendering: " + e2), this.reason = e2, this.digest = "BAILOUT_TO_CLIENT_SIDE_RENDERING";
        }
      }
      var i = r(850);
      function s(e2) {
        let t2 = i.A.getStore();
        if ((null == t2 || !t2.forceStatic) && (null == t2 ? void 0 : t2.isStaticGeneration)) throw new n(e2);
      }
    }, 369: (e, t, r) => {
      "use strict";
      r.d(t, { F: () => i, O: () => n });
      let n = (0, r(612).P)();
      function i(e2) {
        let t2 = n.getStore();
        if (t2) return t2;
        throw Error("`" + e2 + "` was called outside a request scope. Read more: https://nextjs.org/docs/messages/next-dynamic-api-wrong-context");
      }
    }, 850: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => n });
      let n = (0, r(612).P)();
    }, 226: (e, t, r) => {
      "use strict";
      r.d(t, { h: () => s });
      var n = r(173);
      class i extends Error {
        constructor() {
          super("Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers");
        }
        static callable() {
          throw new i();
        }
      }
      class s extends Headers {
        constructor(e2) {
          super(), this.headers = new Proxy(e2, { get(t2, r2, i2) {
            if ("symbol" == typeof r2) return n.g.get(t2, r2, i2);
            let s2 = r2.toLowerCase(), a = Object.keys(e2).find((e3) => e3.toLowerCase() === s2);
            if (void 0 !== a) return n.g.get(t2, a, i2);
          }, set(t2, r2, i2, s2) {
            if ("symbol" == typeof r2) return n.g.set(t2, r2, i2, s2);
            let a = r2.toLowerCase(), o = Object.keys(e2).find((e3) => e3.toLowerCase() === a);
            return n.g.set(t2, o ?? r2, i2, s2);
          }, has(t2, r2) {
            if ("symbol" == typeof r2) return n.g.has(t2, r2);
            let i2 = r2.toLowerCase(), s2 = Object.keys(e2).find((e3) => e3.toLowerCase() === i2);
            return void 0 !== s2 && n.g.has(t2, s2);
          }, deleteProperty(t2, r2) {
            if ("symbol" == typeof r2) return n.g.deleteProperty(t2, r2);
            let i2 = r2.toLowerCase(), s2 = Object.keys(e2).find((e3) => e3.toLowerCase() === i2);
            return void 0 === s2 || n.g.deleteProperty(t2, s2);
          } });
        }
        static seal(e2) {
          return new Proxy(e2, { get(e3, t2, r2) {
            switch (t2) {
              case "append":
              case "delete":
              case "set":
                return i.callable;
              default:
                return n.g.get(e3, t2, r2);
            }
          } });
        }
        merge(e2) {
          return Array.isArray(e2) ? e2.join(", ") : e2;
        }
        static from(e2) {
          return e2 instanceof Headers ? e2 : new s(e2);
        }
        append(e2, t2) {
          let r2 = this.headers[e2];
          "string" == typeof r2 ? this.headers[e2] = [r2, t2] : Array.isArray(r2) ? r2.push(t2) : this.headers[e2] = t2;
        }
        delete(e2) {
          delete this.headers[e2];
        }
        get(e2) {
          let t2 = this.headers[e2];
          return void 0 !== t2 ? this.merge(t2) : null;
        }
        has(e2) {
          return void 0 !== this.headers[e2];
        }
        set(e2, t2) {
          this.headers[e2] = t2;
        }
        forEach(e2, t2) {
          for (let [r2, n2] of this.entries()) e2.call(t2, n2, r2, this);
        }
        *entries() {
          for (let e2 of Object.keys(this.headers)) {
            let t2 = e2.toLowerCase(), r2 = this.get(t2);
            yield [t2, r2];
          }
        }
        *keys() {
          for (let e2 of Object.keys(this.headers)) {
            let t2 = e2.toLowerCase();
            yield t2;
          }
        }
        *values() {
          for (let e2 of Object.keys(this.headers)) {
            let t2 = this.get(e2);
            yield t2;
          }
        }
        [Symbol.iterator]() {
          return this.entries();
        }
      }
    }, 173: (e, t, r) => {
      "use strict";
      r.d(t, { g: () => n });
      class n {
        static get(e2, t2, r2) {
          let n2 = Reflect.get(e2, t2, r2);
          return "function" == typeof n2 ? n2.bind(e2) : n2;
        }
        static set(e2, t2, r2, n2) {
          return Reflect.set(e2, t2, r2, n2);
        }
        static has(e2, t2) {
          return Reflect.has(e2, t2);
        }
        static deleteProperty(e2, t2) {
          return Reflect.deleteProperty(e2, t2);
        }
      }
    }, 991: (e, t, r) => {
      "use strict";
      r.d(t, { Qb: () => o, vr: () => c });
      var n = r(701), i = r(173), s = r(850);
      class a extends Error {
        constructor() {
          super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#cookiessetname-value-options");
        }
        static callable() {
          throw new a();
        }
      }
      class o {
        static seal(e2) {
          return new Proxy(e2, { get(e3, t2, r2) {
            switch (t2) {
              case "clear":
              case "delete":
              case "set":
                return a.callable;
              default:
                return i.g.get(e3, t2, r2);
            }
          } });
        }
      }
      let l = Symbol.for("next.mutated.cookies");
      class c {
        static wrap(e2, t2) {
          let r2 = new n.n(new Headers());
          for (let t3 of e2.getAll()) r2.set(t3);
          let a2 = [], o2 = /* @__PURE__ */ new Set(), c2 = () => {
            let e3 = s.A.getStore();
            if (e3 && (e3.pathWasRevalidated = true), a2 = r2.getAll().filter((e4) => o2.has(e4.name)), t2) {
              let e4 = [];
              for (let t3 of a2) {
                let r3 = new n.n(new Headers());
                r3.set(t3), e4.push(r3.toString());
              }
              t2(e4);
            }
          };
          return new Proxy(r2, { get(e3, t3, r3) {
            switch (t3) {
              case l:
                return a2;
              case "delete":
                return function(...t4) {
                  o2.add("string" == typeof t4[0] ? t4[0] : t4[0].name);
                  try {
                    e3.delete(...t4);
                  } finally {
                    c2();
                  }
                };
              case "set":
                return function(...t4) {
                  o2.add("string" == typeof t4[0] ? t4[0] : t4[0].name);
                  try {
                    return e3.set(...t4);
                  } finally {
                    c2();
                  }
                };
              default:
                return i.g.get(e3, t3, r3);
            }
          } });
        }
      }
    }, 701: (e, t, r) => {
      "use strict";
      r.d(t, { n: () => n.ResponseCookies, q: () => n.RequestCookies });
      var n = r(447);
    }, 387: (e) => {
      "use strict";
      e.exports = ["chrome 64", "edge 79", "firefox 67", "opera 51", "safari 12"];
    }, 703: (e, t, r) => {
      "use strict";
      Object.defineProperty(t, "__esModule", { value: true }), function(e2, t2) {
        for (var r2 in t2) Object.defineProperty(e2, r2, { enumerable: true, get: t2[r2] });
      }(t, { getTestReqInfo: function() {
        return a;
      }, withRequest: function() {
        return s;
      } });
      let n = new (r(67)).AsyncLocalStorage();
      function i(e2, t2) {
        let r2 = t2.header(e2, "next-test-proxy-port");
        if (r2) return { url: t2.url(e2), proxyPort: Number(r2), testData: t2.header(e2, "next-test-data") || "" };
      }
      function s(e2, t2, r2) {
        let s2 = i(e2, t2);
        return s2 ? n.run(s2, r2) : r2();
      }
      function a(e2, t2) {
        return n.getStore() || (e2 && t2 ? i(e2, t2) : void 0);
      }
    }, 407: (e, t, r) => {
      "use strict";
      var n = r(195).Buffer;
      Object.defineProperty(t, "__esModule", { value: true }), function(e2, t2) {
        for (var r2 in t2) Object.defineProperty(e2, r2, { enumerable: true, get: t2[r2] });
      }(t, { handleFetch: function() {
        return o;
      }, interceptFetch: function() {
        return l;
      }, reader: function() {
        return s;
      } });
      let i = r(703), s = { url: (e2) => e2.url, header: (e2, t2) => e2.headers.get(t2) };
      async function a(e2, t2) {
        let { url: r2, method: i2, headers: s2, body: a2, cache: o2, credentials: l2, integrity: c, mode: u, redirect: d, referrer: h, referrerPolicy: p } = t2;
        return { testData: e2, api: "fetch", request: { url: r2, method: i2, headers: [...Array.from(s2), ["next-test-stack", function() {
          let e3 = (Error().stack ?? "").split("\n");
          for (let t3 = 1; t3 < e3.length; t3++) if (e3[t3].length > 0) {
            e3 = e3.slice(t3);
            break;
          }
          return (e3 = (e3 = (e3 = e3.filter((e4) => !e4.includes("/next/dist/"))).slice(0, 5)).map((e4) => e4.replace("webpack-internal:///(rsc)/", "").trim())).join("    ");
        }()]], body: a2 ? n.from(await t2.arrayBuffer()).toString("base64") : null, cache: o2, credentials: l2, integrity: c, mode: u, redirect: d, referrer: h, referrerPolicy: p } };
      }
      async function o(e2, t2) {
        let r2 = (0, i.getTestReqInfo)(t2, s);
        if (!r2) return e2(t2);
        let { testData: o2, proxyPort: l2 } = r2, c = await a(o2, t2), u = await e2(`http://localhost:${l2}`, { method: "POST", body: JSON.stringify(c), next: { internal: true } });
        if (!u.ok) throw Error(`Proxy request failed: ${u.status}`);
        let d = await u.json(), { api: h } = d;
        switch (h) {
          case "continue":
            return e2(t2);
          case "abort":
          case "unhandled":
            throw Error(`Proxy request aborted [${t2.method} ${t2.url}]`);
        }
        return function(e3) {
          let { status: t3, headers: r3, body: i2 } = e3.response;
          return new Response(i2 ? n.from(i2, "base64") : null, { status: t3, headers: new Headers(r3) });
        }(d);
      }
      function l(e2) {
        return r.g.fetch = function(t2, r2) {
          var n2;
          return (null == r2 ? void 0 : null == (n2 = r2.next) ? void 0 : n2.internal) ? e2(t2, r2) : o(e2, new Request(t2, r2));
        }, () => {
          r.g.fetch = e2;
        };
      }
    }, 311: (e, t, r) => {
      "use strict";
      Object.defineProperty(t, "__esModule", { value: true }), function(e2, t2) {
        for (var r2 in t2) Object.defineProperty(e2, r2, { enumerable: true, get: t2[r2] });
      }(t, { interceptTestApis: function() {
        return s;
      }, wrapRequestHandler: function() {
        return a;
      } });
      let n = r(703), i = r(407);
      function s() {
        return (0, i.interceptFetch)(r.g.fetch);
      }
      function a(e2) {
        return (t2, r2) => (0, n.withRequest)(t2, i.reader, () => e2(t2, r2));
      }
    }, 222: (e, t) => {
      "use strict";
      var r = Symbol.for("react.element"), n = Symbol.for("react.portal"), i = Symbol.for("react.fragment"), s = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.provider"), l = Symbol.for("react.context"), c = Symbol.for("react.forward_ref"), u = Symbol.for("react.suspense"), d = Symbol.for("react.memo"), h = Symbol.for("react.lazy"), p = Symbol.iterator, f = { isMounted: function() {
        return false;
      }, enqueueForceUpdate: function() {
      }, enqueueReplaceState: function() {
      }, enqueueSetState: function() {
      } }, g = Object.assign, m = {};
      function y(e2, t2, r2) {
        this.props = e2, this.context = t2, this.refs = m, this.updater = r2 || f;
      }
      function b() {
      }
      function _(e2, t2, r2) {
        this.props = e2, this.context = t2, this.refs = m, this.updater = r2 || f;
      }
      y.prototype.isReactComponent = {}, y.prototype.setState = function(e2, t2) {
        if ("object" != typeof e2 && "function" != typeof e2 && null != e2) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
        this.updater.enqueueSetState(this, e2, t2, "setState");
      }, y.prototype.forceUpdate = function(e2) {
        this.updater.enqueueForceUpdate(this, e2, "forceUpdate");
      }, b.prototype = y.prototype;
      var v = _.prototype = new b();
      v.constructor = _, g(v, y.prototype), v.isPureReactComponent = true;
      var w = Array.isArray, k = Object.prototype.hasOwnProperty, S = { current: null }, T = { key: true, ref: true, __self: true, __source: true };
      function x(e2, t2, n2) {
        var i2, s2 = {}, a2 = null, o2 = null;
        if (null != t2) for (i2 in void 0 !== t2.ref && (o2 = t2.ref), void 0 !== t2.key && (a2 = "" + t2.key), t2) k.call(t2, i2) && !T.hasOwnProperty(i2) && (s2[i2] = t2[i2]);
        var l2 = arguments.length - 2;
        if (1 === l2) s2.children = n2;
        else if (1 < l2) {
          for (var c2 = Array(l2), u2 = 0; u2 < l2; u2++) c2[u2] = arguments[u2 + 2];
          s2.children = c2;
        }
        if (e2 && e2.defaultProps) for (i2 in l2 = e2.defaultProps) void 0 === s2[i2] && (s2[i2] = l2[i2]);
        return { $$typeof: r, type: e2, key: a2, ref: o2, props: s2, _owner: S.current };
      }
      function E(e2) {
        return "object" == typeof e2 && null !== e2 && e2.$$typeof === r;
      }
      var O = /\/+/g;
      function C(e2, t2) {
        var r2, n2;
        return "object" == typeof e2 && null !== e2 && null != e2.key ? (r2 = "" + e2.key, n2 = { "=": "=0", ":": "=2" }, "$" + r2.replace(/[=:]/g, function(e3) {
          return n2[e3];
        })) : t2.toString(36);
      }
      function I(e2, t2, i2) {
        if (null == e2) return e2;
        var s2 = [], a2 = 0;
        return !function e3(t3, i3, s3, a3, o2) {
          var l2, c2, u2, d2 = typeof t3;
          ("undefined" === d2 || "boolean" === d2) && (t3 = null);
          var h2 = false;
          if (null === t3) h2 = true;
          else switch (d2) {
            case "string":
            case "number":
              h2 = true;
              break;
            case "object":
              switch (t3.$$typeof) {
                case r:
                case n:
                  h2 = true;
              }
          }
          if (h2) return o2 = o2(h2 = t3), t3 = "" === a3 ? "." + C(h2, 0) : a3, w(o2) ? (s3 = "", null != t3 && (s3 = t3.replace(O, "$&/") + "/"), e3(o2, i3, s3, "", function(e4) {
            return e4;
          })) : null != o2 && (E(o2) && (l2 = o2, c2 = s3 + (!o2.key || h2 && h2.key === o2.key ? "" : ("" + o2.key).replace(O, "$&/") + "/") + t3, o2 = { $$typeof: r, type: l2.type, key: c2, ref: l2.ref, props: l2.props, _owner: l2._owner }), i3.push(o2)), 1;
          if (h2 = 0, a3 = "" === a3 ? "." : a3 + ":", w(t3)) for (var f2 = 0; f2 < t3.length; f2++) {
            var g2 = a3 + C(d2 = t3[f2], f2);
            h2 += e3(d2, i3, s3, g2, o2);
          }
          else if ("function" == typeof (g2 = null === (u2 = t3) || "object" != typeof u2 ? null : "function" == typeof (u2 = p && u2[p] || u2["@@iterator"]) ? u2 : null)) for (t3 = g2.call(t3), f2 = 0; !(d2 = t3.next()).done; ) g2 = a3 + C(d2 = d2.value, f2++), h2 += e3(d2, i3, s3, g2, o2);
          else if ("object" === d2) throw Error("Objects are not valid as a React child (found: " + ("[object Object]" === (i3 = String(t3)) ? "object with keys {" + Object.keys(t3).join(", ") + "}" : i3) + "). If you meant to render a collection of children, use an array instead.");
          return h2;
        }(e2, s2, "", "", function(e3) {
          return t2.call(i2, e3, a2++);
        }), s2;
      }
      function P(e2) {
        if (-1 === e2._status) {
          var t2 = e2._result;
          (t2 = t2()).then(function(t3) {
            (0 === e2._status || -1 === e2._status) && (e2._status = 1, e2._result = t3);
          }, function(t3) {
            (0 === e2._status || -1 === e2._status) && (e2._status = 2, e2._result = t3);
          }), -1 === e2._status && (e2._status = 0, e2._result = t2);
        }
        if (1 === e2._status) return e2._result.default;
        throw e2._result;
      }
      var A = { current: null }, R = { transition: null };
      function N() {
        throw Error("act(...) is not supported in production builds of React.");
      }
      t.Children = { map: I, forEach: function(e2, t2, r2) {
        I(e2, function() {
          t2.apply(this, arguments);
        }, r2);
      }, count: function(e2) {
        var t2 = 0;
        return I(e2, function() {
          t2++;
        }), t2;
      }, toArray: function(e2) {
        return I(e2, function(e3) {
          return e3;
        }) || [];
      }, only: function(e2) {
        if (!E(e2)) throw Error("React.Children.only expected to receive a single React element child.");
        return e2;
      } }, t.Component = y, t.Fragment = i, t.Profiler = a, t.PureComponent = _, t.StrictMode = s, t.Suspense = u, t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = { ReactCurrentDispatcher: A, ReactCurrentBatchConfig: R, ReactCurrentOwner: S }, t.act = N, t.cloneElement = function(e2, t2, n2) {
        if (null == e2) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + e2 + ".");
        var i2 = g({}, e2.props), s2 = e2.key, a2 = e2.ref, o2 = e2._owner;
        if (null != t2) {
          if (void 0 !== t2.ref && (a2 = t2.ref, o2 = S.current), void 0 !== t2.key && (s2 = "" + t2.key), e2.type && e2.type.defaultProps) var l2 = e2.type.defaultProps;
          for (c2 in t2) k.call(t2, c2) && !T.hasOwnProperty(c2) && (i2[c2] = void 0 === t2[c2] && void 0 !== l2 ? l2[c2] : t2[c2]);
        }
        var c2 = arguments.length - 2;
        if (1 === c2) i2.children = n2;
        else if (1 < c2) {
          l2 = Array(c2);
          for (var u2 = 0; u2 < c2; u2++) l2[u2] = arguments[u2 + 2];
          i2.children = l2;
        }
        return { $$typeof: r, type: e2.type, key: s2, ref: a2, props: i2, _owner: o2 };
      }, t.createContext = function(e2) {
        return (e2 = { $$typeof: l, _currentValue: e2, _currentValue2: e2, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }).Provider = { $$typeof: o, _context: e2 }, e2.Consumer = e2;
      }, t.createElement = x, t.createFactory = function(e2) {
        var t2 = x.bind(null, e2);
        return t2.type = e2, t2;
      }, t.createRef = function() {
        return { current: null };
      }, t.forwardRef = function(e2) {
        return { $$typeof: c, render: e2 };
      }, t.isValidElement = E, t.lazy = function(e2) {
        return { $$typeof: h, _payload: { _status: -1, _result: e2 }, _init: P };
      }, t.memo = function(e2, t2) {
        return { $$typeof: d, type: e2, compare: void 0 === t2 ? null : t2 };
      }, t.startTransition = function(e2) {
        var t2 = R.transition;
        R.transition = {};
        try {
          e2();
        } finally {
          R.transition = t2;
        }
      }, t.unstable_act = N, t.useCallback = function(e2, t2) {
        return A.current.useCallback(e2, t2);
      }, t.useContext = function(e2) {
        return A.current.useContext(e2);
      }, t.useDebugValue = function() {
      }, t.useDeferredValue = function(e2) {
        return A.current.useDeferredValue(e2);
      }, t.useEffect = function(e2, t2) {
        return A.current.useEffect(e2, t2);
      }, t.useId = function() {
        return A.current.useId();
      }, t.useImperativeHandle = function(e2, t2, r2) {
        return A.current.useImperativeHandle(e2, t2, r2);
      }, t.useInsertionEffect = function(e2, t2) {
        return A.current.useInsertionEffect(e2, t2);
      }, t.useLayoutEffect = function(e2, t2) {
        return A.current.useLayoutEffect(e2, t2);
      }, t.useMemo = function(e2, t2) {
        return A.current.useMemo(e2, t2);
      }, t.useReducer = function(e2, t2, r2) {
        return A.current.useReducer(e2, t2, r2);
      }, t.useRef = function(e2) {
        return A.current.useRef(e2);
      }, t.useState = function(e2) {
        return A.current.useState(e2);
      }, t.useSyncExternalStore = function(e2, t2, r2) {
        return A.current.useSyncExternalStore(e2, t2, r2);
      }, t.useTransition = function() {
        return A.current.useTransition();
      }, t.version = "18.3.1";
    }, 942: (e, t, r) => {
      "use strict";
      e.exports = r(222);
    }, 612: (e, t, r) => {
      "use strict";
      r.d(t, { P: () => a });
      let n = Error("Invariant: AsyncLocalStorage accessed in runtime where it is not available");
      class i {
        disable() {
          throw n;
        }
        getStore() {
        }
        run() {
          throw n;
        }
        exit() {
          throw n;
        }
        enterWith() {
          throw n;
        }
      }
      let s = globalThis.AsyncLocalStorage;
      function a() {
        return s ? new s() : new i();
      }
    } }, (e) => {
      var t = e(e.s = 363);
      (_ENTRIES = "undefined" == typeof _ENTRIES ? {} : _ENTRIES)["middleware_src/middleware"] = t;
    }]);
  }
});

// node_modules/@opennextjs/aws/dist/core/edgeFunctionHandler.js
var edgeFunctionHandler_exports = {};
__export(edgeFunctionHandler_exports, {
  default: () => edgeFunctionHandler
});
async function edgeFunctionHandler(request) {
  const path3 = new URL(request.url).pathname;
  const routes = globalThis._ROUTES;
  const correspondingRoute = routes.find((route) => route.regex.some((r) => new RegExp(r).test(path3)));
  if (!correspondingRoute) {
    throw new Error(`No route found for ${request.url}`);
  }
  const entry = await self._ENTRIES[`middleware_${correspondingRoute.name}`];
  const result = await entry.default({
    page: correspondingRoute.page,
    request: {
      ...request,
      page: {
        name: correspondingRoute.name
      }
    }
  });
  globalThis.__openNextAls.getStore()?.pendingPromiseRunner.add(result.waitUntil);
  const response = result.response;
  return response;
}
var init_edgeFunctionHandler = __esm({
  "node_modules/@opennextjs/aws/dist/core/edgeFunctionHandler.js"() {
    globalThis._ENTRIES = {};
    globalThis.self = globalThis;
    globalThis._ROUTES = [{ "name": "src/middleware", "page": "/", "regex": ["^(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*))(.json)?[\\/#\\?]?$", "^(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/(api|trpc))(.*)(.json)?[\\/#\\?]?$"] }];
    require_prerender_manifest();
    require_edge_runtime_webpack();
    require_middleware();
  }
});

// node_modules/@opennextjs/aws/dist/utils/promise.js
init_logger();
var DetachedPromise = class {
  resolve;
  reject;
  promise;
  constructor() {
    let resolve;
    let reject;
    this.promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.resolve = resolve;
    this.reject = reject;
  }
};
var DetachedPromiseRunner = class {
  promises = [];
  withResolvers() {
    const detachedPromise = new DetachedPromise();
    this.promises.push(detachedPromise);
    return detachedPromise;
  }
  add(promise) {
    const detachedPromise = new DetachedPromise();
    this.promises.push(detachedPromise);
    promise.then(detachedPromise.resolve, detachedPromise.reject);
  }
  async await() {
    debug(`Awaiting ${this.promises.length} detached promises`);
    const results = await Promise.allSettled(this.promises.map((p) => p.promise));
    const rejectedPromises = results.filter((r) => r.status === "rejected");
    rejectedPromises.forEach((r) => {
      error(r.reason);
    });
  }
};
async function awaitAllDetachedPromise() {
  const store = globalThis.__openNextAls.getStore();
  const promisesToAwait = store?.pendingPromiseRunner.await() ?? Promise.resolve();
  if (store?.waitUntil) {
    store.waitUntil(promisesToAwait);
    return;
  }
  await promisesToAwait;
}
function provideNextAfterProvider() {
  const NEXT_REQUEST_CONTEXT_SYMBOL = Symbol.for("@next/request-context");
  const VERCEL_REQUEST_CONTEXT_SYMBOL = Symbol.for("@vercel/request-context");
  const store = globalThis.__openNextAls.getStore();
  const waitUntil = store?.waitUntil ?? ((promise) => store?.pendingPromiseRunner.add(promise));
  const nextAfterContext = {
    get: () => ({
      waitUntil
    })
  };
  globalThis[NEXT_REQUEST_CONTEXT_SYMBOL] = nextAfterContext;
  if (process.env.EMULATE_VERCEL_REQUEST_CONTEXT) {
    globalThis[VERCEL_REQUEST_CONTEXT_SYMBOL] = nextAfterContext;
  }
}
function runWithOpenNextRequestContext({ isISRRevalidation, waitUntil, requestId = Math.random().toString(36) }, fn) {
  return globalThis.__openNextAls.run({
    requestId,
    pendingPromiseRunner: new DetachedPromiseRunner(),
    isISRRevalidation,
    waitUntil,
    writtenTags: /* @__PURE__ */ new Set()
  }, async () => {
    provideNextAfterProvider();
    let result;
    try {
      result = await fn();
    } finally {
      await awaitAllDetachedPromise();
    }
    return result;
  });
}

// node_modules/@opennextjs/aws/dist/adapters/middleware.js
init_logger();

// node_modules/@opennextjs/aws/dist/core/createGenericHandler.js
init_logger();

// node_modules/@opennextjs/aws/dist/core/resolve.js
async function resolveConverter(converter2) {
  if (typeof converter2 === "function") {
    return converter2();
  }
  const m_1 = await Promise.resolve().then(() => (init_edge(), edge_exports));
  return m_1.default;
}
async function resolveWrapper(wrapper) {
  if (typeof wrapper === "function") {
    return wrapper();
  }
  const m_1 = await Promise.resolve().then(() => (init_cloudflare_edge(), cloudflare_edge_exports));
  return m_1.default;
}
async function resolveOriginResolver(originResolver) {
  if (typeof originResolver === "function") {
    return originResolver();
  }
  const m_1 = await Promise.resolve().then(() => (init_pattern_env(), pattern_env_exports));
  return m_1.default;
}
async function resolveAssetResolver(assetResolver) {
  if (typeof assetResolver === "function") {
    return assetResolver();
  }
  const m_1 = await Promise.resolve().then(() => (init_dummy(), dummy_exports));
  return m_1.default;
}
async function resolveProxyRequest(proxyRequest) {
  if (typeof proxyRequest === "function") {
    return proxyRequest();
  }
  const m_1 = await Promise.resolve().then(() => (init_fetch(), fetch_exports));
  return m_1.default;
}

// node_modules/@opennextjs/aws/dist/core/createGenericHandler.js
async function createGenericHandler(handler3) {
  const config = await import("./open-next.config.mjs").then((m) => m.default);
  globalThis.openNextConfig = config;
  const handlerConfig = config[handler3.type];
  const override = handlerConfig && "override" in handlerConfig ? handlerConfig.override : void 0;
  const converter2 = await resolveConverter(override?.converter);
  const { name, wrapper } = await resolveWrapper(override?.wrapper);
  debug("Using wrapper", name);
  return wrapper(handler3.handler, converter2);
}

// node_modules/@opennextjs/aws/dist/core/routing/util.js
import crypto2 from "node:crypto";
import { parse as parseQs, stringify as stringifyQs } from "node:querystring";

// node_modules/@opennextjs/aws/dist/adapters/config/index.js
init_logger();
import path from "node:path";
globalThis.__dirname ??= "";
var NEXT_DIR = path.join(__dirname, ".next");
var OPEN_NEXT_DIR = path.join(__dirname, ".open-next");
debug({ NEXT_DIR, OPEN_NEXT_DIR });
var NextConfig = { "env": {}, "webpack": null, "eslint": { "ignoreDuringBuilds": false }, "typescript": { "ignoreBuildErrors": false, "tsconfigPath": "tsconfig.json" }, "distDir": ".next", "cleanDistDir": true, "assetPrefix": "", "cacheMaxMemorySize": 52428800, "configOrigin": "next.config.mjs", "useFileSystemPublicRoutes": true, "generateEtags": true, "pageExtensions": ["tsx", "ts", "jsx", "js"], "poweredByHeader": true, "compress": true, "analyticsId": "", "images": { "deviceSizes": [640, 750, 828, 1080, 1200, 1920, 2048, 3840], "imageSizes": [16, 32, 48, 64, 96, 128, 256, 384], "path": "/_next/image", "loader": "default", "loaderFile": "", "domains": [], "disableStaticImages": false, "minimumCacheTTL": 60, "formats": ["image/webp"], "dangerouslyAllowSVG": false, "contentSecurityPolicy": "script-src 'none'; frame-src 'none'; sandbox;", "contentDispositionType": "inline", "remotePatterns": [], "unoptimized": false }, "devIndicators": { "buildActivity": true, "buildActivityPosition": "bottom-right" }, "onDemandEntries": { "maxInactiveAge": 6e4, "pagesBufferLength": 5 }, "amp": { "canonicalBase": "" }, "basePath": "", "sassOptions": {}, "trailingSlash": false, "i18n": null, "productionBrowserSourceMaps": false, "optimizeFonts": true, "excludeDefaultMomentLocales": true, "serverRuntimeConfig": {}, "publicRuntimeConfig": {}, "reactProductionProfiling": false, "reactStrictMode": null, "httpAgentOptions": { "keepAlive": true }, "outputFileTracing": true, "staticPageGenerationTimeout": 60, "swcMinify": true, "output": "standalone", "modularizeImports": { "@mui/icons-material": { "transform": "@mui/icons-material/{{member}}" }, "lodash": { "transform": "lodash/{{member}}" } }, "experimental": { "prerenderEarlyExit": false, "serverMinification": true, "serverSourceMaps": false, "linkNoTouchStart": false, "caseSensitiveRoutes": false, "clientRouterFilter": true, "clientRouterFilterRedirects": false, "fetchCacheKeyPrefix": "", "middlewarePrefetch": "flexible", "optimisticClientCache": true, "manualClientBasePath": false, "cpus": 23, "memoryBasedWorkersCount": false, "isrFlushToDisk": true, "workerThreads": false, "optimizeCss": false, "nextScriptWorkers": false, "scrollRestoration": false, "externalDir": false, "disableOptimizedLoading": false, "gzipSize": true, "craCompat": false, "esmExternals": true, "fullySpecified": false, "outputFileTracingRoot": "C:\\Users\\pedro\\OneDrive\\Desportos N\xE1uticos de Alvor\\CRM", "swcTraceProfiling": false, "forceSwcTransforms": false, "largePageDataBytes": 128e3, "adjustFontFallbacks": false, "adjustFontFallbacksWithSizeAdjust": false, "typedRoutes": false, "instrumentationHook": false, "bundlePagesExternals": false, "parallelServerCompiles": false, "parallelServerBuildTraces": false, "ppr": false, "missingSuspenseWithCSRBailout": true, "optimizeServerReact": true, "useEarlyImport": false, "staleTimes": { "dynamic": 30, "static": 300 }, "optimizePackageImports": ["lucide-react", "date-fns", "lodash-es", "ramda", "antd", "react-bootstrap", "ahooks", "@ant-design/icons", "@headlessui/react", "@headlessui-float/react", "@heroicons/react/20/solid", "@heroicons/react/24/solid", "@heroicons/react/24/outline", "@visx/visx", "@tremor/react", "rxjs", "@mui/material", "@mui/icons-material", "recharts", "react-use", "@material-ui/core", "@material-ui/icons", "@tabler/icons-react", "mui-core", "react-icons/ai", "react-icons/bi", "react-icons/bs", "react-icons/cg", "react-icons/ci", "react-icons/di", "react-icons/fa", "react-icons/fa6", "react-icons/fc", "react-icons/fi", "react-icons/gi", "react-icons/go", "react-icons/gr", "react-icons/hi", "react-icons/hi2", "react-icons/im", "react-icons/io", "react-icons/io5", "react-icons/lia", "react-icons/lib", "react-icons/lu", "react-icons/md", "react-icons/pi", "react-icons/ri", "react-icons/rx", "react-icons/si", "react-icons/sl", "react-icons/tb", "react-icons/tfi", "react-icons/ti", "react-icons/vsc", "react-icons/wi"], "trustHostHeader": false, "isExperimentalCompile": false }, "configFileName": "next.config.mjs" };
var BuildId = "v0LkD1S_Jbvev13e4gJjf";
var RoutesManifest = { "basePath": "", "rewrites": { "beforeFiles": [], "afterFiles": [], "fallback": [] }, "redirects": [{ "source": "/:path+/", "destination": "/:path+", "internal": true, "statusCode": 308, "regex": "^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))/$" }], "routes": { "static": [{ "page": "/", "regex": "^/(?:/)?$", "routeKeys": {}, "namedRegex": "^/(?:/)?$" }, { "page": "/_not-found", "regex": "^/_not\\-found(?:/)?$", "routeKeys": {}, "namedRegex": "^/_not\\-found(?:/)?$" }], "dynamic": [{ "page": "/sign-in/[[...sign-in]]", "regex": "^/sign\\-in(?:/(.+?))?(?:/)?$", "routeKeys": { "nxtPsignin": "nxtPsign-in" }, "namedRegex": "^/sign\\-in(?:/(?<nxtPsignin>.+?))?(?:/)?$" }, { "page": "/sign-up/[[...sign-up]]", "regex": "^/sign\\-up(?:/(.+?))?(?:/)?$", "routeKeys": { "nxtPsignup": "nxtPsign-up" }, "namedRegex": "^/sign\\-up(?:/(?<nxtPsignup>.+?))?(?:/)?$" }], "data": { "static": [], "dynamic": [] } }, "locales": [] };
var ConfigHeaders = [];
var PrerenderManifest = { "version": 4, "routes": { "/api/bookings": { "initialHeaders": { "content-type": "application/json", "x-next-cache-tags": "_N_T_/layout,_N_T_/api/layout,_N_T_/api/bookings/layout,_N_T_/api/bookings/route,_N_T_/api/bookings" }, "experimentalBypassFor": [{ "type": "header", "key": "Next-Action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/api/bookings", "dataRoute": null }, "/": { "experimentalBypassFor": [{ "type": "header", "key": "Next-Action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/", "dataRoute": "/index.rsc" } }, "dynamicRoutes": {}, "notFoundRoutes": [], "preview": { "previewModeId": "d3bf2f2008f9b7d166fa94e5490aa2b7", "previewModeSigningKey": "8afaca2a642ff38f052d5b4a3343dd63f8132f01103fa7f1b313569c5657e2e7", "previewModeEncryptionKey": "a9688192d63fac2107c9a61303f7169305bd673a59b2301da3261ab1a9f4895d" } };
var MiddlewareManifest = { "version": 3, "middleware": { "/": { "files": ["prerender-manifest.js", "server/edge-runtime-webpack.js", "server/src/middleware.js"], "name": "src/middleware", "page": "/", "matchers": [{ "regexp": "^(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*))(.json)?[\\/#\\?]?$", "originalSource": "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)" }, { "regexp": "^(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/(api|trpc))(.*)(.json)?[\\/#\\?]?$", "originalSource": "/(api|trpc)(.*)" }], "wasm": [], "assets": [], "environments": { "previewModeId": "d3bf2f2008f9b7d166fa94e5490aa2b7", "previewModeSigningKey": "8afaca2a642ff38f052d5b4a3343dd63f8132f01103fa7f1b313569c5657e2e7", "previewModeEncryptionKey": "a9688192d63fac2107c9a61303f7169305bd673a59b2301da3261ab1a9f4895d" } } }, "functions": {}, "sortedMiddleware": ["/"] };
var AppPathRoutesManifest = { "/_not-found/page": "/_not-found", "/api/bookings/create/route": "/api/bookings/create", "/sign-in/[[...sign-in]]/page": "/sign-in/[[...sign-in]]", "/api/bookings/route": "/api/bookings", "/api/shopify/sync/route": "/api/shopify/sync", "/sign-up/[[...sign-up]]/page": "/sign-up/[[...sign-up]]", "/page": "/" };
var FunctionsConfigManifest = { "version": 1, "functions": {} };
var PagesManifest = { "/_app": "pages/_app.js", "/_error": "pages/_error.js", "/_document": "pages/_document.js", "/404": "pages/404.html" };
process.env.NEXT_BUILD_ID = BuildId;
process.env.NEXT_PREVIEW_MODE_ID = PrerenderManifest?.preview?.previewModeId;

// node_modules/@opennextjs/aws/dist/http/openNextResponse.js
init_logger();
init_util();
import { Transform } from "node:stream";

// node_modules/@opennextjs/aws/dist/core/routing/util.js
init_util();
init_logger();
import { ReadableStream as ReadableStream2 } from "node:stream/web";

// node_modules/@opennextjs/aws/dist/utils/binary.js
var commonBinaryMimeTypes = /* @__PURE__ */ new Set([
  "application/octet-stream",
  // Docs
  "application/epub+zip",
  "application/msword",
  "application/pdf",
  "application/rtf",
  "application/vnd.amazon.ebook",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Fonts
  "font/otf",
  "font/woff",
  "font/woff2",
  // Images
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/vnd.microsoft.icon",
  "image/webp",
  // Audio
  "audio/3gpp",
  "audio/aac",
  "audio/basic",
  "audio/flac",
  "audio/mpeg",
  "audio/ogg",
  "audio/wavaudio/webm",
  "audio/x-aiff",
  "audio/x-midi",
  "audio/x-wav",
  // Video
  "video/3gpp",
  "video/mp2t",
  "video/mpeg",
  "video/ogg",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  // Archives
  "application/java-archive",
  "application/vnd.apple.installer+xml",
  "application/x-7z-compressed",
  "application/x-apple-diskimage",
  "application/x-bzip",
  "application/x-bzip2",
  "application/x-gzip",
  "application/x-java-archive",
  "application/x-rar-compressed",
  "application/x-tar",
  "application/x-zip",
  "application/zip",
  // Serialized data
  "application/x-protobuf"
]);
function isBinaryContentType(contentType) {
  if (!contentType)
    return false;
  const value = contentType.split(";")[0];
  return commonBinaryMimeTypes.has(value);
}

// node_modules/@opennextjs/aws/dist/core/routing/i18n/index.js
init_stream();
init_logger();

// node_modules/@opennextjs/aws/dist/core/routing/i18n/accept-header.js
function parse(raw, preferences, options) {
  const lowers = /* @__PURE__ */ new Map();
  const header = raw.replace(/[ \t]/g, "");
  if (preferences) {
    let pos = 0;
    for (const preference of preferences) {
      const lower = preference.toLowerCase();
      lowers.set(lower, { orig: preference, pos: pos++ });
      if (options.prefixMatch) {
        const parts2 = lower.split("-");
        while (parts2.pop(), parts2.length > 0) {
          const joined = parts2.join("-");
          if (!lowers.has(joined)) {
            lowers.set(joined, { orig: preference, pos: pos++ });
          }
        }
      }
    }
  }
  const parts = header.split(",");
  const selections = [];
  const map = /* @__PURE__ */ new Set();
  for (let i = 0; i < parts.length; ++i) {
    const part = parts[i];
    if (!part) {
      continue;
    }
    const params = part.split(";");
    if (params.length > 2) {
      throw new Error(`Invalid ${options.type} header`);
    }
    const token = params[0].toLowerCase();
    if (!token) {
      throw new Error(`Invalid ${options.type} header`);
    }
    const selection = { token, pos: i, q: 1 };
    if (preferences && lowers.has(token)) {
      selection.pref = lowers.get(token).pos;
    }
    map.add(selection.token);
    if (params.length === 2) {
      const q = params[1];
      const [key, value] = q.split("=");
      if (!value || key !== "q" && key !== "Q") {
        throw new Error(`Invalid ${options.type} header`);
      }
      const score = Number.parseFloat(value);
      if (score === 0) {
        continue;
      }
      if (Number.isFinite(score) && score <= 1 && score >= 1e-3) {
        selection.q = score;
      }
    }
    selections.push(selection);
  }
  selections.sort((a, b) => {
    if (b.q !== a.q) {
      return b.q - a.q;
    }
    if (b.pref !== a.pref) {
      if (a.pref === void 0) {
        return 1;
      }
      if (b.pref === void 0) {
        return -1;
      }
      return a.pref - b.pref;
    }
    return a.pos - b.pos;
  });
  const values = selections.map((selection) => selection.token);
  if (!preferences || !preferences.length) {
    return values;
  }
  const preferred = [];
  for (const selection of values) {
    if (selection === "*") {
      for (const [preference, value] of lowers) {
        if (!map.has(preference)) {
          preferred.push(value.orig);
        }
      }
    } else {
      const lower = selection.toLowerCase();
      if (lowers.has(lower)) {
        preferred.push(lowers.get(lower).orig);
      }
    }
  }
  return preferred;
}
function acceptLanguage(header = "", preferences) {
  return parse(header, preferences, {
    type: "accept-language",
    prefixMatch: true
  })[0] || void 0;
}

// node_modules/@opennextjs/aws/dist/core/routing/i18n/index.js
function isLocalizedPath(path3) {
  return NextConfig.i18n?.locales.includes(path3.split("/")[1].toLowerCase()) ?? false;
}
function getLocaleFromCookie(cookies) {
  const i18n = NextConfig.i18n;
  const nextLocale = cookies.NEXT_LOCALE?.toLowerCase();
  return nextLocale ? i18n?.locales.find((locale) => nextLocale === locale.toLowerCase()) : void 0;
}
function detectDomainLocale({ hostname, detectedLocale }) {
  const i18n = NextConfig.i18n;
  const domains = i18n?.domains;
  if (!domains) {
    return;
  }
  const lowercasedLocale = detectedLocale?.toLowerCase();
  for (const domain of domains) {
    const domainHostname = domain.domain.split(":", 1)[0].toLowerCase();
    if (hostname === domainHostname || lowercasedLocale === domain.defaultLocale.toLowerCase() || domain.locales?.some((locale) => lowercasedLocale === locale.toLowerCase())) {
      return domain;
    }
  }
}
function detectLocale(internalEvent, i18n) {
  const domainLocale = detectDomainLocale({
    hostname: internalEvent.headers.host
  });
  if (i18n.localeDetection === false) {
    return domainLocale?.defaultLocale ?? i18n.defaultLocale;
  }
  const cookiesLocale = getLocaleFromCookie(internalEvent.cookies);
  const preferredLocale = acceptLanguage(internalEvent.headers["accept-language"], i18n?.locales);
  debug({
    cookiesLocale,
    preferredLocale,
    defaultLocale: i18n.defaultLocale,
    domainLocale
  });
  return domainLocale?.defaultLocale ?? cookiesLocale ?? preferredLocale ?? i18n.defaultLocale;
}
function localizePath(internalEvent) {
  const i18n = NextConfig.i18n;
  if (!i18n) {
    return internalEvent.rawPath;
  }
  if (isLocalizedPath(internalEvent.rawPath)) {
    return internalEvent.rawPath;
  }
  const detectedLocale = detectLocale(internalEvent, i18n);
  return `/${detectedLocale}${internalEvent.rawPath}`;
}
function handleLocaleRedirect(internalEvent) {
  const i18n = NextConfig.i18n;
  if (!i18n || i18n.localeDetection === false || internalEvent.rawPath !== "/") {
    return false;
  }
  const preferredLocale = acceptLanguage(internalEvent.headers["accept-language"], i18n?.locales);
  const detectedLocale = detectLocale(internalEvent, i18n);
  const domainLocale = detectDomainLocale({
    hostname: internalEvent.headers.host
  });
  const preferredDomain = detectDomainLocale({
    detectedLocale: preferredLocale
  });
  if (domainLocale && preferredDomain) {
    const isPDomain = preferredDomain.domain === domainLocale.domain;
    const isPLocale = preferredDomain.defaultLocale === preferredLocale;
    if (!isPDomain || !isPLocale) {
      const scheme = `http${preferredDomain.http ? "" : "s"}`;
      const rlocale = isPLocale ? "" : preferredLocale;
      return {
        type: "core",
        statusCode: 307,
        headers: {
          Location: `${scheme}://${preferredDomain.domain}/${rlocale}`
        },
        body: emptyReadableStream(),
        isBase64Encoded: false
      };
    }
  }
  const defaultLocale = domainLocale?.defaultLocale ?? i18n.defaultLocale;
  if (detectedLocale.toLowerCase() !== defaultLocale.toLowerCase()) {
    return {
      type: "core",
      statusCode: 307,
      headers: {
        Location: constructNextUrl(internalEvent.url, `/${detectedLocale}`)
      },
      body: emptyReadableStream(),
      isBase64Encoded: false
    };
  }
  return false;
}

// node_modules/@opennextjs/aws/dist/core/routing/queue.js
function generateShardId(rawPath, maxConcurrency, prefix) {
  let a = cyrb128(rawPath);
  let t = a += 1831565813;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  const randomFloat = ((t ^ t >>> 14) >>> 0) / 4294967296;
  const randomInt = Math.floor(randomFloat * maxConcurrency);
  return `${prefix}-${randomInt}`;
}
function generateMessageGroupId(rawPath) {
  const maxConcurrency = Number.parseInt(process.env.MAX_REVALIDATE_CONCURRENCY ?? "10");
  return generateShardId(rawPath, maxConcurrency, "revalidate");
}
function cyrb128(str) {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ h1 >>> 18, 597399067);
  h2 = Math.imul(h4 ^ h2 >>> 22, 2869860233);
  h3 = Math.imul(h1 ^ h3 >>> 17, 951274213);
  h4 = Math.imul(h2 ^ h4 >>> 19, 2716044179);
  h1 ^= h2 ^ h3 ^ h4, h2 ^= h1, h3 ^= h1, h4 ^= h1;
  return h1 >>> 0;
}

// node_modules/@opennextjs/aws/dist/core/routing/util.js
function isExternal(url, host) {
  if (!url)
    return false;
  const pattern = /^https?:\/\//;
  if (!pattern.test(url))
    return false;
  if (host) {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.host !== host;
    } catch {
      return !url.includes(host);
    }
  }
  return true;
}
function convertFromQueryString(query) {
  if (query === "")
    return {};
  const queryParts = query.split("&");
  return getQueryFromIterator(queryParts.map((p) => {
    const [key, value] = p.split("=");
    return [key, value];
  }));
}
function getUrlParts(url, isExternal2) {
  if (!isExternal2) {
    const regex2 = /\/([^?]*)\??(.*)/;
    const match3 = url.match(regex2);
    return {
      hostname: "",
      pathname: match3?.[1] ? `/${match3[1]}` : url,
      protocol: "",
      queryString: match3?.[2] ?? ""
    };
  }
  const regex = /^(https?:)\/\/?([^\/\s]+)(\/[^?]*)?(\?.*)?/;
  const match2 = url.match(regex);
  if (!match2) {
    throw new Error(`Invalid external URL: ${url}`);
  }
  return {
    protocol: match2[1] ?? "https:",
    hostname: match2[2],
    pathname: match2[3] ?? "",
    queryString: match2[4]?.slice(1) ?? ""
  };
}
function constructNextUrl(baseUrl, path3) {
  const nextBasePath = NextConfig.basePath ?? "";
  const url = new URL(`${nextBasePath}${path3}`, baseUrl);
  return url.href;
}
function convertToQueryString(query) {
  const queryStrings = [];
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => queryStrings.push(`${key}=${entry}`));
    } else {
      queryStrings.push(`${key}=${value}`);
    }
  });
  return queryStrings.length > 0 ? `?${queryStrings.join("&")}` : "";
}
function getMiddlewareMatch(middlewareManifest2, functionsManifest) {
  if (functionsManifest?.functions?.["/_middleware"]) {
    return functionsManifest.functions["/_middleware"].matchers?.map(({ regexp }) => new RegExp(regexp)) ?? [/.*/];
  }
  const rootMiddleware = middlewareManifest2.middleware["/"];
  if (!rootMiddleware?.matchers)
    return [];
  return rootMiddleware.matchers.map(({ regexp }) => new RegExp(regexp));
}
function escapeRegex(str, { isPath } = {}) {
  const result = str.replaceAll("(.)", "_\xB51_").replaceAll("(..)", "_\xB52_").replaceAll("(...)", "_\xB53_");
  return isPath ? result : result.replaceAll("+", "_\xB54_");
}
function unescapeRegex(str) {
  return str.replaceAll("_\xB51_", "(.)").replaceAll("_\xB52_", "(..)").replaceAll("_\xB53_", "(...)").replaceAll("_\xB54_", "+");
}
function convertBodyToReadableStream(method, body) {
  if (method === "GET" || method === "HEAD")
    return void 0;
  if (!body)
    return void 0;
  return new ReadableStream2({
    start(controller) {
      controller.enqueue(body);
      controller.close();
    }
  });
}
var CommonHeaders;
(function(CommonHeaders2) {
  CommonHeaders2["CACHE_CONTROL"] = "cache-control";
  CommonHeaders2["NEXT_CACHE"] = "x-nextjs-cache";
})(CommonHeaders || (CommonHeaders = {}));
function normalizeLocationHeader(location, baseUrl, encodeQuery = false) {
  if (!URL.canParse(location)) {
    return location;
  }
  const locationURL = new URL(location);
  const origin = new URL(baseUrl).origin;
  let search = locationURL.search;
  if (encodeQuery && search) {
    search = `?${stringifyQs(parseQs(search.slice(1)))}`;
  }
  const href = `${locationURL.origin}${locationURL.pathname}${search}${locationURL.hash}`;
  if (locationURL.origin === origin) {
    return href.slice(origin.length);
  }
  return href;
}

// node_modules/@opennextjs/aws/dist/core/routingHandler.js
init_logger();

// node_modules/@opennextjs/aws/dist/core/routing/cacheInterceptor.js
import { createHash } from "node:crypto";
init_stream();

// node_modules/@opennextjs/aws/dist/utils/cache.js
init_logger();
async function hasBeenRevalidated(key, tags, cacheEntry) {
  if (globalThis.openNextConfig.dangerous?.disableTagCache) {
    return false;
  }
  const value = cacheEntry.value;
  if (!value) {
    return true;
  }
  if ("type" in cacheEntry && cacheEntry.type === "page") {
    return false;
  }
  const lastModified = cacheEntry.lastModified ?? Date.now();
  if (globalThis.tagCache.mode === "nextMode") {
    return tags.length === 0 ? false : await globalThis.tagCache.hasBeenRevalidated(tags, lastModified);
  }
  const _lastModified = await globalThis.tagCache.getLastModified(key, lastModified);
  return _lastModified === -1;
}
function getTagsFromValue(value) {
  if (!value) {
    return [];
  }
  try {
    const cacheTags = value.meta?.headers?.["x-next-cache-tags"]?.split(",") ?? [];
    delete value.meta?.headers?.["x-next-cache-tags"];
    return cacheTags;
  } catch (e) {
    return [];
  }
}

// node_modules/@opennextjs/aws/dist/core/routing/cacheInterceptor.js
init_logger();
var CACHE_ONE_YEAR = 60 * 60 * 24 * 365;
var CACHE_ONE_MONTH = 60 * 60 * 24 * 30;
var VARY_HEADER = "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url";
var NEXT_SEGMENT_PREFETCH_HEADER = "next-router-segment-prefetch";
var NEXT_PRERENDER_HEADER = "x-nextjs-prerender";
var NEXT_POSTPONED_HEADER = "x-nextjs-postponed";
async function computeCacheControl(path3, body, host, revalidate, lastModified) {
  let finalRevalidate = CACHE_ONE_YEAR;
  const existingRoute = Object.entries(PrerenderManifest?.routes ?? {}).find((p) => p[0] === path3)?.[1];
  if (revalidate === void 0 && existingRoute) {
    finalRevalidate = existingRoute.initialRevalidateSeconds === false ? CACHE_ONE_YEAR : existingRoute.initialRevalidateSeconds;
  } else if (revalidate !== void 0) {
    finalRevalidate = revalidate === false ? CACHE_ONE_YEAR : revalidate;
  }
  const age = Math.round((Date.now() - (lastModified ?? 0)) / 1e3);
  const hash = (str) => createHash("md5").update(str).digest("hex");
  const etag = hash(body);
  if (revalidate === 0) {
    return {
      "cache-control": "private, no-cache, no-store, max-age=0, must-revalidate",
      "x-opennext-cache": "ERROR",
      etag
    };
  }
  if (finalRevalidate !== CACHE_ONE_YEAR) {
    const sMaxAge = Math.max(finalRevalidate - age, 1);
    debug("sMaxAge", {
      finalRevalidate,
      age,
      lastModified,
      revalidate
    });
    const isStale = sMaxAge === 1;
    if (isStale) {
      let url = NextConfig.trailingSlash ? `${path3}/` : path3;
      if (NextConfig.basePath) {
        url = `${NextConfig.basePath}${url}`;
      }
      await globalThis.queue.send({
        MessageBody: {
          host,
          url,
          eTag: etag,
          lastModified: lastModified ?? Date.now()
        },
        MessageDeduplicationId: hash(`${path3}-${lastModified}-${etag}`),
        MessageGroupId: generateMessageGroupId(path3)
      });
    }
    return {
      "cache-control": `s-maxage=${sMaxAge}, stale-while-revalidate=${CACHE_ONE_MONTH}`,
      "x-opennext-cache": isStale ? "STALE" : "HIT",
      etag
    };
  }
  return {
    "cache-control": `s-maxage=${CACHE_ONE_YEAR}, stale-while-revalidate=${CACHE_ONE_MONTH}`,
    "x-opennext-cache": "HIT",
    etag
  };
}
function getBodyForAppRouter(event, cachedValue) {
  if (cachedValue.type !== "app") {
    throw new Error("getBodyForAppRouter called with non-app cache value");
  }
  try {
    const segmentHeader = `${event.headers[NEXT_SEGMENT_PREFETCH_HEADER]}`;
    const isSegmentResponse = Boolean(segmentHeader) && segmentHeader in (cachedValue.segmentData || {});
    const body = isSegmentResponse ? cachedValue.segmentData[segmentHeader] : cachedValue.rsc;
    return {
      body,
      additionalHeaders: isSegmentResponse ? { [NEXT_PRERENDER_HEADER]: "1", [NEXT_POSTPONED_HEADER]: "2" } : {}
    };
  } catch (e) {
    error("Error while getting body for app router from cache:", e);
    return { body: cachedValue.rsc, additionalHeaders: {} };
  }
}
async function generateResult(event, localizedPath, cachedValue, lastModified) {
  debug("Returning result from experimental cache");
  let body = "";
  let type = "application/octet-stream";
  let isDataRequest = false;
  let additionalHeaders = {};
  if (cachedValue.type === "app") {
    isDataRequest = Boolean(event.headers.rsc);
    if (isDataRequest) {
      const { body: appRouterBody, additionalHeaders: appHeaders } = getBodyForAppRouter(event, cachedValue);
      body = appRouterBody;
      additionalHeaders = appHeaders;
    } else {
      body = cachedValue.html;
    }
    type = isDataRequest ? "text/x-component" : "text/html; charset=utf-8";
  } else if (cachedValue.type === "page") {
    isDataRequest = Boolean(event.query.__nextDataReq);
    body = isDataRequest ? JSON.stringify(cachedValue.json) : cachedValue.html;
    type = isDataRequest ? "application/json" : "text/html; charset=utf-8";
  } else {
    throw new Error("generateResult called with unsupported cache value type, only 'app' and 'page' are supported");
  }
  const cacheControl = await computeCacheControl(localizedPath, body, event.headers.host, cachedValue.revalidate, lastModified);
  return {
    type: "core",
    // Sometimes other status codes can be cached, like 404. For these cases, we should return the correct status code
    // Also set the status code to the rewriteStatusCode if defined
    // This can happen in handleMiddleware in routingHandler.
    // `NextResponse.rewrite(url, { status: xxx})
    // The rewrite status code should take precedence over the cached one
    statusCode: event.rewriteStatusCode ?? cachedValue.meta?.status ?? 200,
    body: toReadableStream(body, false),
    isBase64Encoded: false,
    headers: {
      ...cacheControl,
      "content-type": type,
      ...cachedValue.meta?.headers,
      vary: VARY_HEADER,
      ...additionalHeaders
    }
  };
}
function escapePathDelimiters(segment, escapeEncoded) {
  return segment.replace(new RegExp(`([/#?]${escapeEncoded ? "|%(2f|23|3f|5c)" : ""})`, "gi"), (char) => encodeURIComponent(char));
}
function decodePathParams(pathname) {
  return pathname.split("/").map((segment) => {
    try {
      return escapePathDelimiters(decodeURIComponent(segment), true);
    } catch (e) {
      return segment;
    }
  }).join("/");
}
async function cacheInterceptor(event) {
  if (Boolean(event.headers["next-action"]) || Boolean(event.headers["x-prerender-revalidate"]))
    return event;
  const cookies = event.headers.cookie || "";
  const hasPreviewData = cookies.includes("__prerender_bypass") || cookies.includes("__next_preview_data");
  if (hasPreviewData) {
    debug("Preview mode detected, passing through to handler");
    return event;
  }
  let localizedPath = localizePath(event);
  if (NextConfig.basePath) {
    localizedPath = localizedPath.replace(NextConfig.basePath, "");
  }
  localizedPath = localizedPath.replace(/\/$/, "");
  localizedPath = decodePathParams(localizedPath);
  debug("Checking cache for", localizedPath, PrerenderManifest);
  const isISR = Object.keys(PrerenderManifest?.routes ?? {}).includes(localizedPath ?? "/") || Object.values(PrerenderManifest?.dynamicRoutes ?? {}).some((dr) => new RegExp(dr.routeRegex).test(localizedPath));
  debug("isISR", isISR);
  if (isISR) {
    try {
      const cachedData = await globalThis.incrementalCache.get(localizedPath ?? "/index");
      debug("cached data in interceptor", cachedData);
      if (!cachedData?.value) {
        return event;
      }
      if (cachedData.value?.type === "app" || cachedData.value?.type === "route") {
        const tags = getTagsFromValue(cachedData.value);
        const _hasBeenRevalidated = cachedData.shouldBypassTagCache ? false : await hasBeenRevalidated(localizedPath, tags, cachedData);
        if (_hasBeenRevalidated) {
          return event;
        }
      }
      const host = event.headers.host;
      switch (cachedData?.value?.type) {
        case "app":
        case "page":
          return generateResult(event, localizedPath, cachedData.value, cachedData.lastModified);
        case "redirect": {
          const cacheControl = await computeCacheControl(localizedPath, "", host, cachedData.value.revalidate, cachedData.lastModified);
          return {
            type: "core",
            statusCode: cachedData.value.meta?.status ?? 307,
            body: emptyReadableStream(),
            headers: {
              ...cachedData.value.meta?.headers ?? {},
              ...cacheControl
            },
            isBase64Encoded: false
          };
        }
        case "route": {
          const cacheControl = await computeCacheControl(localizedPath, cachedData.value.body, host, cachedData.value.revalidate, cachedData.lastModified);
          const isBinary = isBinaryContentType(String(cachedData.value.meta?.headers?.["content-type"]));
          return {
            type: "core",
            statusCode: event.rewriteStatusCode ?? cachedData.value.meta?.status ?? 200,
            body: toReadableStream(cachedData.value.body, isBinary),
            headers: {
              ...cacheControl,
              ...cachedData.value.meta?.headers,
              vary: VARY_HEADER
            },
            isBase64Encoded: isBinary
          };
        }
        default:
          return event;
      }
    } catch (e) {
      debug("Error while fetching cache", e);
      return event;
    }
  }
  return event;
}

// node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
function parse2(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path3 = "";
  var tryConsume = function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  };
  var mustConsume = function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  };
  var consumeText = function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  };
  var isSafe = function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  };
  var safePattern = function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  };
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path3 += prefix;
        prefix = "";
      }
      if (path3) {
        result.push(path3);
        path3 = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path3 += value;
      continue;
    }
    if (path3) {
      result.push(path3);
      path3 = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
function compile(str, options) {
  return tokensToFunction(parse2(str, options), options);
}
function tokensToFunction(tokens, options) {
  if (options === void 0) {
    options = {};
  }
  var reFlags = flags(options);
  var _a = options.encode, encode = _a === void 0 ? function(x) {
    return x;
  } : _a, _b = options.validate, validate = _b === void 0 ? true : _b;
  var matches = tokens.map(function(token) {
    if (typeof token === "object") {
      return new RegExp("^(?:".concat(token.pattern, ")$"), reFlags);
    }
  });
  return function(data) {
    var path3 = "";
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      if (typeof token === "string") {
        path3 += token;
        continue;
      }
      var value = data ? data[token.name] : void 0;
      var optional = token.modifier === "?" || token.modifier === "*";
      var repeat = token.modifier === "*" || token.modifier === "+";
      if (Array.isArray(value)) {
        if (!repeat) {
          throw new TypeError('Expected "'.concat(token.name, '" to not repeat, but got an array'));
        }
        if (value.length === 0) {
          if (optional)
            continue;
          throw new TypeError('Expected "'.concat(token.name, '" to not be empty'));
        }
        for (var j = 0; j < value.length; j++) {
          var segment = encode(value[j], token);
          if (validate && !matches[i].test(segment)) {
            throw new TypeError('Expected all "'.concat(token.name, '" to match "').concat(token.pattern, '", but got "').concat(segment, '"'));
          }
          path3 += token.prefix + segment + token.suffix;
        }
        continue;
      }
      if (typeof value === "string" || typeof value === "number") {
        var segment = encode(String(value), token);
        if (validate && !matches[i].test(segment)) {
          throw new TypeError('Expected "'.concat(token.name, '" to match "').concat(token.pattern, '", but got "').concat(segment, '"'));
        }
        path3 += token.prefix + segment + token.suffix;
        continue;
      }
      if (optional)
        continue;
      var typeOfMessage = repeat ? "an array" : "a string";
      throw new TypeError('Expected "'.concat(token.name, '" to be ').concat(typeOfMessage));
    }
    return path3;
  };
}
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path3 = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    };
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path: path3, index, params };
  };
}
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
function regexpToRegexp(path3, keys) {
  if (!keys)
    return path3;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path3.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path3.source);
  }
  return path3;
}
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path3) {
    return pathToRegexp(path3, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
function stringToRegexp(path3, keys, options) {
  return tokensToRegexp(parse2(path3, options), keys, options);
}
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
function pathToRegexp(path3, keys, options) {
  if (path3 instanceof RegExp)
    return regexpToRegexp(path3, keys);
  if (Array.isArray(path3))
    return arrayToRegexp(path3, keys, options);
  return stringToRegexp(path3, keys, options);
}

// node_modules/@opennextjs/aws/dist/utils/normalize-path.js
import path2 from "node:path";
function normalizeRepeatedSlashes(url) {
  const urlNoQuery = url.host + url.pathname;
  return `${url.protocol}//${urlNoQuery.replace(/\\/g, "/").replace(/\/\/+/g, "/")}${url.search}`;
}

// node_modules/@opennextjs/aws/dist/core/routing/matcher.js
init_stream();
init_logger();

// node_modules/@opennextjs/aws/dist/core/routing/routeMatcher.js
var optionalLocalePrefixRegex = `^/(?:${RoutesManifest.locales.map((locale) => `${locale}/?`).join("|")})?`;
var optionalBasepathPrefixRegex = RoutesManifest.basePath ? `^${RoutesManifest.basePath}/?` : "^/";
var optionalPrefix = optionalLocalePrefixRegex.replace("^/", optionalBasepathPrefixRegex);
function routeMatcher(routeDefinitions) {
  const regexp = routeDefinitions.map((route) => ({
    page: route.page,
    regexp: new RegExp(route.regex.replace("^/", optionalPrefix))
  }));
  const appPathsSet = /* @__PURE__ */ new Set();
  const routePathsSet = /* @__PURE__ */ new Set();
  for (const [k, v] of Object.entries(AppPathRoutesManifest)) {
    if (k.endsWith("page")) {
      appPathsSet.add(v);
    } else if (k.endsWith("route")) {
      routePathsSet.add(v);
    }
  }
  return function matchRoute(path3) {
    const foundRoutes = regexp.filter((route) => route.regexp.test(path3));
    return foundRoutes.map((foundRoute) => {
      let routeType = "page";
      if (appPathsSet.has(foundRoute.page)) {
        routeType = "app";
      } else if (routePathsSet.has(foundRoute.page)) {
        routeType = "route";
      }
      return {
        route: foundRoute.page,
        type: routeType
      };
    });
  };
}
var staticRouteMatcher = routeMatcher([
  ...RoutesManifest.routes.static,
  ...getStaticAPIRoutes()
]);
var dynamicRouteMatcher = routeMatcher(RoutesManifest.routes.dynamic);
function getStaticAPIRoutes() {
  const createRouteDefinition = (route) => ({
    page: route,
    regex: `^${route}(?:/)?$`
  });
  const dynamicRoutePages = new Set(RoutesManifest.routes.dynamic.map(({ page }) => page));
  const pagesStaticAPIRoutes = Object.keys(PagesManifest).filter((route) => route.startsWith("/api/") && !dynamicRoutePages.has(route)).map(createRouteDefinition);
  const appPathsStaticAPIRoutes = Object.values(AppPathRoutesManifest).filter((route) => (route.startsWith("/api/") || route === "/api") && !dynamicRoutePages.has(route)).map(createRouteDefinition);
  return [...pagesStaticAPIRoutes, ...appPathsStaticAPIRoutes];
}

// node_modules/@opennextjs/aws/dist/core/routing/matcher.js
var routeHasMatcher = (headers, cookies, query) => (redirect) => {
  switch (redirect.type) {
    case "header":
      return !!headers?.[redirect.key.toLowerCase()] && new RegExp(redirect.value ?? "").test(headers[redirect.key.toLowerCase()] ?? "");
    case "cookie":
      return !!cookies?.[redirect.key] && new RegExp(redirect.value ?? "").test(cookies[redirect.key] ?? "");
    case "query":
      return query[redirect.key] && Array.isArray(redirect.value) ? redirect.value.reduce((prev, current) => prev || new RegExp(current).test(query[redirect.key]), false) : new RegExp(redirect.value ?? "").test(query[redirect.key] ?? "");
    case "host":
      return headers?.host !== "" && new RegExp(redirect.value ?? "").test(headers.host);
    default:
      return false;
  }
};
function checkHas(matcher, has, inverted = false) {
  return has ? has.reduce((acc, cur) => {
    if (acc === false)
      return false;
    return inverted ? !matcher(cur) : matcher(cur);
  }, true) : true;
}
var getParamsFromSource = (source) => (value) => {
  debug("value", value);
  const _match = source(value);
  return _match ? _match.params : {};
};
var computeParamHas = (headers, cookies, query) => (has) => {
  if (!has.value)
    return {};
  const matcher = new RegExp(`^${has.value}$`);
  const fromSource = (value) => {
    const matches = value.match(matcher);
    return matches?.groups ?? {};
  };
  switch (has.type) {
    case "header":
      return fromSource(headers[has.key.toLowerCase()] ?? "");
    case "cookie":
      return fromSource(cookies[has.key] ?? "");
    case "query":
      return Array.isArray(query[has.key]) ? fromSource(query[has.key].join(",")) : fromSource(query[has.key] ?? "");
    case "host":
      return fromSource(headers.host ?? "");
  }
};
function convertMatch(match2, toDestination, destination) {
  if (!match2) {
    return destination;
  }
  const { params } = match2;
  const isUsingParams = Object.keys(params).length > 0;
  return isUsingParams ? toDestination(params) : destination;
}
function getNextConfigHeaders(event, configHeaders) {
  if (!configHeaders) {
    return {};
  }
  const matcher = routeHasMatcher(event.headers, event.cookies, event.query);
  const requestHeaders = {};
  const localizedRawPath = localizePath(event);
  for (const { headers, has, missing, regex, source, locale } of configHeaders) {
    const path3 = locale === false ? event.rawPath : localizedRawPath;
    if (new RegExp(regex).test(path3) && checkHas(matcher, has) && checkHas(matcher, missing, true)) {
      const fromSource = match(source);
      const _match = fromSource(path3);
      headers.forEach((h) => {
        try {
          const key = convertMatch(_match, compile(h.key), h.key);
          const value = convertMatch(_match, compile(h.value), h.value);
          requestHeaders[key] = value;
        } catch {
          debug(`Error matching header ${h.key} with value ${h.value}`);
          requestHeaders[h.key] = h.value;
        }
      });
    }
  }
  return requestHeaders;
}
function handleRewrites(event, rewrites) {
  const { rawPath, headers, query, cookies, url } = event;
  const localizedRawPath = localizePath(event);
  const matcher = routeHasMatcher(headers, cookies, query);
  const computeHas = computeParamHas(headers, cookies, query);
  const rewrite = rewrites.find((route) => {
    const path3 = route.locale === false ? rawPath : localizedRawPath;
    return new RegExp(route.regex).test(path3) && checkHas(matcher, route.has) && checkHas(matcher, route.missing, true);
  });
  let finalQuery = query;
  let rewrittenUrl = url;
  const isExternalRewrite = isExternal(rewrite?.destination);
  debug("isExternalRewrite", isExternalRewrite);
  if (rewrite) {
    const { pathname, protocol, hostname, queryString } = getUrlParts(rewrite.destination, isExternalRewrite);
    const pathToUse = rewrite.locale === false ? rawPath : localizedRawPath;
    debug("urlParts", { pathname, protocol, hostname, queryString });
    const toDestinationPath = compile(escapeRegex(pathname, { isPath: true }));
    const toDestinationHost = compile(escapeRegex(hostname));
    const toDestinationQuery = compile(escapeRegex(queryString));
    const params = {
      // params for the source
      ...getParamsFromSource(match(escapeRegex(rewrite.source, { isPath: true })))(pathToUse),
      // params for the has
      ...rewrite.has?.reduce((acc, cur) => {
        return Object.assign(acc, computeHas(cur));
      }, {}),
      // params for the missing
      ...rewrite.missing?.reduce((acc, cur) => {
        return Object.assign(acc, computeHas(cur));
      }, {})
    };
    const isUsingParams = Object.keys(params).length > 0;
    let rewrittenQuery = queryString;
    let rewrittenHost = hostname;
    let rewrittenPath = pathname;
    if (isUsingParams) {
      rewrittenPath = unescapeRegex(toDestinationPath(params));
      rewrittenHost = unescapeRegex(toDestinationHost(params));
      rewrittenQuery = unescapeRegex(toDestinationQuery(params));
    }
    if (NextConfig.i18n && !isExternalRewrite) {
      const strippedPathLocale = rewrittenPath.replace(new RegExp(`^/(${NextConfig.i18n.locales.join("|")})`), "");
      if (strippedPathLocale.startsWith("/api/")) {
        rewrittenPath = strippedPathLocale;
      }
    }
    rewrittenUrl = isExternalRewrite ? `${protocol}//${rewrittenHost}${rewrittenPath}` : new URL(rewrittenPath, event.url).href;
    finalQuery = {
      ...query,
      ...convertFromQueryString(rewrittenQuery)
    };
    rewrittenUrl += convertToQueryString(finalQuery);
    debug("rewrittenUrl", { rewrittenUrl, finalQuery, isUsingParams });
  }
  return {
    internalEvent: {
      ...event,
      query: finalQuery,
      rawPath: new URL(rewrittenUrl).pathname,
      url: rewrittenUrl
    },
    __rewrite: rewrite,
    isExternalRewrite
  };
}
function handleRepeatedSlashRedirect(event) {
  if (event.rawPath.match(/(\\|\/\/)/)) {
    return {
      type: event.type,
      statusCode: 308,
      headers: {
        Location: normalizeRepeatedSlashes(new URL(event.url))
      },
      body: emptyReadableStream(),
      isBase64Encoded: false
    };
  }
  return false;
}
function handleTrailingSlashRedirect(event) {
  const url = new URL(event.rawPath, "http://localhost");
  if (
    // Someone is trying to redirect to a different origin, let's not do that
    url.host !== "localhost" || NextConfig.skipTrailingSlashRedirect || // We should not apply trailing slash redirect to API routes
    event.rawPath.startsWith("/api/")
  ) {
    return false;
  }
  const emptyBody = emptyReadableStream();
  if (NextConfig.trailingSlash && !event.headers["x-nextjs-data"] && !event.rawPath.endsWith("/") && !event.rawPath.match(/[\w-]+\.[\w]+$/g)) {
    const headersLocation = event.url.split("?");
    return {
      type: event.type,
      statusCode: 308,
      headers: {
        Location: `${headersLocation[0]}/${headersLocation[1] ? `?${headersLocation[1]}` : ""}`
      },
      body: emptyBody,
      isBase64Encoded: false
    };
  }
  if (!NextConfig.trailingSlash && event.rawPath.endsWith("/") && event.rawPath !== "/") {
    const headersLocation = event.url.split("?");
    return {
      type: event.type,
      statusCode: 308,
      headers: {
        Location: `${headersLocation[0].replace(/\/$/, "")}${headersLocation[1] ? `?${headersLocation[1]}` : ""}`
      },
      body: emptyBody,
      isBase64Encoded: false
    };
  }
  return false;
}
function handleRedirects(event, redirects) {
  const repeatedSlashRedirect = handleRepeatedSlashRedirect(event);
  if (repeatedSlashRedirect)
    return repeatedSlashRedirect;
  const trailingSlashRedirect = handleTrailingSlashRedirect(event);
  if (trailingSlashRedirect)
    return trailingSlashRedirect;
  const localeRedirect = handleLocaleRedirect(event);
  if (localeRedirect)
    return localeRedirect;
  const { internalEvent, __rewrite } = handleRewrites(event, redirects.filter((r) => !r.internal));
  if (__rewrite && !__rewrite.internal) {
    return {
      type: event.type,
      statusCode: __rewrite.statusCode ?? 308,
      headers: {
        Location: internalEvent.url
      },
      body: emptyReadableStream(),
      isBase64Encoded: false
    };
  }
}
function fixDataPage(internalEvent, buildId) {
  const { rawPath, query } = internalEvent;
  const basePath = NextConfig.basePath ?? "";
  const dataPattern = `${basePath}/_next/data/${buildId}`;
  if (rawPath.startsWith("/_next/data") && !rawPath.startsWith(dataPattern)) {
    return {
      type: internalEvent.type,
      statusCode: 404,
      body: toReadableStream("{}"),
      headers: {
        "Content-Type": "application/json"
      },
      isBase64Encoded: false
    };
  }
  if (rawPath.startsWith(dataPattern) && rawPath.endsWith(".json")) {
    const newPath = `${basePath}${rawPath.slice(dataPattern.length, -".json".length).replace(/^\/index$/, "/")}`;
    query.__nextDataReq = "1";
    return {
      ...internalEvent,
      rawPath: newPath,
      query,
      url: new URL(`${newPath}${convertToQueryString(query)}`, internalEvent.url).href
    };
  }
  return internalEvent;
}
function handleFallbackFalse(internalEvent, prerenderManifest) {
  const { rawPath } = internalEvent;
  const { dynamicRoutes = {}, routes = {} } = prerenderManifest ?? {};
  const prerenderedFallbackRoutes = Object.entries(dynamicRoutes).filter(([, { fallback }]) => fallback === false);
  const routeFallback = prerenderedFallbackRoutes.some(([, { routeRegex }]) => {
    const routeRegexExp = new RegExp(routeRegex);
    return routeRegexExp.test(rawPath);
  });
  const locales = NextConfig.i18n?.locales;
  const routesAlreadyHaveLocale = locales?.includes(rawPath.split("/")[1]) || // If we don't use locales, we don't need to add the default locale
  locales === void 0;
  let localizedPath = routesAlreadyHaveLocale ? rawPath : `/${NextConfig.i18n?.defaultLocale}${rawPath}`;
  if (
    // Not if localizedPath is "/" tho, because that would not make it find `isPregenerated` below since it would be try to match an empty string.
    localizedPath !== "/" && NextConfig.trailingSlash && localizedPath.endsWith("/")
  ) {
    localizedPath = localizedPath.slice(0, -1);
  }
  const matchedStaticRoute = staticRouteMatcher(localizedPath);
  const prerenderedFallbackRoutesName = prerenderedFallbackRoutes.map(([name]) => name);
  const matchedDynamicRoute = dynamicRouteMatcher(localizedPath).filter(({ route }) => !prerenderedFallbackRoutesName.includes(route));
  const isPregenerated = Object.keys(routes).includes(localizedPath);
  if (routeFallback && !isPregenerated && matchedStaticRoute.length === 0 && matchedDynamicRoute.length === 0) {
    return {
      event: {
        ...internalEvent,
        rawPath: "/404",
        url: constructNextUrl(internalEvent.url, "/404"),
        headers: {
          ...internalEvent.headers,
          "x-invoke-status": "404"
        }
      },
      isISR: false
    };
  }
  return {
    event: internalEvent,
    isISR: routeFallback || isPregenerated
  };
}

// node_modules/@opennextjs/aws/dist/core/routing/middleware.js
init_stream();
init_utils();
var middlewareManifest = MiddlewareManifest;
var functionsConfigManifest = FunctionsConfigManifest;
var middleMatch = getMiddlewareMatch(middlewareManifest, functionsConfigManifest);
var REDIRECTS = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
function defaultMiddlewareLoader() {
  return Promise.resolve().then(() => (init_edgeFunctionHandler(), edgeFunctionHandler_exports));
}
async function handleMiddleware(internalEvent, initialSearch, middlewareLoader = defaultMiddlewareLoader) {
  const headers = internalEvent.headers;
  if (headers["x-isr"] && headers["x-prerender-revalidate"] === PrerenderManifest?.preview?.previewModeId)
    return internalEvent;
  const normalizedPath = localizePath(internalEvent);
  const hasMatch = middleMatch.some((r) => r.test(normalizedPath));
  if (!hasMatch)
    return internalEvent;
  const initialUrl = new URL(normalizedPath, internalEvent.url);
  initialUrl.search = initialSearch;
  const url = initialUrl.href;
  const middleware = await middlewareLoader();
  const result = await middleware.default({
    // `geo` is pre Next 15.
    geo: {
      // The city name is percent-encoded.
      // See https://github.com/vercel/vercel/blob/4cb6143/packages/functions/src/headers.ts#L94C19-L94C37
      city: decodeURIComponent(headers["x-open-next-city"]),
      country: headers["x-open-next-country"],
      region: headers["x-open-next-region"],
      latitude: headers["x-open-next-latitude"],
      longitude: headers["x-open-next-longitude"]
    },
    headers,
    method: internalEvent.method || "GET",
    nextConfig: {
      basePath: NextConfig.basePath,
      i18n: NextConfig.i18n,
      trailingSlash: NextConfig.trailingSlash
    },
    url,
    body: convertBodyToReadableStream(internalEvent.method, internalEvent.body)
  });
  const statusCode = result.status;
  const responseHeaders = result.headers;
  const reqHeaders = {};
  const resHeaders = {};
  const filteredHeaders = [
    "x-middleware-override-headers",
    "x-middleware-next",
    "x-middleware-rewrite",
    // We need to drop `content-encoding` because it will be decoded
    "content-encoding"
  ];
  const xMiddlewareKey = "x-middleware-request-";
  responseHeaders.forEach((value, key) => {
    if (key.startsWith(xMiddlewareKey)) {
      const k = key.substring(xMiddlewareKey.length);
      reqHeaders[k] = value;
    } else {
      if (filteredHeaders.includes(key.toLowerCase()))
        return;
      if (key.toLowerCase() === "set-cookie") {
        resHeaders[key] = resHeaders[key] ? [...resHeaders[key], value] : [value];
      } else if (REDIRECTS.has(statusCode) && key.toLowerCase() === "location") {
        resHeaders[key] = normalizeLocationHeader(value, internalEvent.url);
      } else {
        resHeaders[key] = value;
      }
    }
  });
  const rewriteUrl = responseHeaders.get("x-middleware-rewrite");
  let isExternalRewrite = false;
  let middlewareQuery = internalEvent.query;
  let newUrl = internalEvent.url;
  if (rewriteUrl) {
    newUrl = rewriteUrl;
    if (isExternal(newUrl, internalEvent.headers.host)) {
      isExternalRewrite = true;
    } else {
      const rewriteUrlObject = new URL(rewriteUrl);
      middlewareQuery = getQueryFromSearchParams(rewriteUrlObject.searchParams);
      if ("__nextDataReq" in internalEvent.query) {
        middlewareQuery.__nextDataReq = internalEvent.query.__nextDataReq;
      }
    }
  }
  if (!rewriteUrl && !responseHeaders.get("x-middleware-next")) {
    const body = result.body ?? emptyReadableStream();
    return {
      type: internalEvent.type,
      statusCode,
      headers: resHeaders,
      body,
      isBase64Encoded: false
    };
  }
  return {
    responseHeaders: resHeaders,
    url: newUrl,
    rawPath: new URL(newUrl).pathname,
    type: internalEvent.type,
    headers: { ...internalEvent.headers, ...reqHeaders },
    body: internalEvent.body,
    method: internalEvent.method,
    query: middlewareQuery,
    cookies: internalEvent.cookies,
    remoteAddress: internalEvent.remoteAddress,
    isExternalRewrite,
    rewriteStatusCode: rewriteUrl && !isExternalRewrite ? statusCode : void 0
  };
}

// node_modules/@opennextjs/aws/dist/core/routingHandler.js
var MIDDLEWARE_HEADER_PREFIX = "x-middleware-response-";
var MIDDLEWARE_HEADER_PREFIX_LEN = MIDDLEWARE_HEADER_PREFIX.length;
var INTERNAL_HEADER_PREFIX = "x-opennext-";
var INTERNAL_HEADER_INITIAL_URL = `${INTERNAL_HEADER_PREFIX}initial-url`;
var INTERNAL_HEADER_LOCALE = `${INTERNAL_HEADER_PREFIX}locale`;
var INTERNAL_HEADER_RESOLVED_ROUTES = `${INTERNAL_HEADER_PREFIX}resolved-routes`;
var INTERNAL_HEADER_REWRITE_STATUS_CODE = `${INTERNAL_HEADER_PREFIX}rewrite-status-code`;
var INTERNAL_EVENT_REQUEST_ID = `${INTERNAL_HEADER_PREFIX}request-id`;
var geoHeaderToNextHeader = {
  "x-open-next-city": "x-vercel-ip-city",
  "x-open-next-country": "x-vercel-ip-country",
  "x-open-next-region": "x-vercel-ip-country-region",
  "x-open-next-latitude": "x-vercel-ip-latitude",
  "x-open-next-longitude": "x-vercel-ip-longitude"
};
function applyMiddlewareHeaders(eventOrResult, middlewareHeaders) {
  const isResult = isInternalResult(eventOrResult);
  const headers = eventOrResult.headers;
  const keyPrefix = isResult ? "" : MIDDLEWARE_HEADER_PREFIX;
  Object.entries(middlewareHeaders).forEach(([key, value]) => {
    if (value) {
      headers[keyPrefix + key] = Array.isArray(value) ? value.join(",") : value;
    }
  });
}
async function routingHandler(event, { assetResolver }) {
  try {
    for (const [openNextGeoName, nextGeoName] of Object.entries(geoHeaderToNextHeader)) {
      const value = event.headers[openNextGeoName];
      if (value) {
        event.headers[nextGeoName] = value;
      }
    }
    for (const key of Object.keys(event.headers)) {
      if (key.startsWith(INTERNAL_HEADER_PREFIX) || key.startsWith(MIDDLEWARE_HEADER_PREFIX)) {
        delete event.headers[key];
      }
    }
    let headers = getNextConfigHeaders(event, ConfigHeaders);
    let eventOrResult = fixDataPage(event, BuildId);
    if (isInternalResult(eventOrResult)) {
      return eventOrResult;
    }
    const redirect = handleRedirects(eventOrResult, RoutesManifest.redirects);
    if (redirect) {
      redirect.headers.Location = normalizeLocationHeader(redirect.headers.Location, event.url, true);
      debug("redirect", redirect);
      return redirect;
    }
    const middlewareEventOrResult = await handleMiddleware(
      eventOrResult,
      // We need to pass the initial search without any decoding
      // TODO: we'd need to refactor InternalEvent to include the initial querystring directly
      // Should be done in another PR because it is a breaking change
      new URL(event.url).search
    );
    if (isInternalResult(middlewareEventOrResult)) {
      return middlewareEventOrResult;
    }
    const middlewareHeadersPrioritized = globalThis.openNextConfig.dangerous?.middlewareHeadersOverrideNextConfigHeaders ?? false;
    if (middlewareHeadersPrioritized) {
      headers = {
        ...headers,
        ...middlewareEventOrResult.responseHeaders
      };
    } else {
      headers = {
        ...middlewareEventOrResult.responseHeaders,
        ...headers
      };
    }
    let isExternalRewrite = middlewareEventOrResult.isExternalRewrite ?? false;
    eventOrResult = middlewareEventOrResult;
    if (!isExternalRewrite) {
      const beforeRewrite = handleRewrites(eventOrResult, RoutesManifest.rewrites.beforeFiles);
      eventOrResult = beforeRewrite.internalEvent;
      isExternalRewrite = beforeRewrite.isExternalRewrite;
      if (!isExternalRewrite) {
        const assetResult = await assetResolver?.maybeGetAssetResult?.(eventOrResult);
        if (assetResult) {
          applyMiddlewareHeaders(assetResult, headers);
          return assetResult;
        }
      }
    }
    const foundStaticRoute = staticRouteMatcher(eventOrResult.rawPath);
    const isStaticRoute = !isExternalRewrite && foundStaticRoute.length > 0;
    if (!(isStaticRoute || isExternalRewrite)) {
      const afterRewrite = handleRewrites(eventOrResult, RoutesManifest.rewrites.afterFiles);
      eventOrResult = afterRewrite.internalEvent;
      isExternalRewrite = afterRewrite.isExternalRewrite;
    }
    let isISR = false;
    if (!isExternalRewrite) {
      const fallbackResult = handleFallbackFalse(eventOrResult, PrerenderManifest);
      eventOrResult = fallbackResult.event;
      isISR = fallbackResult.isISR;
    }
    const foundDynamicRoute = dynamicRouteMatcher(eventOrResult.rawPath);
    const isDynamicRoute = !isExternalRewrite && foundDynamicRoute.length > 0;
    if (!(isDynamicRoute || isStaticRoute || isExternalRewrite)) {
      const fallbackRewrites = handleRewrites(eventOrResult, RoutesManifest.rewrites.fallback);
      eventOrResult = fallbackRewrites.internalEvent;
      isExternalRewrite = fallbackRewrites.isExternalRewrite;
    }
    const isNextImageRoute = eventOrResult.rawPath.startsWith("/_next/image");
    const isRouteFoundBeforeAllRewrites = isStaticRoute || isDynamicRoute || isExternalRewrite;
    if (!(isRouteFoundBeforeAllRewrites || isNextImageRoute || // We need to check again once all rewrites have been applied
    staticRouteMatcher(eventOrResult.rawPath).length > 0 || dynamicRouteMatcher(eventOrResult.rawPath).length > 0)) {
      eventOrResult = {
        ...eventOrResult,
        rawPath: "/404",
        url: constructNextUrl(eventOrResult.url, "/404"),
        headers: {
          ...eventOrResult.headers,
          "x-middleware-response-cache-control": "private, no-cache, no-store, max-age=0, must-revalidate"
        }
      };
    }
    if (globalThis.openNextConfig.dangerous?.enableCacheInterception && !isInternalResult(eventOrResult)) {
      debug("Cache interception enabled");
      eventOrResult = await cacheInterceptor(eventOrResult);
      if (isInternalResult(eventOrResult)) {
        applyMiddlewareHeaders(eventOrResult, headers);
        return eventOrResult;
      }
    }
    applyMiddlewareHeaders(eventOrResult, headers);
    const resolvedRoutes = [
      ...foundStaticRoute,
      ...foundDynamicRoute
    ];
    debug("resolvedRoutes", resolvedRoutes);
    return {
      internalEvent: eventOrResult,
      isExternalRewrite,
      origin: false,
      isISR,
      resolvedRoutes,
      initialURL: event.url,
      locale: NextConfig.i18n ? detectLocale(eventOrResult, NextConfig.i18n) : void 0,
      rewriteStatusCode: middlewareEventOrResult.rewriteStatusCode
    };
  } catch (e) {
    error("Error in routingHandler", e);
    return {
      internalEvent: {
        type: "core",
        method: "GET",
        rawPath: "/500",
        url: constructNextUrl(event.url, "/500"),
        headers: {
          ...event.headers
        },
        query: event.query,
        cookies: event.cookies,
        remoteAddress: event.remoteAddress
      },
      isExternalRewrite: false,
      origin: false,
      isISR: false,
      resolvedRoutes: [],
      initialURL: event.url,
      locale: NextConfig.i18n ? detectLocale(event, NextConfig.i18n) : void 0
    };
  }
}
function isInternalResult(eventOrResult) {
  return eventOrResult != null && "statusCode" in eventOrResult;
}

// node_modules/@opennextjs/aws/dist/adapters/middleware.js
globalThis.internalFetch = fetch;
globalThis.__openNextAls = new AsyncLocalStorage();
var defaultHandler = async (internalEvent, options) => {
  const middlewareConfig = globalThis.openNextConfig.middleware;
  const originResolver = await resolveOriginResolver(middlewareConfig?.originResolver);
  const externalRequestProxy = await resolveProxyRequest(middlewareConfig?.override?.proxyExternalRequest);
  const assetResolver = await resolveAssetResolver(middlewareConfig?.assetResolver);
  const requestId = Math.random().toString(36);
  return runWithOpenNextRequestContext({
    isISRRevalidation: internalEvent.headers["x-isr"] === "1",
    waitUntil: options?.waitUntil,
    requestId
  }, async () => {
    const result = await routingHandler(internalEvent, { assetResolver });
    if ("internalEvent" in result) {
      debug("Middleware intercepted event", internalEvent);
      if (!result.isExternalRewrite) {
        const origin = await originResolver.resolve(result.internalEvent.rawPath);
        return {
          type: "middleware",
          internalEvent: {
            ...result.internalEvent,
            headers: {
              ...result.internalEvent.headers,
              [INTERNAL_HEADER_INITIAL_URL]: internalEvent.url,
              [INTERNAL_HEADER_RESOLVED_ROUTES]: JSON.stringify(result.resolvedRoutes),
              [INTERNAL_EVENT_REQUEST_ID]: requestId,
              [INTERNAL_HEADER_REWRITE_STATUS_CODE]: String(result.rewriteStatusCode)
            }
          },
          isExternalRewrite: result.isExternalRewrite,
          origin,
          isISR: result.isISR,
          initialURL: result.initialURL,
          resolvedRoutes: result.resolvedRoutes
        };
      }
      try {
        return externalRequestProxy.proxy(result.internalEvent);
      } catch (e) {
        error("External request failed.", e);
        return {
          type: "middleware",
          internalEvent: {
            ...result.internalEvent,
            headers: {
              ...result.internalEvent.headers,
              [INTERNAL_EVENT_REQUEST_ID]: requestId
            },
            rawPath: "/500",
            url: constructNextUrl(result.internalEvent.url, "/500"),
            method: "GET"
          },
          // On error we need to rewrite to the 500 page which is an internal rewrite
          isExternalRewrite: false,
          origin: false,
          isISR: result.isISR,
          initialURL: result.internalEvent.url,
          resolvedRoutes: [{ route: "/500", type: "page" }]
        };
      }
    }
    if (process.env.OPEN_NEXT_REQUEST_ID_HEADER || globalThis.openNextDebug) {
      result.headers[INTERNAL_EVENT_REQUEST_ID] = requestId;
    }
    debug("Middleware response", result);
    return result;
  });
};
var handler2 = await createGenericHandler({
  handler: defaultHandler,
  type: "middleware"
});
var middleware_default = {
  fetch: handler2
};
export {
  middleware_default as default,
  handler2 as handler
};
/*!
* cookie
* Copyright(c) 2012-2014 Roman Shtylman
* Copyright(c) 2015 Douglas Christopher Wilson
* MIT Licensed
*/
/**
* @license React
* react.production.min.js
*
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
