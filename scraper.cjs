// 1. Stealth mode enabled for Walmart & anti-bot protection
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

const fs = require('fs');

async function getPurchasedCount(url, retailer) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    console.log(`Checking purchased items on ${retailer}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // ==========================================
    // RETAILER NAVIGATION & LOAD TRIGGERS
    // ==========================================
    if (retailer === 'Target') {
      await page.waitForSelector('[data-test="grid-item"]', { timeout: 60000 });
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 500;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 150);
        });
      });
      await page.waitForTimeout(3000); 
    } 
    else if (retailer === 'Amazon') {
      await page.waitForSelector('.gr-single-faceout', { timeout: 60000 });
      
      let moreButtonVisible = true;
      while (moreButtonVisible) {
        try {
          const showMoreBtn = page.locator('text="Show more items"');
          if (await showMoreBtn.isVisible({ timeout: 2000 })) {
            console.log('  -> Found "Show more items" button. Clicking...');
            await showMoreBtn.click();
            await page.waitForTimeout(2500); 
          } else {
            moreButtonVisible = false; 
          }
        } catch (error) {
          moreButtonVisible = false;
        }
      }
    } 
    else if (retailer === 'Walmart') {
      await page.waitForSelector('[data-testid="HeaderCount-purchased"]', { timeout: 60000 });
    }
    else if (retailer === 'Belk') {
      // 1. Wait for the toggle switch to appear
      const toggleSwitch = page.locator('#registry-show-purchased-items');
      await toggleSwitch.waitFor({ timeout: 60000 });

      // 2. Check if the toggle is unchecked; click if needed
      const state = await toggleSwitch.getAttribute('data-state');
      if (state === 'unchecked') {
        console.log('  -> Flipping "Show Purchased Items" switch on Belk...');
        await toggleSwitch.click();
        await page.waitForTimeout(3000); // Allow list to re-render
      }
    }

    // ==========================================
    // DATA EXTRACTION
    // ==========================================
    const purchasedCount = await page.evaluate((retailerName) => {
      let count = 0;

      if (retailerName === 'Target') {
        const purchasedIndicators = document.querySelectorAll('[data-test="@site-registry/components/RegistryProductCard/PurchasedProgress/GREEN_CHECK"]');
        purchasedIndicators.forEach(indicator => {
          const parentDiv = indicator.parentElement;
          if (parentDiv) {
            const qty = parseInt(parentDiv.innerText.trim(), 10);
            if (!isNaN(qty) && qty > 0) count += qty;
          }
        });
      } 
      else if (retailerName === 'Amazon') {
        const cards = document.querySelectorAll('.gr-single-faceout');
        cards.forEach(card => {
          const text = card.innerText;
          const purchasedMatch = text.match(/(\d+)\s+of\s+\d+\s+purchased/i);
          if (purchasedMatch) {
            const qty = parseInt(purchasedMatch[1], 10);
            if (qty > 0) count += qty;
          } else if (text.toLowerCase().includes('0 still needed')) {
            count += 1;
          }
        });
      } 
      else if (retailerName === 'Walmart') {
        const purchasedHeader = document.querySelector('[data-testid="HeaderCount-purchased"]');
        if (purchasedHeader) {
          const numberSpan = purchasedHeader.querySelector('span');
          if (numberSpan) {
            count = parseInt(numberSpan.innerText.trim(), 10);
          }
        }
      } 
      else if (retailerName === 'Belk') {
        const itemRows = Array.from(document.querySelectorAll('li'));
        itemRows.forEach(row => {
          const text = row.innerText;
          
          // Match full fulfillment
          if (text.includes('Gift fulfilled')) {
            count += 1;
          }
        });
      }

      return count;
    }, retailer);

    return { retailer, purchasedCount };

  } catch (error) {
    console.error(`Error checking ${retailer}:`, error.message);
    return { retailer, purchasedCount: 0, error: true };
  } finally {
    await browser.close();
  }
}

(async () => {
  const registries = [
    { url: 'https://www.target.com/gift-registry/gift-giver?registryId=e5a1a6c0-0ab9-11f1-8196-85099800eb06&type=WEDDING', name: 'Target' },
    { url: 'https://www.amazon.com/wedding/guest-view/3BSQWXI9ZNJT6?filterBy=ALL', name: 'Amazon' },
    { url: 'https://www.walmart.com/registry/WR/112c03dc-82f2-40e8-a69f-0299f3da3387', name: 'Walmart' },
    { url: 'https://www.belk.com/registry-results/?ID=16daea1fd741acd0bf531109ce&scope=giftregistrysearch', name: 'Belk' }
  ];

  let stats = {};
  let totalPurchased = 0;

  for (const registry of registries) {
    const data = await getPurchasedCount(registry.url, registry.name);
    console.log(`✔ ${data.retailer}: ${data.purchasedCount} items purchased`);
    stats[data.retailer.toLowerCase()] = data.purchasedCount;
    totalPurchased += data.purchasedCount;
  }

  stats.total = totalPurchased;
  stats.lastUpdated = new Date().toISOString();

  fs.writeFileSync('registry-stats.json', JSON.stringify(stats, null, 2));
  console.log('\n--- SUCCESS: registry-stats.json created! ---');
})();