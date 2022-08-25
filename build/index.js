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
const path_1 = __importDefault(require("path"));
const url_1 = __importDefault(require("url"));
const koa_1 = __importDefault(require("koa"));
const koa_logger_1 = __importDefault(require("koa-logger"));
const koa_bodyparser_1 = __importDefault(require("koa-bodyparser"));
const koa_send_1 = __importDefault(require("koa-send"));
const koa_route_1 = __importDefault(require("koa-route"));
const serialize_1 = __importDefault(require("./serialize"));
let browser = null;
function createRenderer() {
    return __awaiter(this, void 0, void 0, function* () {
        browser = yield puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        browser.on('disconnected', createRenderer);
    });
}
function restricted(href) {
    const parseUrl = url_1.default.parse(href);
    const { protocol, hostname } = parseUrl;
    if (/^https?/.test(protocol || '') && !/\.internal$/.test(hostname || '')) {
        return false;
    }
    return true;
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const port = 8900;
        yield createRenderer();
        const app = new koa_1.default();
        app.use((0, koa_logger_1.default)());
        app.use((0, koa_bodyparser_1.default)());
        app.use(koa_route_1.default.get('/', (ctx) => __awaiter(this, void 0, void 0, function* () {
            yield (0, koa_send_1.default)(ctx, 'index.html', {
                root: path_1.default.resolve(__dirname)
            });
        })));
        app.use(koa_route_1.default.get('/render/:url(.*)', (ctx, url) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (restricted(url)) {
                ctx.status = 403;
                return;
            }
            const mobileVersion = 'mobile' in ctx.query ? true : false;
            const serialized = yield (0, serialize_1.default)(browser, url, mobileVersion, (_a = ctx === null || ctx === void 0 ? void 0 : ctx.query) === null || _a === void 0 ? void 0 : _a.timezoneId);
            // for (const key in config.headers) {
            //     ctx.set(key, config.headers[key]);
            // }
            ctx.set('x-renderer', 'prerender');
            ctx.status = serialized.status;
            ctx.body = serialized.content;
        })));
        app.listen(port, () => {
            console.log('Listening on port:' + port);
        });
        return app;
    });
}
try {
    main();
}
catch (err) {
    console.log(err);
}
;
