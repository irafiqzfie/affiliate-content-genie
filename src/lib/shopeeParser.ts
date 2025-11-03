/**
 * Shopee Product Parser with Puppeteer Support
 * Fetches publicly available Shopee product data without authentication
 * 
 * Strategy:
 * 1. Try Puppeteer headless browser (renders JavaScript, most reliable)
 * 2. Try Shopee's internal API endpoint (fast JSON)
 * 3. Try scraping HTML meta tags (SEO data)
 * 4. Fallback to URL-based data extraction
 */

import puppeteer, { Browser, Page } from 'puppeteer';

export interface ShopeeProductInfo {
  title: string;
  price: string;
  image: string;
  description: string;
}

// Global browser instance to avoid launching new browser for each request
let globalBrowser: Browser | null = null;

/**
 * Get or create a persistent Puppeteer browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (globalBrowser && globalBrowser.isConnected()) {
    return globalBrowser;
  }

  console.log('🚀 Launching Puppeteer browser...');
  try {
    globalBrowser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process', // For serverless environments
      ],
    });
    console.log('✅ Puppeteer browser launched successfully');
    return globalBrowser;
  } catch (error) {
    console.error('❌ Failed to launch Puppeteer:', error);
    throw error;
  }
}

/**
 * Parses a Shopee product page to extract basic public information
 * @param productUrl - The Shopee product URL
 * @returns Promise with product info or null if parsing fails
 */
export async function parseShopeeProduct(productUrl: string): Promise<ShopeeProductInfo | null> {
  try {
    // Validate Shopee URL
    if (!productUrl.toLowerCase().includes('shopee')) {
      throw new Error('Not a valid Shopee URL');
    }

    console.log('🔍 Parsing Shopee URL:', productUrl);

    // Extract product name and ID from URL
    const urlInfo = extractUrlInfo(productUrl);
    console.log('📋 URL Info:', urlInfo);

    // Strategy 1: Try Shopee's API (may return 403 for public products)
    if (urlInfo.shopId && urlInfo.itemId) {
      const apiData = await fetchFromShopeeAPI(urlInfo.shopId, urlInfo.itemId);
      if (apiData && apiData.title !== 'Product title not available') {
        console.log('✅ Successfully fetched from Shopee API');
        return apiData;
      }
    }

    // Strategy 2: Try direct HTML fetch and parse SSR content
    let html = '';
    let fetchSucceeded = false;
    
    try {
      const response = await fetch(productUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://www.google.com/',
        },
        redirect: 'follow',
      });

      if (response.ok) {
        html = await response.text();
        fetchSucceeded = true;
        console.log('✅ Successfully fetched Shopee page HTML');
        
        // Try to extract from SSR data in HTML
        const ssrData = extractFromSSRData(html);
        if (ssrData && (ssrData.title !== 'Product title not found' || ssrData.image !== '/placeholder-product.png')) {
          console.log('✅ Extracted data from SSR HTML');
          return ssrData;
        }
      }
    } catch (fetchError) {
      console.warn('⚠️ Could not fetch Shopee page directly:', fetchError);
    }

    // Strategy 3: Try Puppeteer (last resort, may fail due to bot detection)
    console.log('🤖 Attempting Puppeteer browser scraping as last resort...');
    const puppeteerData = await fetchFromShopeePuppeteer(productUrl);
    if (puppeteerData && puppeteerData.title !== 'Product information available on Shopee') {
      console.log('✅ Successfully fetched via Puppeteer');
      return puppeteerData;
    }

    // Strategy 4: Fallback to URL-based data
    console.log('📝 Using URL-based fallback data');
    return {
      title: urlInfo.productName,
      price: 'Price information available on Shopee',
      image: '/placeholder-product.png',
      description: `${urlInfo.productName} - View full details on Shopee`,
    };
  } catch (error) {
    console.error('❌ Error parsing Shopee product:', error);
    
    // Last resort fallback
    try {
      const urlInfo = extractUrlInfo(productUrl);
      return {
        title: urlInfo.productName,
        price: 'Check Shopee for current price',
        image: '/placeholder-product.png',
        description: `${urlInfo.productName} - Product information available on Shopee`,
      };
    } catch {
      return null;
    }
  }
}

