// const puppeteer = require('puppeteer');

// // Singleton browser instance
// let browserPromise = null;
// async function getBrowser() {
//     if (!browserPromise) {
//         browserPromise = puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
//     }
//     return browserPromise;
// }

// // Generates a PDF from HTML string and returns the PDF buffer
// async function generatePdfFromHtml(html) {
//     const browser = await getBrowser();
//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: 'networkidle0' });

//     // Remove all but the first image per item, compress all images, and remove background images/styles
//     await page.evaluate(() => {
//         // Remove all background images/styles
//         document.querySelectorAll('*').forEach(el => {
//             el.style.backgroundImage = 'none';
//             el.style.background = 'none';
//         });
//         // Remove all but the first image per item
//         document.querySelectorAll('tr').forEach(row => {
//             const imgs = row.querySelectorAll('img');
//             imgs.forEach((img, idx) => {
//                 if (idx > 0) img.remove();
//             });
//         });
//         // Replace every image with a new compressed JPEG if possible
//         document.querySelectorAll('img').forEach(img => {
//             img.width = 60;
//             img.height = 60;
//             img.style.width = '60px';
//             img.style.height = '60px';
//             img.style.objectFit = 'cover';
//             img.style.display = '';
//             // Only try to compress if image is a data URL (not remote)
//             if (img.src.startsWith('data:image/')) {
//                 try {
//                     const canvas = document.createElement('canvas');
//                     canvas.width = 60;
//                     canvas.height = 60;
//                     const ctx = canvas.getContext('2d');
//                     ctx.drawImage(img, 0, 0, 60, 60);
//                     img.src = canvas.toDataURL('image/jpeg', 0.3);
//                 } catch (e) {
//                     // If canvas is tainted, skip compression
//                     console.warn('Could not compress image:', e);
//                 }
//             }
//         });
//     });

//     // Add CSS to ensure table columns are visible and images don't overflow
//     await page.addStyleTag({
//         content: `
//             table { width: 100%; border-collapse: collapse; }
//             th, td { border: 1px solid #ccc; padding: 4px; font-size: 12px; }
//             img { display: block; margin: 0 auto; }
//         `
//     });

//     const pdfBuffer = await page.pdf({
//         format: 'A4',
//         printBackground: false,
//         margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
//         scale: 0.7, // Lower scale for smaller output
//         preferCSSPageSize: true,
//     });
//     await page.close();
//     return pdfBuffer;
// }

// module.exports = generatePdfFromHtml;
