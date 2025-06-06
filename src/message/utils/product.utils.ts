import { By, until, WebDriver } from 'selenium-webdriver';

export interface ProductInfo {
    name: string;
    price: string;
    imageUrl: string;
    pageUrl: string;
}

export const getStoreName = (url: string): string => {
    if (url.includes("hepsiburada.com")) return "Hepsiburada";
    if (url.includes("amazon.com.tr") || url.includes("amzn")) return "Amazon";
    if (url.includes("trendyol.com")) return "Trendyol";
    if (url.includes("n11.com")) return "N11";
    if (url.includes("boyner")) return "Boyner";
    if (url.includes("mediamarkt")) return "MediaMarkt";
    if (url.includes("getir")) return "Getir";
    if (url.includes("karaca")) return "Karaca";
    if (url.includes("gratis")) return "Gratis";
    return "Diğer";
};

export const isValidProductInfo = (info: ProductInfo): boolean => {
    return Boolean(info.name?.trim() && info.price?.trim());
};

export const buildMessageTemplate = async (
    info: ProductInfo,
    generateTrackingLink: (url: string) => Promise<string>
): Promise<string> => {
    const convertedLink = await generateTrackingLink(info.pageUrl);
    const storeName = getStoreName(info.pageUrl);
    
    let priceInfo = "";
    if (info.price?.trim()) {
        const cleanPrice = info.price
            .replace("₺", "")
            .replace("TL", "")
            .trim()
            .replace(/,$/, "");
        
        if (cleanPrice) {
            priceInfo = `💳 ₺ ${cleanPrice}\n`;
        }
    }
    
    const messageTemplate = `
<b>${info.name}</b>

${priceInfo}🛍 ${storeName}

<b>👉 <a href="${convertedLink}">FIRSATA GİT</a></b>

#işbirliği`;

    if (info.imageUrl?.trim()) {
        return `IMAGE_URL:${info.imageUrl}|||MESSAGE:${messageTemplate}`;
    }
    
    return messageTemplate;
};

export const scrapeHepsiburada = async (driver: WebDriver, info: ProductInfo): Promise<void> => {
    try {
        await driver.wait(until.elementLocated(By.css("[data-test-id='title'], [data-test-id='header-h1']")), 5000);
        
        const nameElement = await driver.findElement(By.css("[data-test-id='title'], [data-test-id='title'],[data-test-id='header-h1']"));
        info.name = await nameElement.getText();

        const priceElement = await driver.findElements(By.css("[data-test-id='price-current-price'], [data-test-id='product-price'],[data-test-id='checkout-price'],[data-test-id='price'] span"));
        if (priceElement.length > 0) {
            info.price = await priceElement[0].getText();
        }

        const imageElements = await driver.findElements(By.css("img[class*='hb-HbImage-view_image']"));
        if (imageElements.length > 0) {
            info.imageUrl = await imageElements[0].getAttribute("src");
        }
    } catch (error) {
        throw new Error(`Hepsiburada ürün bilgisi çekme hatası: ${error.message}`);
    }
};

export const scrapeAmazon = async (driver: WebDriver, info: ProductInfo): Promise<void> => {
    try {
        await driver.wait(until.elementLocated(By.css("#productTitle, #promotionTitle span.a-size-extra-large.a-text-bold")), 5000);
        
        const nameElements = await driver.findElements(By.css("#productTitle"));
        if (nameElements.length > 0) {
            info.name = await nameElements[0].getText();
        }

        const priceElements = await driver.findElements(By.css("span.a-price-whole"));
        if (priceElements.length > 0) {
            info.price = await priceElements[0].getText();
        }

        const imageElements = await driver.findElements(By.css("img#landingImage.a-dynamic-image"));
        if (imageElements.length > 0) {
            info.imageUrl = await imageElements[0].getAttribute("src");
        }
    } catch (error) {
        throw new Error(`Amazon ürün bilgisi çekme hatası: ${error.message}`);
    }
};

export const scrapeTrendyol = async (driver: WebDriver, info: ProductInfo): Promise<void> => {
    try {
        await driver.wait(until.elementLocated(By.css(".pr-new-br")), 5000);
        
        const nameElement = await driver.findElement(By.css(".pr-new-br"));
        info.name = await nameElement.getText();

        const priceElements = await driver.findElements(By.css(".prc-dsc, .prc-slg"));
        if (priceElements.length > 0) {
            info.price = await priceElements[0].getText();
        }

        const imageElements = await driver.findElements(By.css(".base-product-image img"));
        if (imageElements.length > 0) {
            info.imageUrl = await imageElements[0].getAttribute("src");
        }
    } catch (error) {
        throw new Error(`Trendyol ürün bilgisi çekme hatası: ${error.message}`);
    }
};

export const scrapeN11 = async (driver: WebDriver, info: ProductInfo): Promise<void> => {
    try {
        await driver.wait(until.elementLocated(By.css(".proName")), 5000);
        
        const nameElement = await driver.findElement(By.css(".proName"));
        info.name = await nameElement.getText();

        const priceElements = await driver.findElements(By.css(".newPrice"));
        if (priceElements.length > 0) {
            info.price = await priceElements[0].getText();
        }

        const imageElements = await driver.findElements(By.css(".imgObj img"));
        if (imageElements.length > 0) {
            info.imageUrl = await imageElements[0].getAttribute("src");
        }
    } catch (error) {
        throw new Error(`N11 ürün bilgisi çekme hatası: ${error.message}`);
    }
};

