import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Builder, By, until, WebDriver, WebElement } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import { ConfigService } from '@nestjs/config';
import { MessageService } from '../message.service';
import { LinkConversionService } from '../link-conversion.service';
import { ForwardService } from '../forward.service';
import * as chrome from 'selenium-webdriver/chrome';
import * as chromedriver from 'chromedriver';
import { ProductInfo } from '../entities/product-info.interface';
import { scrapeProductInfo } from '../utils/product.utils';
import { getStoreName, buildMessageTemplate } from '../utils/product.utils';

@Injectable()
export class SeleniumService implements OnModuleDestroy {
    private readonly logger = new Logger(SeleniumService.name);
    private driver: WebDriver;
    private isRunning = false;
    private isInitialized = false;
    private readonly CHECK_INTERVAL = 5000; // 5 saniye
    private readonly MAX_MESSAGES = 3; // Son 3 mesajı kontrol et
    private readonly WAIT_TIMEOUT = 60000; // 60 saniye

    constructor(
        private readonly configService: ConfigService,
        private readonly messageService: MessageService,
        private readonly linkConversionService: LinkConversionService,
        private readonly forwardService: ForwardService,
    ) {}

    public async initializeDriver() {
        try {
            // Chrome ayarlarını yapılandır
            const options = new Options();
            
            // Headless modu devre dışı bırak
            
            
            // Chrome'u görünür yap
            options.addArguments('--start-maximized');
            options.addArguments('--window-size=1920,1080');
            options.addArguments('--window-position=0,0');
            
            // Diğer ayarlar
            options.addArguments('--disable-notifications');
            options.addArguments('--disable-popup-blocking');
            options.addArguments('--disable-infobars');
            options.addArguments('--disable-extensions');
            options.addArguments('--no-sandbox');
            options.addArguments('--disable-dev-shm-usage');
            options.addArguments('--disable-blink-features=AutomationControlled');
            options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // Chrome WebDriver'ı başlat
            this.driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .setChromeService(new chrome.ServiceBuilder(chromedriver.path))
                .build();

            // WhatsApp Web'e git
            await this.driver.get('https://web.whatsapp.com');
            this.isInitialized = true;
            this.logger.log('[BILGI] Selenium başarıyla başlatıldı ve WhatsApp Web açıldı.');

           
        } catch (error) {
            this.logger.error('[HATA] Selenium başlatma hatası:', error);
            throw error;
        }
    }

