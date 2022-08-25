import puppeteer from 'puppeteer';
import path from 'path';
import url from 'url';
import Koa from 'koa';
import koaLogger from 'koa-logger';
import koaBodyParser from 'koa-bodyparser';
import koaSend from 'koa-send';
import koaRoute from 'koa-route';
import serialize from './serialize';

let browser: any = null;

async function createRenderer() {
    browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    browser.on('disconnected', createRenderer);
}

function restricted(href: string): boolean {
    const parseUrl = url.parse(href);
    const { protocol, hostname } = parseUrl;
    if (/^https?/.test(protocol || '') && !/\.internal$/.test(hostname || '')) {
        return false;
    }
    return true;
}

async function main() {
    const port = 8900;
    await createRenderer();
    const app = new Koa();
    app.use(koaLogger());
    app.use(koaBodyParser());
    app.use(
        koaRoute.get('/', async (ctx: Koa.Context) => {
            await koaSend(ctx, 'index.html', {
                root: path.resolve(__dirname)
            });
        })
    );
    app.use(koaRoute.get('/render/:url(.*)', async (ctx: Koa.Context, url: string) => {
        if (restricted(url)) {
            ctx.status = 403;
            return;
        }
        const mobileVersion = 'mobile' in ctx.query ? true : false;
        const serialized = await serialize(
            browser,
            url,
            mobileVersion,
            ctx?.query?.timezoneId as string
        );

        // for (const key in config.headers) {
        //     ctx.set(key, config.headers[key]);
        // }

        ctx.set('x-renderer', 'prerender');
        ctx.status = serialized.status;
        ctx.body = serialized.content;
    }));

    app.listen(port, () => {
        console.log('Listening on port:' + port);
    });
    return app;
}

try {
    main();
} catch (err: any) {
    console.log(err);
};
