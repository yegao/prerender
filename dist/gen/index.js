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
const options_1 = require("./options");
const generator_1 = __importDefault(require("./generator"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const parsed = (0, options_1.parseArgv)(process.argv);
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(__dirname, process.cwd());
        if (parsed === null) {
            process.exitCode = 2;
            return;
        }
        const { content, opts } = parsed;
        console.log(content, opts);
        const config = JSON.parse(content);
        const staticPaths = Object.keys(config);
        for (const staticPath of staticPaths) {
            const uri = config[staticPath];
            const staticContent = yield (0, generator_1.default)(uri);
            console.log(staticPath);
            const absoluteStaticPath = path_1.default.resolve(opts.dir, staticPath);
            const chunks = absoluteStaticPath.split('/');
            const filename = chunks.pop();
            const absoluteStaticDirectory = chunks.join('/');
            fs_1.default.mkdirSync(absoluteStaticDirectory, { recursive: true });
            fs_1.default.writeFileSync(absoluteStaticPath, staticContent);
        }
    });
})();