/**
 * Extract product data from server-side rendered data in HTML
 * Shopee often includes JSON data in script tags for SEO
 */
function extractFromSSRData(html: string): ShopeeProductInfo | null {
  try {
    // Look for __INITIAL_STATE__ or similar JSON data
    const stateMatch = html.match(/<script>window\.__INITIAL_STATE__\s*=\s*({.+?})<\/script>/);
    if (stateMatch) {
      const state = JSON.parse(stateMatch[1]);
      if (state.item) {
        return {
          title: state.item.name || 'Product title not found',
          price: state.item.price ? formatPrice(state.item.price / 100000) : 'Price not available',
          image: state.item.image ? `https://cf.shopee.com.my/file/${state.item.image}` : '/placeholder-product.png',
          description: state.item.description || 'Description not available',
        };
      }
    }

    // Try meta tags
    const title = extractTitle(html);
    const price = extractPrice(html);
    const image = extractImage(html);
    const description = extractDescription(html);

    if (title !== 'Product title not found' || image !== '/placeholder-product.png') {
      return { title, price, image, description };
    }

    return null;
  } catch (error) {
    console.warn('⚠️ Failed to extract SSR data:', error);
    return null;
  }
}

/**
 * Extract product name and ID from Shopee URL
 */
function extractUrlInfo(url: string): { productName: string; productId: string; shopId: string; itemId: string } {
  // Shopee URL format: https://shopee.com.my/Product-Name-Here-i.123456.987654321
  const urlParts = url.split('/');
  const lastPart = urlParts[urlParts.length - 1] || '';
  
  // Decode URL-encoded characters
  let decodedPart = '';
  try {
    decodedPart = decodeURIComponent(lastPart);
  } catch {
    decodedPart = lastPart;
  }
  
  // Extract product name from slug
  let productName = decodedPart
    .replace(/\?.*/, '') // Remove query params
    .replace(/-i\.\d+\.\d+.*/, '') // Remove product ID part
    .split('-')
    .filter(word => word.length > 0) // Filter empty strings
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
  
  // Clean up any remaining special characters
  productName = productName.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (!productName || productName.length < 3) {
    productName = 'Shopee Product';
  }
  
  // Extract shop ID and item ID
  const idMatch = lastPart.match(/i\.(\d+)\.(\d+)/);
  const shopId = idMatch ? idMatch[1] : '';
  const itemId = idMatch ? idMatch[2] : '';
  const productId = idMatch ? `${shopId}.${itemId}` : '';
  
  console.log('🔧 Decoded URL part:', { decodedPart, productName, shopId, itemId });
  
  return { productName, productId, shopId, itemId };
}

/**
 * Fetch product data using Puppeteer headless browser
 * This is a last resort when other methods fail
 */
async function fetchFromShopeePuppeteer(productUrl: string): Promise<ShopeeProductInfo | null> {
  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log('📄 Navigating to Shopee page with Puppeteer...');
    
    // Simple navigation without strict waiting
    await page.goto(productUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    }).catch(() => {
      console.warn('⚠️ Puppeteer navigation timeout, continuing anyway...');
    });

    // Wait a bit for JS to render
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get the page content as HTML
    const html = await page.content();
    
    // Close page immediately to avoid frame detachment
    await page.close();
    page = null;

    console.log('✅ Puppeteer page content retrieved');

    // Parse the rendered HTML
    const title = extractTitle(html);
    const price = extractPrice(html);
    const image = extractImage(html);
    const description = extractDescription(html);

    if (title !== 'Product title not found' || image !== '/placeholder-product.png') {
      return { title, price, image, description };
    }

    return null;
  } catch (error) {
    console.error('❌ Puppeteer scraping error:', error);
    return null;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}
