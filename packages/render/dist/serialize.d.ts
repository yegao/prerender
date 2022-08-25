import puppeteer from 'puppeteer';
declare type SerializedResponse = {
    status: number;
    content: string;
};
declare const _default: (browser: puppeteer.Browser | null, requestUrl: string, isMobile: boolean, timezoneId?: string) => Promise<SerializedResponse>;
export default _default;
