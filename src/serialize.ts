import puppeteer from 'puppeteer';
import url from 'url';
import { dirname } from 'path';

type SerializedResponse = {
    status: number;
    content: string;
};

const MOBILE_USERAGENT = 'Mozilla/5.0 (Linux; Android 8.0.0; Pixel 2 XL Build/OPD1.170816.004) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Mobile Safari/537.36';

function restrict(href: string): boolean {
    const parsedUrl = url.parse(href);
    const { hostname } = parsedUrl;
    if (/\.internal$/.test(hostname || '')) {
        return true;
    }
    return false;
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

async function finish(
    page: puppeteer.Page,
    browser: puppeteer.Browser,
    status: number = 200,
    content: string = ''
) {
    try {
        await page.close();
        await browser.close();
    } catch (err) {}
    return {
        status,
        content
    }
}

export default async (
    browser: puppeteer.Browser | null,
    requestUrl: string,
    isMobile: boolean,
    timezoneId?: string
): Promise<SerializedResponse> => {
    if (!browser) {
        return {
            status: 200,
            content: '前端 JavaScript WebGL',
        };
    }
    const page = await browser?.newPage();
    await page.setViewport({
        width: 1000,
        height: 1000,
        isMobile,
    });
    if (isMobile) {
        page.setUserAgent(MOBILE_USERAGENT);
    }

    if (timezoneId) {
        try {
            await page.emulateTimezone(timezoneId);
        } catch (e: any) {
            if (e?.message?.includes('Invalid timezone')) {
                return {
                    status: 400,
                    content: 'Invalid timezone id',
                };
            }
        }
    }

    page.evaluateOnNewDocument('customElements.forcePolyfill = true');
    page.evaluateOnNewDocument('ShadyDOM = {force: true}');
    page.evaluateOnNewDocument('ShadyCSS = {shimcssproperties: true}');
    await page.setRequestInterception(true);
    page.on('request', (interceptedRequest: puppeteer.HTTPRequest) => {
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
    }

    if (!response) {
        console.error('response does not exist');
        // 只会在页面是about:blank的时候发生
        // https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#pagegotourl-options.
        return await finish(page, browser, 400, '');
    }

    // https://cloud.google.com/compute/docs/storing-retrieving-metadata.
    if (response.headers()['metadata-flavor'] === 'Google') {
        return await finish(page, browser, 403, '');
    }

    let statusCode = response.status();
    if (statusCode === 304) {
        statusCode = 200;
    }
    await page.evaluate(removeAllScriptElements);
    const parsedUrl = url.parse(requestUrl);
    await page.evaluate(
        injectBaseHref,
        `${parsedUrl.protocol}//${parsedUrl.host}`,
        `${dirname(parsedUrl.pathname || '')}`
    );
    const result = (await page.content()) as string;
    return await finish(page, browser, statusCode, result);
}