async function fetchFromShopeeAPI(shopId: string, itemId: string): Promise<ShopeeProductInfo | null> {
  try {
    // Shopee's API endpoint for product details
    const apiUrl = `https://shopee.com.my/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`;
    
    console.log('🌐 Trying Shopee API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://shopee.com.my/',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('⚠️ Shopee API returned status:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('✅ Shopee API response received');

    // Extract data from API response
    if (data && data.data) {
      const item = data.data;
      
      return {
        title: item.name || 'Product title not available',
        price: item.price ? formatPrice(item.price / 100000) : 'Price not available', // Shopee stores price in cents * 1000
        image: item.image ? `https://cf.shopee.com.my/file/${item.image}` : '/placeholder-product.png',
        description: item.description || 'Description not available',
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Shopee API error:', error);
    return null;
  }
}



/**
 * Extract product title from HTML
 */
function extractTitle(html: string): string {
  // Try meta tags first (most reliable)
  const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
  if (ogTitleMatch && ogTitleMatch[1]) {
    return decodeHtmlEntities(ogTitleMatch[1]);
  }

  // Try title tag
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    // Clean up title (remove " | Shopee Malaysia" etc.)
    return decodeHtmlEntities(titleMatch[1].split('|')[0].trim());
  }

  // Try schema.org JSON-LD
  const schemaMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (schemaMatch) {
    try {
      const schema = JSON.parse(schemaMatch[1]);
      if (schema.name) {
        return schema.name;
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  return 'Product title not found';
}

/**
 * Extract product price from HTML
 */
function extractPrice(html: string): string {
  // Try meta tags
  const priceMatch = html.match(/<meta\s+property="product:price:amount"\s+content="([^"]+)"/i);
  if (priceMatch && priceMatch[1]) {
    return formatPrice(priceMatch[1]);
  }

  // Try og:price:amount
  const ogPriceMatch = html.match(/<meta\s+property="og:price:amount"\s+content="([^"]+)"/i);
  if (ogPriceMatch && ogPriceMatch[1]) {
    return formatPrice(ogPriceMatch[1]);
  }

  // Try to find price in schema.org
  const schemaMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (schemaMatch) {
    try {
      const schema = JSON.parse(schemaMatch[1]);
      if (schema.offers && schema.offers.price) {
        return formatPrice(schema.offers.price);
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  // Try common price patterns in the HTML
  const pricePatternMatch = html.match(/RM\s*(\d+(?:\.\d{2})?)/i);
  if (pricePatternMatch && pricePatternMatch[1]) {
    return formatPrice(pricePatternMatch[1]);
  }

  return 'Price not available';
}

/**
 * Extract product image URL from HTML
 */
function extractImage(html: string): string {
  // Try og:image meta tag (most reliable)
  const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  if (ogImageMatch && ogImageMatch[1]) {
    return ogImageMatch[1];
  }

  // Try twitter:image
  const twitterImageMatch = html.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i);
  if (twitterImageMatch && twitterImageMatch[1]) {
    return twitterImageMatch[1];
  }

  // Try schema.org
  const schemaMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (schemaMatch) {
    try {
      const schema = JSON.parse(schemaMatch[1]);
      if (schema.image) {
        return Array.isArray(schema.image) ? schema.image[0] : schema.image;
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  return '/placeholder-product.png';
}

/**
 * Extract product description from HTML
 */
function extractDescription(html: string): string {
  // Try og:description meta tag
  const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
  if (ogDescMatch && ogDescMatch[1]) {
    return decodeHtmlEntities(ogDescMatch[1]);
  }

  // Try meta description
  const metaDescMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  if (metaDescMatch && metaDescMatch[1]) {
    return decodeHtmlEntities(metaDescMatch[1]);
  }

  // Try schema.org
  const schemaMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (schemaMatch) {
    try {
      const schema = JSON.parse(schemaMatch[1]);
      if (schema.description) {
        return schema.description;
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  return 'Description not available';
}

/**
 * Format price with currency
 */
function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) {
    return 'Price not available';
  }
  return `RM ${numPrice.toFixed(2)}`;
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };

  return text.replace(/&(?:amp|lt|gt|quot|#39|apos);/g, (match) => entities[match] || match);
}

/**
 * Gracefully close the Puppeteer browser
 * Call this during app shutdown to cleanup resources
 */
export async function closeShopeeParser(): Promise<void> {
  if (globalBrowser && globalBrowser.isConnected()) {
    console.log('🛑 Closing Puppeteer browser...');
    try {
      await globalBrowser.close();
      globalBrowser = null;
      console.log('✅ Puppeteer browser closed');
    } catch (error) {
      console.error('❌ Error closing Puppeteer browser:', error);
    }
  }
}
