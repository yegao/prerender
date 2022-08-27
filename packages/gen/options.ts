import { OptionValues, program } from 'commander';
import fs from 'fs';
import path from 'path';

program.option(
    "-d, --dir [dirname]",
    "读取指定文件夹中的prerender.json中的路由配置"
);
program.option(
    "-o, --out [outdir]",
    "输出预渲染文件的存放目录"
);

type ParsedResponse = {
    content: string,
    opts: OptionValues
}

export function parseArgv(args: Array<string>): ParsedResponse | null {
    program.parse(args);
    const opts = program.opts();
    if (opts.dir === void 0) {
        opts.dir = process.cwd();
    }
    const filename = path.resolve(opts.dir, 'prerender.json');
    const errors: Array<string> = [];

    if (!fs.existsSync(filename)) {
        errors.push(filename + '不存在');
    }

    if (errors.length) {
        return null;
    }

    const content = fs.readFileSync(filename, {
        encoding: 'utf-8'
    });

    return {
        content,
        opts
    };
};