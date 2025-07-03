import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { buildApiRequestUrl, getOfferIdFromWebsite, isAlreadyConvertedLink } from './utils/link.utils';
import { createHepsiburadaAxiosInstance, generateHepsiburadaRequestBody } from './utils/hepsiburada.utils';

@Injectable()
export class LinkConversionService {
    private readonly logger = new Logger(LinkConversionService.name);
    private readonly hepsiburadaClient;

    constructor(private readonly configService: ConfigService) {
        this.hepsiburadaClient = createHepsiburadaAxiosInstance(this.configService);
    }

    async generateTrackingLink(originalUrl: string): Promise<string> {
        try {
            if (!originalUrl?.trim()) {
                this.logger.warn('[HATA] Boş veya geçersiz URL');
                return 'Geçersiz URL!';
            }
    
            if (isAlreadyConvertedLink(originalUrl)) {
                this.logger.log('[BILGI] URL zaten dönüştürülmüş: ' + originalUrl);
                return originalUrl;
            }
    
            if (originalUrl.toLowerCase().includes('hepsiburada')) {
                this.logger.log('[BILGI] Hepsiburada linki tespit edildi, özel API kullanılacak');
                return await this.handleHepsiburadaLink(originalUrl);
            }
    
            const offerId = getOfferIdFromWebsite(originalUrl, this.configService);
            if (offerId === -1) {
                this.logger.warn('[UYARI] URL için uygun offer_id bulunamadı: ' + originalUrl);
                return originalUrl;
            }
    
            const fullRequestUrl = buildApiRequestUrl(originalUrl, offerId, this.configService);
            this.logger.debug('[DEBUG] API isteği gönderilecek tam URL: ' + fullRequestUrl);
    
            const response = await axios.get(fullRequestUrl);
            this.logger.debug('[DEBUG] API ham yanıtı: ' + JSON.stringify(response.data));
    
            const apiResponse = response.data?.response;
    
            if (apiResponse?.status !== 1 || !apiResponse?.data?.click_url) {
                this.logger.error('[HATA] API yanıtı geçersiz veya click_url bulunamadı! Yanıt: ' + JSON.stringify(response.data));
                return originalUrl;
            }
    
            const trackingUrl = decodeURIComponent(apiResponse.data.click_url);
            this.logger.log('[BASARILI] Link dönüşümü başarılı: ' + trackingUrl);
            return trackingUrl;
    
        } catch (error) {
            this.logger.error(`[HATA] Link dönüştürme hatası: Link zaten dönüştürülmüş veya geçersiz URL!`);
            if (error.response) {
                this.logger.error(`[HATA] API Yanıt Detayı: ${JSON.stringify(error.response.data)}`);
            }
            return originalUrl;
        }
    }

    private async handleHepsiburadaLink(originalUrl: string): Promise<string> {
        try {
            const requestBody = generateHepsiburadaRequestBody(originalUrl);
            const response = await this.hepsiburadaClient.post('/share-url', requestBody);

            if (response.data?.status !== 'success') {
                this.logger.error('[HATA] Hepsiburada API hatası: ' + response.data?.status);
                return originalUrl;
            }

            const result = response.data?.result;
            if (!result?.shareUrl) {
                this.logger.error('[HATA] shareUrl bulunamadı!');
                return originalUrl;
            }

            this.logger.log('[BASARILI] Paylaşım linki oluşturuldu: ' + result.shareUrl);
            return result.shareUrl;

        } catch (error) {
            this.logger.error(`[HATA] Hepsiburada API hatası: ${error.message}`);
            if (error.response) {
                this.logger.error(`[HATA] Hepsiburada API Yanıt Detayı: ${JSON.stringify(error.response.data)}`);
            }
            return originalUrl;
        }
    }
}
