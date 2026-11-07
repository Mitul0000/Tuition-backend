const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

const MAX_CONCURRENT_RENDERS = 2;
const RENDER_TIMEOUT_MS = 30000;

let browserPromise = null;
let active = 0;
const waiters = [];

const getBrowser = () => {
  if (!browserPromise) {
    browserPromise = (async () => {
      const browser = await puppeteer.launch({
        headless: true,
        args: chromium.args.filter((arg) => arg !== "--single-process"),
        executablePath: await chromium.executablePath(),
      });
      browser.on("disconnected", () => {
        browserPromise = null;
      });
      return browser;
    })().catch((err) => {
      browserPromise = null;
      throw err;
    });
  }
  return browserPromise;
};

const acquire = () =>
  new Promise((resolve) => {
    if (active < MAX_CONCURRENT_RENDERS) {
      active++;
      return resolve();
    }
    waiters.push(resolve);
  });

const release = () => {
  const next = waiters.shift();
  if (next) next();
  else active--;
};

exports.renderPdf = async (htmlString) => {
  await acquire();
  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setContent(htmlString, {
      waitUntil: "networkidle0",
      timeout: RENDER_TIMEOUT_MS,
    });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
      timeout: RENDER_TIMEOUT_MS,
    });
    return Buffer.from(pdf);
  } finally {
    if (page) await page.close().catch(() => {});
    release();
  }
};