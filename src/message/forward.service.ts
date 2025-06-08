import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ForwardService {
    private readonly logger = new Logger(ForwardService.name);
    private readonly TELEGRAM_API_URL = 'https://api.telegram.org/bot';
    private readonly telegramBotToken: string;
    private readonly telegramChatId: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.telegramBotToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
        this.telegramChatId = this.configService.get<string>('TELEGRAM_CHAT_ID');
    }

    

    /**
     * Telegram'a mesaj gönderir (HTML parse mode).
     */
    private async sendToTelegram(chatId: string, messageText: string): Promise<void> {
        try {
            const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
            if (!token) {
                this.logger.error('[HATA] Telegram bot token tanımlanmamış!');
                return;
            }

            const formattedChatId = chatId.startsWith('-') ? chatId : `-${chatId}`;
            const url = `${this.TELEGRAM_API_URL}${token}/sendMessage`;

            const body = {
                chat_id: formattedChatId,
                text: messageText,
                parse_mode: 'HTML'
            };

            const response = await firstValueFrom(
                this.httpService.post(url, body)
            );

            this.logger.log(`[BILGI] Telegram mesajı gönderildi. Yanıt: ${JSON.stringify(response.data)}`);

        } catch (error) {
            this.logger.error('[HATA] Telegram mesaj gönderme hatası:', error);
            throw error;
        }
    }

    /**
     * Telegram'a fotoğraf ve caption gönderir
     */
    private async sendPhotoToTelegram(chatId: string, photoUrl: string, caption: string): Promise<void> {
        try {
            const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
            if (!token) {
                this.logger.error('[HATA] Telegram bot token tanımlanmamış!');
                return;
            }

            const formattedChatId = chatId.startsWith('-') ? chatId : `-${chatId}`;
            const url = `${this.TELEGRAM_API_URL}${token}/sendPhoto`;

            const body: any = {
                chat_id: formattedChatId,
                photo: photoUrl,
                parse_mode: 'HTML'
            };

            if (caption) {
                body.caption = caption;
            }

            const response = await firstValueFrom(
                this.httpService.post(url, body)
            );

            this.logger.log(`[BILGI] Fotoğraf gönderildi - Chat ID: ${formattedChatId}. Yanıt: ${JSON.stringify(response.data)}`);

        } catch (error) {
            this.logger.error('[HATA] Fotoğraf gönderme hatası:', error);
            // Fotoğraf gönderimi başarısız olursa, sadece caption'ı göndermeyi dene
            if (caption) {
                await this.sendToTelegram(chatId, caption);
            }
            throw error;
        }
    }

    /**
     * Tüm chat ID'lere mesaj gönderir
     */
    private async sendToAllChats(messageText: string): Promise<void> {
        const chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');
        if (!chatId) {
            this.logger.error('[HATA] Telegram chat ID tanımlanmamış!');
            return;
        }

        try {
            await this.sendToTelegram(chatId, messageText);
        } catch (error) {
            this.logger.error(`[HATA] Chat ID ${chatId} için mesaj gönderme hatası:`, error);
            throw error;
        }
    }

    /**
     * WhatsApp mesajını Telegram'a atarken satır sonlarını \n ile korur.
     */
    async forwardMessageWithImage(sender: string, imageUrl: string, caption: string): Promise<void> {
        try {
            const chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');
            if (!chatId) {
                this.logger.error('[HATA] Telegram chat ID tanımlanmamış!');
                return;
            }

            await this.sendPhotoToTelegram(chatId, imageUrl, caption);
        } catch (error) {
            this.logger.error('[HATA] Mesaj yönlendirme hatası:', error);
            throw error;
        }
    }

    /**
     * Normal mesaj gönderir
     */
    async forwardMessage(sender: string, content: string): Promise<void> {
        try {
            await this.sendToAllChats(content);
        } catch (error) {
            this.logger.error('[HATA] Normal mesaj gönderme hatası:', error);
            throw error;
        }
    }

    async forwardToTelegram(message: string): Promise<void> {
        try {
            const imagePrefix = "IMAGE_URL:";
            const messageSeparator = "|||MESSAGE:";

            if (message.startsWith(imagePrefix) && message.includes(messageSeparator)) {
                const parts = message.split(messageSeparator);
                const imageUrl = parts[0].substring(imagePrefix.length);
                const messageText = parts[1];

                const chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');
                if (!chatId) {
                    this.logger.error('[HATA] Telegram chat ID tanımlanmamış!');
                    return;
                }

                await this.sendPhotoToTelegram(chatId, imageUrl, messageText);
                this.logger.log('Görsel ve mesaj Telegram\'a başarıyla iletildi');
            } else {
                // Normal metin mesajı gönder
                const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
                const data = {
                    chat_id: this.telegramChatId,
                    text: message,
                    parse_mode: 'HTML',
                };

                await firstValueFrom(this.httpService.post(url, data));
                this.logger.log('Mesaj Telegram\'a başarıyla iletildi');
            }
        } catch (error) {
            this.logger.error('Telegram\'a mesaj iletirken hata:', error);
            throw error;
        }
    }
}