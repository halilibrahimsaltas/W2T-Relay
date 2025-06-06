import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import { ConfigService } from '@nestjs/config';
import { MessageService } from '../message.service';
import { LinkConversionService } from '../link-conversion.service';
import { ForwardService } from '../forward.service';

@Injectable()
export class SeleniumService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(SeleniumService.name);
    private driver: WebDriver;
    private isRunning = false;
    private readonly CHECK_INTERVAL = 5000; // 5 saniye
    private readonly MAX_MESSAGES = 3; // Son 3 mesajı kontrol et
    private readonly WAIT_TIMEOUT = 60000; // 60 saniye

    constructor(
        private readonly configService: ConfigService,
        private readonly messageService: MessageService,
        private readonly linkConversionService: LinkConversionService,
        private readonly forwardService: ForwardService,
    ) {}

    async onModuleInit() {
        try {
            await this.initializeDriver();
            await this.startMonitoring();
        } catch (error) {
            this.logger.error('WhatsApp Web başlatılırken hata:', error);
            throw error;
        }
    }

    private async initializeDriver() {
        try {
            const options = new Options();
            
            // Chrome ayarları
            options.addArguments('--start-maximized');
            options.addArguments('--disable-notifications');
            options.addArguments('--disable-popup-blocking');
            options.addArguments('--disable-infobars');
            options.addArguments('--disable-extensions');
            options.addArguments('--disable-gpu');
            options.addArguments('--no-sandbox');
            options.addArguments('--disable-dev-shm-usage');
            options.addArguments('--disable-blink-features=AutomationControlled');
            
            // User agent ayarı
            options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            this.driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();

            this.logger.log('Chrome WebDriver başarıyla başlatıldı');
        } catch (error) {
            this.logger.error('Chrome WebDriver başlatılırken hata:', error);
            throw error;
        }
    }

    private async startMonitoring() {
        if (this.isRunning) return;
        this.isRunning = true;

        try {
            // WhatsApp Web'e git
            await this.driver.get('https://web.whatsapp.com');
            this.logger.log('WhatsApp Web açıldı, QR kodu bekleniyor...');

            // QR kodunun okunmasını bekle
            await this.driver.wait(
                until.elementLocated(By.css('div[data-testid="chat-list"]')),
                this.WAIT_TIMEOUT
            );

            this.logger.log('WhatsApp Web başarıyla bağlandı');

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

    async onModuleDestroy() {
        this.isRunning = false;
        if (this.driver) {
            await this.driver.quit();
            this.logger.log('Chrome WebDriver kapatıldı');
        }
    }
}
