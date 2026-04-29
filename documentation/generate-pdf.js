const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { chromium } = require('playwright');

const DOC_DIR = __dirname;
const SOURCE_MD = path.join(DOC_DIR, 'Expense_Tracker_Complete_Documentation.md');
const OUTPUT_PDF = path.join(DOC_DIR, 'Expense_Tracker_Complete_Documentation.pdf');

function mimeTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.svg') return 'image/svg+xml';
  return null;
}

function inlineLocalImages(markdown) {
  return markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, alt, imagePath) => {
    const cleanPath = imagePath.trim();

    // Keep remote images untouched.
    if (/^https?:\/\//i.test(cleanPath) || cleanPath.startsWith('data:')) {
      return full;
    }

    const absolutePath = path.resolve(DOC_DIR, cleanPath);
    if (!fs.existsSync(absolutePath)) {
      return full;
    }

    const mime = mimeTypeFor(absolutePath);
    if (!mime) {
      return full;
    }

    const fileBuffer = fs.readFileSync(absolutePath);
    const encoded = fileBuffer.toString('base64');
    const dataUri = `data:${mime};base64,${encoded}`;
    return `![${alt}](${dataUri})`;
  });
}

function buildHtml(markdown) {
  const markdownWithEmbeddedImages = inlineLocalImages(markdown);
  const body = marked.parse(markdownWithEmbeddedImages, { gfm: true });
  const baseHref = `file:///${DOC_DIR.replace(/\\/g, '/')}/`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <base href="${baseHref}" />
  <style>
    @page { size: A4; margin: 16mm 14mm 16mm 14mm; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #0f172a;
      line-height: 1.45;
      font-size: 12px;
      margin: 0;
    }
    h1, h2, h3, h4 {
      color: #0f172a;
      page-break-after: avoid;
      break-after: avoid;
      margin-top: 18px;
      margin-bottom: 8px;
    }
    h1 { font-size: 28px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    h2 { font-size: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    h3 { font-size: 16px; }
    p, ul, ol, table, pre, blockquote { margin-top: 8px; margin-bottom: 8px; }
    img {
      max-width: 100%;
      height: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin: 8px 0 14px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 11px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
    }
    code {
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 4px;
      font-family: Consolas, 'Courier New', monospace;
      font-size: 11px;
    }
    pre code {
      display: block;
      padding: 10px;
      overflow-x: auto;
      white-space: pre-wrap;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #f8fafc;
    }
    hr {
      border: 0;
      border-top: 1px solid #e2e8f0;
      margin: 12px 0;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
    }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

async function generatePdf() {
  if (!fs.existsSync(SOURCE_MD)) {
    throw new Error(`Source file not found: ${SOURCE_MD}`);
  }

  const markdown = fs.readFileSync(SOURCE_MD, 'utf8');
  const html = buildHtml(markdown);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

    await page.pdf({
      path: OUTPUT_PDF,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true
    });

    console.log(`PDF generated: ${OUTPUT_PDF}`);
  } finally {
    await browser.close();
  }
}

generatePdf().catch((error) => {
  console.error('Failed to generate PDF:', error);
  process.exit(1);
});
