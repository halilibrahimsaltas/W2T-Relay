import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Builder, By, until, WebDriver, WebElement } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import { Cron } from '@nestjs/schedule';
import { MessageService } from '../message.service';
import { LinkConversionService } from '../link-conversion.service';
import { ForwardService } from '../forward.service';
import { ProductInfo, isValidProductInfo, buildMessageTemplate, scrapeProductInfo } from '../utils/product.utils';
import * as chrome from 'chromedriver';

@Injectable()
export class SeleniumService implements OnModuleInit {
    private driver: WebDriver;
    private isInitialized = false;
    private readonly logger = new Logger(SeleniumService.name);
    private readonly LINK_PATTERN = /(https?:\/\/[^\s]+)/g;

    constructor(
        private readonly messageService: MessageService,
        private readonly linkConversionService: LinkConversionService,
        private readonly forwardService: ForwardService,
    ) {}

    async onModuleInit() {
        await this.init();
    }

    private async init() {
        try {
            const options = new Options();
            options.addArguments('--headless');
            options.addArguments('--no-sandbox');
            options.addArguments('--disable-dev-shm-usage');
            options.addArguments('--disable-gpu');
            options.addArguments('--window-size=1920,1080');
            options.addArguments('--disable-notifications');
            options.addArguments('--disable-extensions');
            options.addArguments('--disable-infobars');
            options.addArguments('--disable-popup-blocking');
            options.addArguments('--disable-blink-features=AutomationControlled');
            options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // Chrome WebDriver'ı başlat
            const service = new chrome.ServiceBuilder(chrome.path).build();
            
            this.driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .setChromeService(service)
                .build();

            await this.driver.get('https://web.whatsapp.com');
            this.isInitialized = true;
            this.logger.log('[BILGI] Selenium başarıyla başlatıldı ve WhatsApp Web açıldı.');
            
            // QR kodu okutma süresi
            this.logger.log('[BILGI] Lütfen WhatsApp Web QR kodunu telefonunuzdan okutun (60 saniye süreniz var)');
            await new Promise(resolve => setTimeout(resolve, 60000));
            
        } catch (error) {
            this.logger.error('[HATA] Selenium başlatma hatası:', error);
            if (this.driver) {
                try {
                    await this.driver.quit();
                } catch (quitError) {
                    this.logger.error('[HATA] Driver kapatma hatası:', quitError);
                }
            }
            this.isInitialized = false;
        }
    }

    @Cron('*/5 * * * * *')
    async startListening() {
        try {
            if (!this.isInitialized || !this.driver) {
                this.logger.warn('[UYARI] Driver başlatılmamış, yeniden başlatılıyor...');
                await this.init();
                return;
            }
            await this.fetchAllChannels();
        } catch (error) {
            this.logger.error('[HATA] Dinleme hatası:', error);
            this.isInitialized = false;
            if (this.driver) {
                try {
                    await this.driver.quit();
                } catch (quitError) {
                    this.logger.error('[HATA] Driver kapatma hatası:', quitError);
                }
                this.driver = null;
            }
        }
    }

    private async openChannelsTab() {
        try {
            const wait = await this.driver.wait(until.elementLocated(By.css("button[aria-label='Kanallar']")), 15000);
            await wait.click();
            await this.driver.wait(until.elementLocated(By.css("div[aria-label='Kanal Listesi']")), 15000);
            this.logger.log('[BILGI] Kanallar sekmesi açıldı.');
        } catch (error) {
            this.logger.error('[HATA] Kanallar sekmesine geçilemiyor:', error);
        }
    }

    private async fetchAllChannels() {
        try {
            await this.openChannelsTab();
            const channelElements = await this.driver.findElements(By.css("div[aria-label='Kanal Listesi'] div[role='listitem']"));
            this.logger.log(`[BILGI] Toplam ${channelElements.length} kanal bulundu.`);

            for (const channel of channelElements) {
                try {
                    const channelName = await this.getChannelName(channel);
                    await this.driver.executeScript("arguments[0].scrollIntoView({block: 'center', behavior: 'instant'});", channel);
                    await channel.click();

                    await this.driver.wait(until.elementLocated(By.css("div[role='application']")), 3000);
                    this.logger.log(`[BILGI] İşlenen kanal: ${channelName}`);
                    await this.fetchMessagesFromChannel(channelName);
                } catch (error) {
                    this.logger.error('[HATA] Kanal işleme hatası:', error);
                }
            }
        } catch (error) {
            this.logger.error('[HATA] Kanal listesi işleme hatası:', error);
        }
    }

    private async getChannelName(channelElement: WebElement): Promise<string> {
        try {
            const titleElement = await channelElement.findElement(By.css("span[title]"));
            return await titleElement.getAttribute("title");
        } catch (error) {
            this.logger.error('[HATA] Kanal adı alma hatası:', error);
            return "Bilinmeyen Kanal";
        }
    }

    private async fetchMessagesFromChannel(channelName: string) {
        try {
            await this.driver.wait(until.elementLocated(By.css("div[role='application']")), 3000);
            const messages = await this.driver.findElements(By.css("div[role='row']"));
            const lastThreeMessages = messages.slice(-3);

            for (const message of lastThreeMessages) {
                try {
                    const msgType = await this.determineMessageType(message);
                    if (msgType === "text") {
                        const textElement = await message.findElement(By.css("span.selectable-text"));
                        const msgContent = await textElement.getText();
                        const sender = await this.getSenderFromMessage(message);
                        await this.processIncomingMessage(msgContent, sender || channelName);
                    }
                } catch (error) {
                    this.logger.error('[HATA] Mesaj işleme hatası:', error);
                }
            }
        } catch (error) {
            this.logger.error('[HATA] fetchMessagesFromChannel hatası:', error);
        }
    }

