const fs = require('fs');

const scraperObject = {
    url: 'https://arbetsformedlingen.se/platsbanken/annonser?ot=6YE1_gAC_R2G&q=devops&l=2:CifL_Rzy_Mku',
    async scraper(browser){
        let page = await browser.newPage();
        console.log(`Navigating to ${this.url}...`);
        // Navigate to the selected page
        await page.goto(this.url);
        let scrapedData = [];
        // Wait for the required DOM to be rendered
        async function scrapeCurrentPage(){
            await page.waitForSelector('.result-container');
            // Get the link to all the required books
            let urls = await page.$$eval('.header-container > h3 > a', links => {
                return links.map(link => link.href);
            });
            console.log(urls);
            // Loop through each of those links, open a new page instance and get the relevant data from them
            let pagePromise = (link) => new Promise(async(resolve, reject) => {
                let dataObj = {};
                let newPage = await browser.newPage();
                await newPage.goto(link);
                await newPage.waitForSelector('.jobb-container');
                dataObj['jobTitle'] = await newPage.$eval('h1.spacing.break-title', text => text.textContent);
                dataObj['companyName'] = await newPage.$eval('#pb-company-name', text => text.textContent);
                
                resolve(dataObj);
                await newPage.close();
            });

            for(link in urls){
                let currentPageData = await pagePromise(urls[link]);
                scrapedData.push(currentPageData);
                console.log(currentPageData);
                
            }
            

            fs.writeFile("data.json", JSON.stringify(scrapedData), (err) => {
                if (err)
                    console.log(err);
                else {
                    console.log("File written successfully\n");
                }
            });
            
            // When all the data on this page is done, click the next button and start the scraping of the next page
            // You are going to check if this button exist first, so you know if there really is a next page.
            let nextButtonExist = false;
            try{
                nextButtonExist = true;
            }
            catch(err){
                nextButtonExist = false;
            }
            if(nextButtonExist){
                await page.waitForSelector('.sc-digi-button-h .digi-button--icon-secondary.sc-digi-button');

                await page.click('.sc-digi-button-h .digi-button--icon-secondary.sc-digi-button');

                await page.waitForSelector('.sc-digi-button-h .digi-button--icon-secondary.sc-digi-button');
                await page.waitForSelector('.result-container');

                return scrapeCurrentPage(); // Call this function recursively
            }
            await page.close();
            console.log(scrapedData);
            return scrapedData;
        }
        let data = await scrapeCurrentPage();
        console.log(data);
        return data;
    }
}

module.exports = scraperObject;