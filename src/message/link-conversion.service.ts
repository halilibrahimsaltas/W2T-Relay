import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createAxiosInstance, buildApiRequestUrl, getOfferIdFromWebsite, isAlreadyConvertedLink, cleanAffiliateParams } from './utils/link.utils';
import { createHepsiburadaAxiosInstance, generateHepsiburadaRequestBody } from './utils/hepsiburada.utils';

@Injectable()
export class LinkConversionService {
    private readonly logger = new Logger(LinkConversionService.name);
    private readonly apiClient;
    private readonly hepsiburadaClient;

    constructor(private readonly configService: ConfigService) {
        this.apiClient = createAxiosInstance(this.configService);
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
    
            const cleanedUrl = cleanAffiliateParams(originalUrl);
            const offerId = getOfferIdFromWebsite(cleanedUrl, this.configService);
            if (offerId === -1) {
                this.logger.warn('[UYARI] URL için uygun offer_id bulunamadı: ' + originalUrl);
                return originalUrl;
            }
    
            const apiRequestUrl = buildApiRequestUrl(cleanedUrl, offerId, this.configService);
            this.logger.debug('[DEBUG] API isteği hazırlanıyor - URL: ' + apiRequestUrl);
    
            const response = await this.apiClient.get(apiRequestUrl);
    
            if (!response.data?.shortlink) {
                this.logger.error('[HATA] API yanıtında shortlink bulunamadı! Yanıt: ' + JSON.stringify(response.data));
                return originalUrl;
            }
    
            const shortlink = decodeURIComponent(response.data.shortlink);
            this.logger.log('[BASARILI] Link dönüşümü başarılı: ' + shortlink);
            return shortlink;
    
        } catch (error) {
            this.logger.error(`[HATA] Link dönüştürme hatası: ${error.message}`);
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