    public async startMonitoring() {
        if (this.isRunning || !this.isInitialized) return;
        this.isRunning = true;

        try {
            // QR kodunun okunmasını bekle
            await this.driver.wait(
                until.elementLocated(By.css("button[aria-label='Kanallar']")),
                this.WAIT_TIMEOUT
            );

            this.logger.log('WhatsApp Web başarıyla bağlandı');

            // QR kodu okunduktan sonra 10 saniye bekle
            this.logger.log('Pop-up kapatmanız için 10 saniye bekleniyor...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            this.logger.log('Bekleme tamamlandı, kanallar sekmesine geçiliyor...');

            // Mesajları kontrol etmeye başla
            while (this.isRunning) {
                try {
                    await this.checkNewMessages();
                    await new Promise(resolve => setTimeout(resolve, this.CHECK_INTERVAL));
                } catch (error) {
                    this.logger.error('Mesaj kontrolü sırasında hata:', error);
                    await new Promise(resolve => setTimeout(resolve, this.CHECK_INTERVAL));
                }
            }
        } catch (error) {
            this.logger.error('WhatsApp Web bağlantısı sırasında hata:', error);
            this.isRunning = false;
            throw error;
        }
    }

    private async checkNewMessages() {
        try {
            // Son mesajları al
            const messages = await this.driver.findElements(
                By.css('div[data-testid="msg-container"]')
            );

            // Son MAX_MESSAGES kadar mesajı kontrol et
            const recentMessages = messages.slice(-this.MAX_MESSAGES);

            for (const message of recentMessages) {
                try {
                    const content = await message.getText();
                    const isProcessed = await this.isAlreadyProcessedLink(content);

                    if (!isProcessed) {
                        // Mesajı işle ve kaydet
                        const convertedContent = await this.linkConversionService.convertLink(content);
                        await this.messageService.create({ content: convertedContent });
                        
                        // Telegram'a ilet
                        await this.forwardService.forwardToTelegram(convertedContent);
                    }
                } catch (error) {
                    this.logger.error('Mesaj işlenirken hata:', error);
                }
            }
        } catch (error) {
            this.logger.error('Mesajlar kontrol edilirken hata:', error);
        }
    }

    private async isAlreadyProcessedLink(content: string): Promise<boolean> {
        try {
            const existingMessage = await this.messageService.findByContent(content);
            return !!existingMessage;
        } catch (error) {
            this.logger.error('Mesaj kontrolü sırasında hata:', error);
            return false;
        }
    }
    private async scrapeProductInfo(link: string): Promise<ProductInfo> {
        // product.utils.ts fonksiyonunu kullan
        return await scrapeProductInfo(this.driver, link);  
    }

    private async closePopupsIfExist(): Promise<void> {
        try {
            // ... önceki selectorlar ...
            // Devam butonunu metne göre bul ve tıkla
            const devamButtons = await this.driver.findElements(By.xpath("//button[.//div[text()='Devam']]"));
            if (devamButtons.length > 0) {
                await devamButtons[0].click();
                this.logger.log('[BILGI] Devam (pop-up) butonuna tıklandı.');
                return;
            }
            // ... diğer pop-up selectorlar ...
        } catch (e) {
            this.logger.warn('[UYARI] Pop-up kapatılırken hata oluştu veya pop-up bulunamadı.');
        }
    }

    public async openChannelsTab() {
        await this.closePopupsIfExist();
        try {
            const channelsTabBtn = await this.driver.wait(
                until.elementIsVisible(
                    await this.driver.wait(
                        until.elementLocated(By.css("button[aria-label='Kanallar']")),
                        15000
                    )
                ),
                15000
            );
            await channelsTabBtn.click();
            await this.driver.wait(
                until.elementLocated(By.css("div[aria-label='Kanal Listesi']")),
                15000
            );
            this.logger.log('[BILGI] Kanallar sekmesi acildi.');
        } catch (e) {
            this.logger.error('[HATA] Kanallar sekmesine gecilemiyor: ', e);
        }
    }

    public async fetchAllChannels() {
        try {
            await this.openChannelsTab();

            await this.driver.wait(
                until.elementsLocated(By.css("div[aria-label='Kanal Listesi'] div[role='listitem']")),
                10000
            );
            const channelElements: WebElement[] = await this.driver.findElements(By.css("div[aria-label='Kanal Listesi'] div[role='listitem']"));

            this.logger.log(`[BILGI] Toplam ${channelElements.length} kanal bulundu.`);

            for (let i = 0; i < channelElements.length; i++) {
                const channel = channelElements[i];
                try {
                    const channelName = await this.getChannelName(channel);
                    const clickableChannel = await this.driver.wait(
                        until.elementIsVisible(channel),
                        10000
                    );

                    // Scroll into view
                    await this.driver.executeScript(
                        "arguments[0].scrollIntoView({block: 'center', behavior: 'instant'});",
                        clickableChannel
                    );

                    try {
                        await clickableChannel.click();
                    } catch (e) {
                        await this.driver.executeScript("arguments[0].click();", clickableChannel);
                    }

                    // Kısa bekleme
                    await this.driver.wait(
                        until.elementLocated(By.css("div[role='application']")),
                        3000
                    );

                    this.logger.log(`[BILGI] Islenen kanal: ${channelName}`);
                    await this.fetchMessagesFromChannel(channelName);
                } catch (e) {
                    this.logger.error('[HATA] Kanal isleme hatasi: ', e);
                }
            }
        } catch (e) {
            this.logger.error('[HATA] Kanal listesi isleme hatasi: ', e);
        }
    }

    // Kanal ismi alma fonksiyonu (stub)
    private async getChannelName(channelElement: WebElement): Promise<string> {
        try {
            const titleElement = await channelElement.findElement(By.css("span[title]"));
            const channelName = await titleElement.getAttribute("title");
            return channelName;
        } catch (e) {
            this.logger.error("[HATA] Kanal adi alma hatasi: ", e);
            return "Bilinmeyen Kanal";
        }
    }

    // Kanal mesajlarını çekme fonksiyonu (stub)
   private async fetchMessagesFromChannel(channelName: string): Promise<void> {
    try {
        // Kısa bekleme: Kanal içeriği yüklensin
        await this.driver.wait(
            until.elementLocated(By.css("div[role='application']")),
            3000
        );

        // Tüm mesajları bul
        const messages: WebElement[] = await this.driver.findElements(By.css("div[role='row']"));

        // Son 3 mesajı al
        const startIndex = Math.max(0, messages.length - 3);
        const lastThreeMessages = messages.slice(startIndex, messages.length);

        for (const message of lastThreeMessages) {
            try {
                const msgType = await this.determineMessageType(message);
                if (msgType === "text") {
                    const textElement = await message.findElement(By.css("span.selectable-text"));
                    const msgContent = await textElement.getText();
                    const sender = await this.getSenderFromMessage(message);

                    await this.processIncomingMessage(
                        msgContent,
                        sender ? sender : channelName
                    );
                }
            } catch (e) {
                this.logger.error("[HATA] Mesaj isleme hatasi: ", e);
            }
        }
    } catch (e) {
        this.logger.error("[HATA] fetchMessagesFromChannel hatasi: ", e);
    }
}


    private async determineMessageType(messageElement: WebElement): Promise<string> {
        try {
            // Metin
            const textSpans = await messageElement.findElements(By.css('span.selectable-text'));
            if (textSpans.length > 0) {
                return 'text';
            }
            // Resim
            const images = await messageElement.findElements(By.css("img[data-testid='image-thumb']"));
            if (images.length > 0) {
                return 'image';
            }
            // Sticker
            const stickers = await messageElement.findElements(By.css("img[data-testid='sticker']"));
            if (stickers.length > 0) {
                return 'sticker';
            }
            // Doküman
            const documents = await messageElement.findElements(By.css("div[data-testid='document-thumb']"));
            if (documents.length > 0) {
                return 'document';
            }
            // Sesli mesaj
            const voices = await messageElement.findElements(By.css("div[data-testid='audio-player']"));
            if (voices.length > 0) {
                return 'voice';
            }
            return 'unknown';
        } catch (e) {
            this.logger.error('[HATA] Mesaj tipi belirleme hatasi: ', e);
            return 'unknown';
        }
    }

    private async getSenderFromMessage(messageElement: WebElement): Promise<string | null> {
        try {
            const senderElement = await messageElement.findElement(By.css("div[data-pre-plain-text]"));
            const senderInfo = await senderElement.getAttribute("data-pre-plain-text");

            // "[15, 2/11/2025] Amazon Indirimleri - OZEL FIRSATLAR:" formatından sadece ismi al
            if (senderInfo && senderInfo.includes("]")) {
                const parts = senderInfo.split("]");
                if (parts.length > 1) {
                    return parts[1].replace(":", "").trim();
                }
            }
            return null;
        } catch (e) {
            this.logger.error("[HATA] Gonderici bilgisi alma hatasi: ", e);
            return null;
        }
    }

    private async processIncomingMessage(whatsappText: string, sender: string): Promise<void> {
        if (!whatsappText || whatsappText.trim().length === 0) {
            this.logger.warn('[UYARI] Bos mesaj alindi');
            return;
        }

        const links: string[] = await this.extractLinks(whatsappText);
        if (links.length === 0) {
            this.logger.debug('[BILGI] Mesajda link bulunamadi');
            return;
        }

        this.logger.log(`[BILGI] Mesajdan ${links.length} adet link bulundu`);

        for (const link of links) {
            let originalWindow: string | null = null;
            try {
                const alreadyProcessed = await this.isAlreadyProcessedLink(link);
                if (alreadyProcessed) {
                    this.logger.log(`[BILGI] Bu link daha once islenmistir: ${link}`);
                    continue;
                }

                originalWindow = await this.processLink(link, sender);
            } catch (e) {
                this.logger.error(`[HATA] Link isleme hatasi: ${(e as Error).message} - Link: ${link}`);
            } finally {
                await this.cleanupBrowser(originalWindow);
            }
        }
    }

    // Stub: Mesajdan linkleri çıkar
    private async extractLinks(text: string): Promise<string[]> {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = text.match(urlRegex) || [];
        const links: string[] = [];
        for (const link of matches) {
            if (!link.includes("amazon.com.tr/hz/wishlist")) {
                links.push(link);
            } else {
                this.logger.log(`[BILGI] Amazon istek listesi linki filtrelendi: ${link}`);
            }
        }
        return links;
    }

    private async processProductInfo(info: ProductInfo, sender: string): Promise<void> {
        try {
            // product.utils.ts'den buildMessageTemplate fonksiyonunu kullan
            const templateMessage = await buildMessageTemplate(
                info,
                async (url) => url // Link dönüştürme fonksiyonu ekleyebilirsin
            );
            const exists = await this.messageService.isProductExists(info.name);
            if (!exists) {
                await this.messageService.saveMessage(info, sender);
                this.logger.log(`[BASARILI] Urun basariyla kaydedildi: ${info.name}`);
                // Telegram'a da göndermek istersen:
                await this.forwardService.forwardToTelegram(templateMessage);
            } else {
                this.logger.log(`[BILGI] Urun zaten mevcut: ${info.name}`);
            }
        } catch (e) {
            this.logger.error(`[HATA] Urun isleme hatasi: ${(e as Error).message}`);
        }
    }

    private async processLink(link: string, sender: string): Promise<string | null> {
        const originalWindow = await this.driver.getWindowHandle();
        this.logger.debug(`[DEBUG] Yeni sekme aciliyor - Link: ${link}`);

        // Yeni sekme aç
        await this.driver.switchTo().newWindow('tab');

        try {
            await this.driver.get(link);

            // Sayfa yüklenmesini bekle
            await this.driver.wait(async (webDriver) => {
                const readyState = await this.driver.executeScript('return document.readyState');
                return readyState === 'complete';
            }, 8000);

            const info = await this.scrapeProductInfo(link);

            if (await this.isValidProductInfo(info)) {
                await this.processProductInfo(info, sender);
            } else {
                this.logger.warn(`[UYARI] Gecersiz urun bilgisi: ${link}`);
            }
        } catch (e: any) {
            if (e.name === 'TimeoutError') {
                this.logger.error(`[ZAMAN ASIMI] Sayfa yukleme zaman asimi: ${link}`);
            } else {
                this.logger.error(`[HATA] Sayfa isleme hatasi: ${e.message} - Link: ${link}`);
            }
        }

        return originalWindow;
    }

   

    // Stub: Ürün bilgisi geçerli mi?
    private async isValidProductInfo(info: ProductInfo): Promise<boolean> {
        // Burada gerçek validasyon yapılacak
        return !!info && !!info.name;
    }

    // Stub: Tarayıcı cleanup
    private async cleanupBrowser(originalWindow: string | null): Promise<void> {
    try {
        const handles = await this.driver.getAllWindowHandles();
        if (handles.length > 1) {
            await this.driver.close();
        }
        if (originalWindow && handles.includes(originalWindow)) {
            await this.driver.switchTo().window(originalWindow);
        }
        // 500ms bekle
        await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
        this.logger.error(`[HATA] Sekme kapatma hatasi: ${(e as Error).message}`);
    }
}

    async onModuleDestroy() {
        this.isRunning = false;
        if (this.driver) {
            await this.driver.quit();
            this.logger.log('Chrome WebDriver kapatıldı');
        }
    }
}
