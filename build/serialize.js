"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = __importDefault(require("url"));
const path_1 = require("path");
const MOBILE_USERAGENT = 'Mozilla/5.0 (Linux; Android 8.0.0; Pixel 2 XL Build/OPD1.170816.004) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Mobile Safari/537.36';
function restrict(href) {
    const parsedUrl = url_1.default.parse(href);
    const { hostname } = parsedUrl;
    if (/\.internal$/.test(hostname || '')) {
        return true;
    }
    return false;
}
function removeAllScriptElements() {
    const elements = document.querySelectorAll('script:not([type]), script[type*="javascript"], script[type="module"], link[rel=import]');
    for (const e of Array.from(elements)) {
        e.remove();
    }
}
function injectBaseHref(origin, directory) {
    const bases = document.head.querySelectorAll('base');
    if (bases.length) {
        const existingBase = bases[0].getAttribute('href') || '';
        if (existingBase.startsWith('/')) {
            if (existingBase === '/') {
                bases[0].setAttribute('href', origin);
            }
            else {
                bases[0].setAttribute('href', origin + existingBase);
            }
        }
    }
    else {
        const base = document.createElement('base');
        base.setAttribute('href', origin + directory);
        document.head.insertAdjacentElement('afterbegin', base);
    }
}
exports.default = (browser, requestUrl, isMobile, timezoneId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!browser) {
        return {
            status: 200,
            content: '前端 JavaScript WebGL',
        };
    }
    const page = yield (browser === null || browser === void 0 ? void 0 : browser.newPage());
    yield page.setViewport({
        width: 1000,
        height: 1000,
        isMobile,
    });
    if (isMobile) {
        page.setUserAgent(MOBILE_USERAGENT);
    }
    if (timezoneId) {
        try {
            yield page.emulateTimezone(timezoneId);
        }
        catch (e) {
            if ((_a = e === null || e === void 0 ? void 0 : e.message) === null || _a === void 0 ? void 0 : _a.includes('Invalid timezone')) {
                return {
                    status: 400,
                    content: 'Invalid timezone id',
                };
            }
        }
    }
    // 设置新的头部
    // await page.setExtraHTTPHeaders(...);
    page.evaluateOnNewDocument('customElements.forcePolyfill = true');
    page.evaluateOnNewDocument('ShadyDOM = {force: true}');
    page.evaluateOnNewDocument('ShadyCSS = {shimcssproperties: true}');
    yield page.setRequestInterception(true);
    page.on('request', (interceptedRequest) => {
        if (restrict(interceptedRequest.url())) {
            interceptedRequest.abort();
        }
        else {
            interceptedRequest.continue();
        }
    });
    let response = null;
    // Capture main frame response. This is used in the case that rendering
    // times out, which results in puppeteer throwing an error. This allows us
    // to return a partial response for what was able to be rendered in that
    // time frame.
    page.on('response', (r) => {
        if (!response) {
            response = r;
        }
    });
    try {
        response = yield page.goto(requestUrl, {
            timeout: 10000,
            waitUntil: 'networkidle0',
        });
    }
    catch (e) {
        console.error(e);
    }
    if (!response) {
        console.error('response does not exist');
        // 只会在页面是about:blank的时候发生
        // https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#pagegotourl-options.
        yield page.close();
        yield browser.close();
        return { status: 400, content: '' };
    }
    // Disable access to compute metadata. See
    // https://cloud.google.com/compute/docs/storing-retrieving-metadata.
    if (response.headers()['metadata-flavor'] === 'Google') {
        yield page.close();
        // await browser.close();
        return { status: 403, content: '' };
    }
    // Set status to the initial server's response code. Check for a <meta
    // name="render:status_code" content="4xx" /> tag which overrides the status
    // code.
    let statusCode = response.status();
    const newStatusCode = yield page.$eval('meta[name="render:status_code"]', element => parseInt(element.getAttribute('content') || '')).catch(() => undefined);
    if (statusCode === 304) {
        statusCode = 200;
    }
    if (statusCode === 200 && newStatusCode) {
        statusCode = newStatusCode;
    }
    yield page.evaluate(removeAllScriptElements);
    const parsedUrl = url_1.default.parse(requestUrl);
    yield page.evaluate(injectBaseHref, `${parsedUrl.protocol}//${parsedUrl.host}`, `${(0, path_1.dirname)(parsedUrl.pathname || '')}`);
    const result = (yield page.content());
    yield page.close();
    yield browser.close();
    return {
        status: statusCode,
        content: result,
    };
});
