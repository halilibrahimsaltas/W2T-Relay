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
    private readonly CHANNEL_CHECK_TIMEOUT = 10000; // 10 saniye
    private readonly MAX_RETRIES = 3; // Maksimum deneme sayısı
    private readonly IDLE_CHANNEL_NAME = "BOT-BEKLEME";

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
            await this.driver.wait(
                until.elementLocated(By.css("button[aria-label='Kanallar']")),
                this.WAIT_TIMEOUT
            );
    
            this.logger.log('WhatsApp Web başarıyla bağlandı');
            await new Promise(resolve => setTimeout(resolve, 10000));
    
            // Başlangıçta tüm kanallar bir kez işlenir
            await this.initialScanAllChannelsOnce();
    
            // Sürekli olarak sadece okunmamış mesajları kontrol eder
            await this.monitorUnreadChannelsLoop();
    
        } catch (error) {
            this.logger.error('WhatsApp Web bağlantısı sırasında hata:', error);
            this.isRunning = false;
            throw error;
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

    private async initialScanAllChannelsOnce(): Promise<void> {
        this.logger.log('[BILGI] Başlangıç kanal taraması başlatıldı...');
        try {
            await this.openChannelsTab();
    
            const channelElements = await this.driver.findElements(By.css("div[aria-label='Kanal Listesi'] div[role='listitem']"));
            this.logger.log(`[BILGI] ${channelElements.length} kanal bulundu (ilk tarama).`);
    
            for (const channel of channelElements) {
                try {
                    const channelName = await this.getChannelName(channel);
                    await this.scrollAndClick(channel);
                    this.logger.log(`[BILGI] İlk taramada kanal işleniyor: ${channelName}`);
                    await this.fetchMessagesFromChannel(channelName);
                } catch (e) {
                    this.logger.error('[HATA] İlk taramada kanal işlenemedi:', e);
                }
            }
    
            this.logger.log('[BILGI] Başlangıç kanal taraması tamamlandı.');
        } catch (e) {
            this.logger.error('[HATA] İlk kanal taraması sırasında hata:', e);
        }
    }

    private async monitorUnreadChannelsLoop(): Promise<void> {
        this.logger.log('[BILGI] Okunmamış mesaj kontrol döngüsü başlatıldı...');
        while (this.isRunning) {
            try {
                 
                const channelElements = await this.driver.findElements(By.css("div[aria-label='Kanal Listesi'] div[role='listitem']"));
                let unreadProcessed = false;

                for (const channel of channelElements) {
                    try {
                        const unreadBadge = await channel.findElements(By.css("span[aria-label*='okunmamış mesaj']"));
                        if (unreadBadge.length === 0) continue;
                        const channelName = await this.getChannelName(channel);
                        await this.scrollAndClick(channel);
                        this.logger.log(`[BILGI] Okunmamış mesaj bulunan kanal: ${channelName}`);
                        await this.fetchMessagesFromChannel(channelName);
                        unreadProcessed = true;
                    } catch (e) {
                        this.logger.error('[HATA] Okunmamış kanal işleme hatası:', e);
                    }
                }

                if (unreadProcessed) {
                    // 10 saniye boyunca yeni okunmamış mesaj var mı kontrol et
                    const waitUntil = Date.now() + 10000; // 10 saniye
                    let newUnreadFound = false;
                    while (Date.now() < waitUntil) {
                        await new Promise(res => setTimeout(res, 1000)); // 1 sn bekle
                        const channels = await this.driver.findElements(By.css("div[aria-label='Kanal Listesi'] div[role='listitem']"));
                        for (const channel of channels) {
                            const unreadBadge = await channel.findElements(By.css("span[aria-label*='okunmamış mesaj']"));
                            if (unreadBadge.length > 0) {
                                newUnreadFound = true;
                                break;
                            }
                        }
                        if (newUnreadFound) break;
                    }
                    if (!newUnreadFound) {
                        await this.switchToIdleChannel(this.IDLE_CHANNEL_NAME);
                    }
                }

                await new Promise(res => setTimeout(res, this.CHECK_INTERVAL));
            } catch (e) {
                this.logger.error('[HATA] Okunmamış kanallar döngüsü hatası:', e);
                // this.isRunning = false; // Bunu kaldır!
                await new Promise(res => setTimeout(res, this.CHECK_INTERVAL));
            }
        }
    }
    
    // Kullanılmayan kanala geçiş fonksiyonu
    private async switchToIdleChannel(channelName: string): Promise<void> {
        const channelElements = await this.driver.findElements(By.css("div[aria-label='Kanal Listesi'] div[role='listitem']"));
        for (const channel of channelElements) {
            const name = await this.getChannelName(channel);
            if (name === channelName) {
                await this.scrollAndClick(channel);
                this.logger.log(`[BILGI] Bekleme kanalına geçildi: ${channelName}`);
                break;
            }
        }
    }
    private async scrollAndClick(channel: WebElement): Promise<void> {
        await this.driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", channel);
        try {
            await channel.click();
        } catch {
            await this.driver.executeScript("arguments[0].click();", channel);
        }
        await this.driver.wait(until.elementLocated(By.css("div[role='application']")), 3000);

    
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
    let retryCount = 0;
    
    while (retryCount < this.MAX_RETRIES) {
    try {
        // Kısa bekleme: Kanal içeriği yüklensin
        await this.driver.wait(
            until.elementLocated(By.css("div[role='application']")),
                this.CHANNEL_CHECK_TIMEOUT
        );

        // Tüm mesajları bul
        const messages: WebElement[] = await this.driver.findElements(By.css("div[role='row']"));

            // Eğer mesaj yoksa veya çok az mesaj varsa, bir sonraki kanala geç
            if (messages.length === 0) {
                this.logger.log(`[BILGI] ${channelName} kanalında mesaj bulunamadı, bir sonraki kanala geçiliyor...`);
                return;
            }

        // Son 2 mesajı al  
        const startIndex = Math.max(0, messages.length - 2);
        const lastThreeMessages = messages.slice(startIndex, messages.length);

        for (let i = startIndex; i < messages.length; i++) {
            let retry = 0;
            while (retry < 2) {
                try {
                    const currentMessages = await this.driver.findElements(By.css("div[role='row']"));
                    if (i >= currentMessages.length) {
                        this.logger.warn(`[UYARI] Mesaj indexi güncel mesaj sayısından büyük: i=${i}, length=${currentMessages.length}`);
                        break;
                    }
                    const message = currentMessages[i];
                    const msgType = await this.determineMessageType(message);
                    if (msgType === "text") {
                        const textElement = await message.findElement(By.css("span.selectable-text"));
                        const msgContent = await textElement.getText();
                        const sender = await this.getSenderFromMessage(message);

                        await this.processIncomingMessage(
                            msgContent,
                            sender ? sender : channelName
                        );
                        break; // başarılıysa döngüden çık
                    }
                } catch (e) {
                    if (e.name === 'StaleElementReferenceError') {
                        retry++;
                        continue; // tekrar dene
                    }
                    this.logger.error("[HATA] Mesaj işleme hatası: ", e);
                    break;
                }
            }
        }
            
            // Başarılı işlem sonrası döngüden çık
            return;
            
    } catch (e) {
            retryCount++;
            this.logger.error(`[HATA] fetchMessagesFromChannel hatası (Deneme ${retryCount}/${this.MAX_RETRIES}): `, e);
            
            if (retryCount === this.MAX_RETRIES) {
                this.logger.error(`[HATA] ${channelName} kanalı için maksimum deneme sayısına ulaşıldı, bir sonraki kanala geçiliyor...`);
                return;
            }
            
            // Hata sonrası kısa bekleme
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
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
            this.logger.warn('[UYARI] Boş mesaj alındı');
            return;
        }

        const links: string[] = await this.extractLinks(whatsappText);
        if (links.length === 0) {
            this.logger.debug('[BILGI] Mesajda link bulunamadı');
            // Sadece metin mesajını kaydedebiliriz, eğer ProductInfo içermiyorsa
            // await this.messageService.saveMessage(whatsappText, null, sender);
            return;
        }

        this.logger.log(`[BILGI] Mesajdan ${links.length} adet link bulundu`);

        for (const link of links) {
            let originalWindow: string | null = null;
            try {
                originalWindow = await this.processLink(link, whatsappText, sender); // Ham mesajı ve göndericiyi processLink'e aktar
            } catch (e) {
                this.logger.error(`[HATA] Link işleme hatası: ${(e as Error).message} - Link: ${link}`);
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

    private async processProductInfo(info: ProductInfo, rawMessageContent: string, sender: string): Promise<void> {
        try {
            // product.utils.ts'den buildMessageTemplate fonksiyonunu kullan
            const templateMessage = await buildMessageTemplate(
                info,
                async (url) => this.linkConversionService.generateTrackingLink(url) // Link dönüştürme fonksiyonu
            );
            
            // Ürün ismine göre zaten mevcut olup olmadığını kontrol et
            const exists = await this.messageService.isProductExists(info.name);
            if (!exists) {
                await this.messageService.saveMessage(rawMessageContent, info, sender); // Ham mesajı, ProductInfo'yu ve göndericiyi kaydet
                this.logger.log(`[BASARILI] Ürün başarıyla kaydedildi: ${info.name}`);
                // Telegram'a da göndermek istersen:
                await this.forwardService.forwardToTelegram(templateMessage);
            } else {
                this.logger.log(`[BILGI] Ürün zaten mevcut: ${info.name}`);
            }
        } catch (e) {
            this.logger.error(`[HATA] Ürün işleme hatası: ${(e as Error).message}`);
        }
    }

    private async processLink(link: string, rawMessageContent: string, sender: string): Promise<string | null> {
        const originalWindow = await this.driver.getWindowHandle();
        this.logger.debug(`[DEBUG] Yeni sekme açılıyor - Link: ${link}`);

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
                await this.processProductInfo(info, rawMessageContent, sender); // Ham mesajı ve göndericiyi aktar
            } else {
                this.logger.warn(`[UYARI] Geçersiz ürün bilgisi: ${link}`);
            }
        } catch (e: any) {
            if (e.name === 'TimeoutError') {
                this.logger.error(`[ZAMAN ASIMI] Sayfa yükleme zaman aşımı: ${link}`);
            } else {
                this.logger.error(`[HATA] Sayfa işleme hatası: ${e.message} - Link: ${link}`);
            }
        }

        return originalWindow;
    }

   

    // Stub: Ürün bilgisi geçerli mi?
    private async isValidProductInfo(info: ProductInfo): Promise<boolean> {
        // Burada gerçek validasyon yapılacak
        return Boolean(info.name && info.price);
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
