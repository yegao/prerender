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
const puppeteer_1 = __importDefault(require("puppeteer"));
const url_1 = __importDefault(require("url"));
const path_1 = require("path");
function restrict(href) {
    const parsedUrl = url_1.default.parse(href);
    const { hostname } = parsedUrl;
    if (/\.internal$/.test(hostname || '')) {
        return true;
    }
    return false;
}
function createBroswer() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    });
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
const generator = (requestUrl) => __awaiter(void 0, void 0, void 0, function* () {
    let browser = yield createBroswer();
    const page = yield (browser === null || browser === void 0 ? void 0 : browser.newPage());
    browser.on('disconnected', createBroswer);
    page.on('request', (interceptedRequest) => {
        if (restrict(interceptedRequest.url())) {
            interceptedRequest.abort();
        }
        else {
            interceptedRequest.continue();
        }
    });
    let response = null;
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
        return '';
    }
    if (!response) {
        console.error('请求' + requestUrl + '发生错误!');
    }
    yield page.evaluate(removeAllScriptElements);
    const parsedUrl = url_1.default.parse(requestUrl);
    yield page.evaluate(injectBaseHref, `${parsedUrl.protocol}//${parsedUrl.host}`, `${(0, path_1.dirname)(parsedUrl.pathname || '')}`);
    return yield page.content().catch(() => '');
});