    private async determineMessageType(messageElement: WebElement): Promise<string> {
        try {
            if (await messageElement.findElements(By.css("span.selectable-text")).then(e => e.length > 0)) {
                return "text";
            }
            if (await messageElement.findElements(By.css("img[data-testid='image-thumb']")).then(e => e.length > 0)) {
                return "image";
            }
            if (await messageElement.findElements(By.css("img[data-testid='sticker']")).then(e => e.length > 0)) {
                return "sticker";
            }
            if (await messageElement.findElements(By.css("div[data-testid='document-thumb']")).then(e => e.length > 0)) {
                return "document";
            }
            if (await messageElement.findElements(By.css("div[data-testid='audio-player']")).then(e => e.length > 0)) {
                return "voice";
            }
            return "unknown";
        } catch (error) {
            this.logger.error('[HATA] Mesaj tipi belirleme hatası:', error);
            return "unknown";
        }
    }

    private async getSenderFromMessage(messageElement: WebElement): Promise<string | null> {
        try {
            const senderElement = await messageElement.findElement(By.css("div[data-pre-plain-text]"));
            const senderInfo = await senderElement.getAttribute("data-pre-plain-text");

            if (senderInfo && senderInfo.includes("]")) {
                const parts = senderInfo.split("]");
                if (parts.length > 1) {
                    return parts[1].replace(":", "").trim();
                }
            }
            return null;
        } catch (error) {
            this.logger.error('[HATA] Gönderici bilgisi alma hatası:', error);
            return null;
        }
    }

    private extractLinks(text: string): string[] {
        const links: string[] = [];
        let match;
        while ((match = this.LINK_PATTERN.exec(text)) !== null) {
            const link = match[1];
            if (!link.includes("amazon.com.tr/hz/wishlist")) {
                links.push(link);
            } else {
                this.logger.log(`[BILGI] Amazon istek listesi linki filtrelendi: ${link}`);
            }
        }
        return links;
    }

    async processIncomingMessage(whatsappText: string, sender: string) {
        if (!whatsappText?.trim()) {
            this.logger.warn('[UYARI] Boş mesaj alındı');
            return;
        }

        const links = this.extractLinks(whatsappText);
        if (links.length === 0) {
            this.logger.debug('[BILGI] Mesajda link bulunamadı');
            return;
        }

        this.logger.log(`[BILGI] Mesajdan ${links.length} adet link bulundu`);

        for (const link of links) {
            let originalWindow: string | null = null;
            try {
                if (await this.isAlreadyProcessedLink(link)) {
                    this.logger.log(`[BILGI] Bu link daha önce işlenmiştir: ${link}`);
                    continue;
                }

                originalWindow = await this.processLink(link, sender);
            } catch (error) {
                this.logger.error(`[HATA] Link işleme hatası: ${error.message} - Link: ${link}`);
            } finally {
                await this.cleanupBrowser(originalWindow);
            }
        }
    }

    private async processLink(link: string, sender: string): Promise<string> {
        const originalWindow = await this.driver.getWindowHandle();
        this.logger.debug(`[DEBUG] Yeni sekme açılıyor - Link: ${link}`);
        
        await this.driver.switchTo().newWindow('tab');
        
        try {
            await this.driver.get(link);
            await this.driver.wait(until.elementLocated(By.css('body')), 8000);
            
            const info = await scrapeProductInfo(this.driver, link);
            
            if (isValidProductInfo(info)) {
                await this.processProductInfo(info, sender);
            } else {
                this.logger.warn(`[UYARI] Geçersiz ürün bilgisi: ${link}`);
            }
        } catch (error) {
            this.logger.error(`[HATA] Sayfa işleme hatası: ${error.message} - Link: ${link}`);
        }
        
        return originalWindow;
    }

    private async processProductInfo(info: ProductInfo, sender: string) {
        try {
            const templateMessage = await buildMessageTemplate(
                info,
                (url) => this.linkConversionService.generateTrackingLink(url)
            );
            if (!await this.messageService.isProductExists(info.name)) {
                await this.messageService.saveMessage(templateMessage, sender);
                this.logger.log(`[BASARILI] Ürün başarıyla kaydedildi: ${info.name}`);
            } else {
                this.logger.log(`[BILGI] Ürün zaten mevcut: ${info.name}`);
            }
        } catch (error) {
            this.logger.error('[HATA] Ürün işleme hatası:', error);
        }
    }

    private async cleanupBrowser(originalWindow: string | null) {
        try {
            const handles = await this.driver.getAllWindowHandles();
            if (handles.length > 1) {
                await this.driver.close();
            }
            if (originalWindow && handles.includes(originalWindow)) {
                await this.driver.switchTo().window(originalWindow);
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            this.logger.error('[HATA] Sekme kapatma hatası:', error);
        }
    }

    private async isAlreadyProcessedLink(link: string): Promise<boolean> {
        // Implement the logic to check if the link has already been processed
        return false;
    }

    async closeDriver() {
        if (this.driver) {
            await this.driver.quit();
        }
    }
}
