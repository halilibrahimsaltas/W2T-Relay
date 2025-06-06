import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ForwardService {
    private readonly logger = new Logger(ForwardService.name);
    private readonly TELEGRAM_API_URL = 'https://api.telegram.org/bot';

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Telegram'a mesaj gönderir (HTML parse mode).
     */
    private async sendToTelegram(chatId: string, messageText: string): Promise<void> {
        try {
            const token = this.configService.get<string>('telegram.bot.token');
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
        }
    }

    /**
     * Tüm chat ID'lere mesaj gönderir
     */
    private async sendToAllChats(messageText: string): Promise<void> {
        const chatIdsStr = this.configService.get<string>('telegram.bot.chatIds');
        if (!chatIdsStr) {
            this.logger.error('[HATA] Telegram chat ID\'leri tanımlanmamış!');
            return;
        }

        const chatIds = chatIdsStr.split(',');
        for (const chatId of chatIds) {
            const trimmedChatId = chatId.trim();
            if (trimmedChatId) {
                try {
                    await this.sendToTelegram(trimmedChatId, messageText);
                } catch (error) {
                    this.logger.error(`[HATA] Chat ID ${trimmedChatId} için mesaj gönderme hatası:`, error);
                }
            }
        }
    }

    /**
     * WhatsApp mesajını Telegram'a atarken satır sonlarını \n ile korur.
     */
    async forwardMessageWithImage(sender: string, imageUrl: string, caption: string): Promise<void> {
        try {
            const chatIdsStr = this.configService.get<string>('telegram.bot.chatIds');
            if (!chatIdsStr) {
                this.logger.error('[HATA] Telegram chat ID\'leri tanımlanmamış!');
                return;
            }

            const chatIds = chatIdsStr.split(',');
            for (const chatId of chatIds) {
                const trimmedChatId = chatId.trim();
                if (trimmedChatId) {
                    try {
                        const token = this.configService.get<string>('telegram.bot.token');
                        if (!token) {
                            this.logger.error('[HATA] Telegram bot token tanımlanmamış!');
                            return;
                        }

                        const formattedChatId = trimmedChatId.startsWith('-') ? trimmedChatId : `-${trimmedChatId}`;
                        const url = `${this.TELEGRAM_API_URL}${token}/sendPhoto`;

                        const body: any = {
                            chat_id: formattedChatId,
                            photo: imageUrl
                        };

                        if (caption) {
                            body.caption = caption;
                            body.parse_mode = 'HTML';
                        }

                        const response = await firstValueFrom(
                            this.httpService.post(url, body)
                        );

                        this.logger.log(`[BASARILI] Fotoğraf gönderildi - Chat ID: ${trimmedChatId}. Yanıt: ${JSON.stringify(response.data)}`);

                    } catch (error) {
                        this.logger.error(`[HATA] Chat ID ${trimmedChatId} için fotoğraf gönderme hatası:`, error);
                        try {
                            await this.sendToTelegram(trimmedChatId, caption);
                        } catch (ex) {
                            this.logger.error(`[HATA] Chat ID ${trimmedChatId} için normal mesaj gönderme hatası:`, ex);
                        }
                    }
                }
            }
        } catch (error) {
            this.logger.error('[HATA] Mesaj yönlendirme hatası:', error);
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
        }
    }

    /**
     * Telegram'a fotoğraf ve caption gönderir
     */
    private async sendPhotoToTelegram(chatId: string, photoUrl: string, caption: string): Promise<void> {
        try {
            const token = this.configService.get<string>('telegram.bot.token');
            const url = `${this.TELEGRAM_API_URL}${token}/sendPhoto`;

            const body: any = {
                chat_id: chatId,
                photo: photoUrl,
                parse_mode: 'HTML'
            };

            if (caption) {
                body.caption = caption;
            }

            const response = await firstValueFrom(
                this.httpService.post(url, body)
            );

            this.logger.log(`[BILGI] Gönderilen JSON: ${JSON.stringify(body)}`);
            this.logger.log(`[BILGI] API Yanıtı: ${JSON.stringify(response.data)}`);

        } catch (error) {
            this.logger.error('[HATA] JSON dönüşüm veya gönderim hatası:', error);
            await this.sendToTelegram(chatId, caption);
        }
    }

    /**
     * Tüm chat ID'lere fotoğraf gönderir
     */
    private async sendPhotoToAllChats(photoUrl: string, caption: string): Promise<void> {
        const chatIdsStr = this.configService.get<string>('telegram.bot.chatIds');
        if (!chatIdsStr) {
            this.logger.error('[HATA] Telegram chat ID\'leri tanımlanmamış!');
            return;
        }

        const chatIds = chatIdsStr.split(',');
        for (const chatId of chatIds) {
            await this.sendPhotoToTelegram(chatId.trim(), photoUrl, caption);
        }
    }
}