export const scrapeMediaMarkt = async (driver: WebDriver, info: ProductInfo): Promise<void> => {
    try {
        await driver.wait(until.elementLocated(By.css("h1.dScdZY")), 5000);
        
        const nameElement = await driver.findElement(By.css("h1.dScdZY"));
        info.name = await nameElement.getText();

        const priceElements = await driver.findElements(By.css("[data-test='branded-price-whole-value']"));
        if (priceElements.length > 0) {
            info.price = await priceElements[0].getText();
        }

        const imageElements = await driver.findElements(By.css("img[class*='pdp-gallery-image']"));
        if (imageElements.length > 0) {
            info.imageUrl = await imageElements[0].getAttribute("src");
        }
    } catch (error) {
        throw new Error(`MediaMarkt ürün bilgisi çekme hatası: ${error.message}`);
    }
};

export const scrapeBoyner = async (driver: WebDriver, info: ProductInfo): Promise<void> => {
    try {
        await driver.wait(until.elementLocated(By.css(".title_subtitle__9USXk")), 5000);
        
        const nameElement = await driver.findElement(By.css(".title_subtitle__9USXk"));
        info.name = await nameElement.getText();

        const priceElements = await driver.findElements(By.css(".product-price_checkPrice__NMY9e"));
        if (priceElements.length > 0) {
            info.price = await priceElements[0].getText();
        }

        const imageElements = await driver.findElements(By.css("img[data-nimg='intrinsic']"));
        if (imageElements.length > 0) {
            info.imageUrl = await imageElements[0].getAttribute("src");
        }
    } catch (error) {
        throw new Error(`Boyner ürün bilgisi çekme hatası: ${error.message}`);
    }
};

export const scrapeKaraca = async (driver: WebDriver, info: ProductInfo): Promise<void> => {
    try {
        await driver.wait(until.elementLocated(By.css("h1.title")), 5000);
        
        const nameElement = await driver.findElement(By.css("h1.title"));
        info.name = await nameElement.getText();

        const priceElements = await driver.findElements(By.css("span.new"));
        if (priceElements.length > 0) {
            info.price = await priceElements[0].getText();
        }

        const imageElements = await driver.findElements(By.css("a[data-fslightbox='gallery-web'] img[src*='cdn.karaca.com']"));
        if (imageElements.length > 0) {
            info.imageUrl = await imageElements[0].getAttribute("src");
        }
    } catch (error) {
        throw new Error(`Karaca ürün bilgisi çekme hatası: ${error.message}`);
    }
};

export const scrapeGratis = async (driver: WebDriver, info: ProductInfo): Promise<void> => {
    try {
        await driver.wait(until.elementLocated(By.css("h1.product-title.pdp-product-title")), 10000);
        
        const nameElements = await driver.findElements(By.css("h1.product-title.pdp-product-title"));
        if (nameElements.length > 0) {
            info.name = await nameElements[0].getText();
        }

        const priceElements = await driver.findElements(By.css("div.card-price > span:first-child"));
        if (priceElements.length > 0) {
            info.price = await priceElements[0].getText();
        }

        const imageElements = await driver.findElements(By.css("app-custom-media img[src*='mnpadding']"));
        if (imageElements.length > 0) {
            info.imageUrl = await imageElements[0].getAttribute("src");
        }
    } catch (error) {
        throw new Error(`Gratis ürün bilgisi çekme hatası: ${error.message}`);
    }
};

export const scrapeProductInfo = async (driver: WebDriver, url: string): Promise<ProductInfo> => {
    const info: ProductInfo = {
        name: '',
        price: '',
        imageUrl: '',
        pageUrl: url
    };

    try {
        const finalUrl = await driver.getCurrentUrl();
        info.pageUrl = finalUrl;

        if (finalUrl.includes("amazon.com.tr") && finalUrl.includes("wishlist")) {
            throw new Error("Amazon wishlist sayfası tespit edildi");
        }

        const isSupportedSite = finalUrl.includes("hepsiburada.com") ||
                              finalUrl.includes("amazon.com.tr") ||
                              finalUrl.includes("amzn") ||
                              finalUrl.includes("trendyol.com") ||
                              finalUrl.includes("n11.com") ||
                              finalUrl.includes("mediamarkt") ||
                              finalUrl.includes("boyner") ||
                              finalUrl.includes("karaca") ||
                              finalUrl.includes("gratis");

        if (!isSupportedSite) {
            throw new Error("Desteklenmeyen site tespit edildi");
        }

        await driver.wait(until.elementLocated(By.css('body')), 5000);

        if (finalUrl.includes("hepsiburada.com")) {
            await scrapeHepsiburada(driver, info);
        } else if (finalUrl.includes("amazon.com.tr") || finalUrl.includes("amzn")) {
            await scrapeAmazon(driver, info);
        } else if (finalUrl.includes("trendyol.com")) {
            await scrapeTrendyol(driver, info);
        } else if (finalUrl.includes("n11.com")) {
            await scrapeN11(driver, info);
        } else if (finalUrl.includes("mediamarkt")) {
            await scrapeMediaMarkt(driver, info);
        } else if (finalUrl.includes("boyner")) {
            await scrapeBoyner(driver, info);
        } else if (finalUrl.includes("karaca")) {
            await scrapeKaraca(driver, info);
        } else if (finalUrl.includes("gratis")) {
            await scrapeGratis(driver, info);
        }

        return info;
    } catch (error) {
        throw new Error(`Ürün bilgisi çekme hatası: ${error.message}`);
    }
}; 