import puppeteer from 'puppeteer';
import url from 'url';
import { dirname } from 'path';

function restrict(href: string): boolean {
    const parsedUrl = url.parse(href);
    const { hostname } = parsedUrl;
    if (/\.internal$/.test(hostname || '')) {
        return true;
    }
    return false;
}

async function createBroswer() {
    return await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
}

function removeAllScriptElements() {
    const elements = document.querySelectorAll(
        'script:not([type]), script[type*="javascript"], script[type="module"], link[rel=import]'
    );
    for (const e of Array.from(elements)) {
        e.remove();
    }
}

function injectBaseHref(origin: string, directory: string) {
    const bases = document.head.querySelectorAll('base');
    if (bases.length) {
        const existingBase = bases[0].getAttribute('href') || '';
        if (existingBase.startsWith('/')) {
            if (existingBase === '/') {
                bases[0].setAttribute('href', origin);
            } else {
                bases[0].setAttribute('href', origin + existingBase);
            }
        }
    } else {
        const base = document.createElement('base');
        base.setAttribute('href', origin + directory);
        document.head.insertAdjacentElement('afterbegin', base);
    }
}

export let browser: puppeteer.Browser;
export let page: puppeteer.Page;
export async function generate (requestUrl: string) {
    if (!browser?.isConnected()) {
        browser = await createBroswer();
    }
    if (page && !page.isClosed()) {
        await page.close();
    }
    page = await browser?.newPage();
    await page.setRequestInterception(true);
    page.on('request', (interceptedRequest: puppeteer.HTTPRequest) => {
        console.log(interceptedRequest.url());
        if (restrict(interceptedRequest.url())) {
            interceptedRequest.abort();
        } else {
            interceptedRequest.continue();
        }
    });

    let response: puppeteer.HTTPResponse | null = null;

    page.on('response', (r: puppeteer.HTTPResponse) => {
        if (!response) {
            response = r;
        }
    });

    try {
        response = await page.goto(requestUrl, {
            timeout: 10000,
            waitUntil: 'networkidle0',
        });
    } catch (e) {
        console.error(e);
        return '';
    }

    if (!response) {
        console.error('请求' + requestUrl + '发生错误!');
    }

    await page.evaluate(removeAllScriptElements);

    const parsedUrl = url.parse(requestUrl);
    await page.evaluate(
        injectBaseHref,
        `${parsedUrl.protocol}//${parsedUrl.host}`,
        `${dirname(parsedUrl.pathname || '')}`
    );
    return await page.content().catch(() => '');
}
