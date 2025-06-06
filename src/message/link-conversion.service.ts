import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createAxiosInstance, buildApiRequestUrl, getOfferIdFromWebsite, isAlreadyConvertedLink } from './utils/link.utils';
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
            if (!originalUrl) {
                throw new Error('URL boş olamaz');
            }

            if (isAlreadyConvertedLink(originalUrl)) {
                this.logger.log('URL zaten dönüştürülmüş, orijinal URL döndürülüyor');
                return originalUrl;
            }

            const offerId = getOfferIdFromWebsite(originalUrl);
            if (!offerId) {
                this.logger.warn('Desteklenmeyen site, orijinal URL döndürülüyor');
                return originalUrl;
            }

            if (originalUrl.includes('hepsiburada.com')) {
                return await this.handleHepsiburadaLink(originalUrl);
            }

            const apiUrl = buildApiRequestUrl(originalUrl, offerId, this.configService);
            const response = await this.apiClient.get(apiUrl);

            if (response.data?.data?.trackingUrl) {
                this.logger.log('Link başarıyla dönüştürüldü');
                return response.data.data.trackingUrl;
            }

            this.logger.warn('API yanıtında tracking URL bulunamadı');
            return originalUrl;

        } catch (error) {
            this.logger.error(`Link dönüştürme hatası: ${error.message}`);
            return originalUrl;
        }
    }

    private async handleHepsiburadaLink(originalUrl: string): Promise<string> {
        try {
            const requestBody = generateHepsiburadaRequestBody(originalUrl);
            const response = await this.hepsiburadaClient.post('/deeplink', requestBody);

            if (response.data?.data?.deeplink) {
                this.logger.log('Hepsiburada linki başarıyla dönüştürüldü');
                return response.data.data.deeplink;
            }

            this.logger.warn('Hepsiburada API yanıtında deeplink bulunamadı');
            return originalUrl;

        } catch (error) {
            this.logger.error(`Hepsiburada link dönüştürme hatası: ${error.message}`);
            return originalUrl;
        }
    }

    async convertLink(url: string): Promise<string> {
        try {
            if (!url) {
                throw new Error('URL boş olamaz');
            }

            const offerId = getOfferIdFromWebsite(url);
            if (!offerId) {
                this.logger.warn(`Desteklenmeyen website: ${url}`);
                return url;
            }

            const apiUrl = buildApiRequestUrl(url, offerId, this.configService);
            const requestBody = generateHepsiburadaRequestBody(url);

            const response = await this.hepsiburadaClient.post(apiUrl, requestBody);
            
            if (response.data?.data?.trackingUrl) {
                return response.data.data.trackingUrl;
            }

            this.logger.warn('Tracking URL alınamadı, orijinal URL döndürülüyor');
            return url;
        } catch (error) {
            this.logger.error('Link dönüştürme hatası:', error);
            return url;
        }
    }
} 