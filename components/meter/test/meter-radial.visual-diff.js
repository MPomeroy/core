const puppeteer = require('puppeteer');
const VisualDiff = require('@brightspace-ui/visual-diff');

describe('d2l-meter-radial', function() {

	const visualDiff = new VisualDiff('meter-radial', __dirname);

	let browser, page;

	before(async() => {
		browser = await puppeteer.launch();
		page = await browser.newPage();
		await page.setViewport({width: 800, height: 800, deviceScaleFactor: 2});
		await page.goto(`${visualDiff.getBaseUrl()}/components/meter/test/meter-radial.visual-diff.html`, {waitUntil: ['networkidle0', 'load']});
		await page.bringToFront();
	});

	after(() => browser.close());

	[
		{ title: 'no-progress', fixture: '#no-progress'},
		{ title: 'has-progress', fixture: '#has-progress'},
		{ title: 'completed', fixture: '#completed'},
		{ title: 'no-progress-scaled', fixture: '#no-progress-scaled'},
		{ title: 'has-progress-scaled', fixture: '#has-progress-scaled'},
		{ title: 'completed-scaled', fixture: '#completed-scaled'},
		{ title: 'no-progress-rtl', fixture: '#no-progress-rtl'},
		{ title: 'has-progress-rtl', fixture: '#has-progress-rtl'},
		{ title: 'completed-rtl', fixture: '#completed-rtl'}
	].forEach((testData) => {
		it(testData.title, async function() {
			const rect = await visualDiff.getRect(page, testData.fixture);
			await visualDiff.screenshotAndCompare(page, this.test.fullTitle(), { clip: rect });
		});
	});

});
