import scrape from 'website-scraper';
import fs from 'fs';

const options = {
  urls: ['http://localhost:3000/'],
  directory: './out_html',
  recursive: false,
  maxDepth: 1,
  filenameGenerator: 'bySiteStructure',
};

if (fs.existsSync('./out_html')) {
  fs.rmSync('./out_html', { recursive: true });
}

scrape(options).then((result) => {
  console.log("Scraped successfully");
}).catch((err) => {
  console.log("Error scraping", err);
});
