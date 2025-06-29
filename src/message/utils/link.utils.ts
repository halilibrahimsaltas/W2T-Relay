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

/**
 * API endpoint URL'sini oluşturur
 */
export const buildApiRequestUrl = (
    originalUrl: string,
    offerId: number,
    configService: ConfigService
): string => {
    const affiliateId = configService.get<string>('LINK_CONVERSION_AFFILIATE_ID');
    const adgroupId = configService.get<string>('LINK_CONVERSION_ADGROUP_ID');
    const locale = configService.get<string>('LINK_CONVERSION_LOCALE');

    const encodedUrl = encodeURIComponent(originalUrl);

    return `?aff_id=${affiliateId}&adgroup=${adgroupId}&url=${encodedUrl}&offer_id=${offerId}&locale=${locale}`;
};

/**
 * Axios örneğini oluşturur
 */
export const createAxiosInstance = (configService: ConfigService): AxiosInstance => {
    const baseURL = configService.get<string>('LINK_CONVERSION_API_URL');
    
    return axios.create({
        baseURL,
        timeout: 5000,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        }
    });
};
