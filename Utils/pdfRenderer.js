const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

exports.renderPdf = async (htmlString) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: chromium.args,
    executablePath: await chromium.executablePath(),
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlString, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
};