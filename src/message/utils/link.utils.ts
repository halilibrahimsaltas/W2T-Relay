import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';

/**
 * Config'den offer ID eşlemelerini alır (JSON formatında tutulur)
 */
export const getOfferIdMap = (configService: ConfigService): Record<string, number> => {
    return JSON.parse(configService.get<string>('OFFER_ID_MAP'));
};

/**
 * URL daha önce dönüştürülmüş mü kontrol eder
 */
export const isAlreadyConvertedLink = (url: string): boolean => {
    return url.includes('sh.gelirortaklari.com') || 
           url.includes('ty.gl') || 
           url.includes('hb.gelirortaklari');
};

/**
 * URL içinden ilgili domain'e karşılık gelen offer_id'yi döner
 */
export const getOfferIdFromWebsite = (url: string, configService: ConfigService): number => {
    const offerIdMap = getOfferIdMap(configService);
    const lowerUrl = url.toLowerCase();

    for (const [key, value] of Object.entries(offerIdMap)) {
        if (lowerUrl.includes(key)) {
            return value;
        }
    }

    return -1;
};

export const cleanAffiliateParams = (url: string): string => {
    const cleanUrl = url.replace(/([?&])(tag|aff_id|utm_[^=]+)=[^&]+/gi, '$1');
    // Gereksiz ? veya & kaldıysa temizle
    return cleanUrl.replace(/[?&]$/, '');
};

/**
 * API endpoint URL'sini oluşturur
 */
/**
 * API endpoint URL'sini oluşturur (tam URL)
 */
export const buildApiRequestUrl = (
    originalUrl: string,
    offerId: number,
    configService: ConfigService
): string => {
    const baseUrl = configService.get<string>('LINK_CONVERSION_API_URL'); // örn: https://gelirortaklari.api.hasoffers.com/Api/v3/json
    const apiKey = configService.get<string>('LINK_CONVERSION_API_KEY');

    const params = new URLSearchParams({
        api_key: apiKey,
        Target: 'Affiliate_Offer',
        Method: 'generateTrackingLink',
        offer_id: offerId.toString(),
        [`params[url]`]: originalUrl // burada encode ETME, API zaten parse ediyor
    });

    return `${baseUrl}?${params.toString()}`;
};
