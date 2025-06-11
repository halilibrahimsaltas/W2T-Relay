import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';

export const getOfferIdMap = (configService: ConfigService): Record<string, number> => {
    return JSON.parse(configService.get<string>('OFFER_ID_MAP'));
};

export const isAlreadyConvertedLink = (url: string): boolean => {
    return url.includes('sh.gelirortaklari.com') || 
           url.includes('ty.gl') || 
           url.includes('hb.gelirortaklari');
};

export const getOfferIdFromWebsite = (url: string, configService: ConfigService): number => {
    const offerIdMap = getOfferIdMap(configService);
    for (const [key, value] of Object.entries(offerIdMap)) {
        if (url.toLowerCase().includes(key)) {
            return value;
        }
    }
    return -1;
};

export const buildApiRequestUrl = (originalUrl: string, offerId: number, configService: ConfigService): string => {
    const affiliateId = configService.get<string>('LINK_CONVERSION_AFFILIATE_ID');
    const adgroupId = configService.get<string>('LINK_CONVERSION_ADGROUP_ID');
    const locale = configService.get<string>('LINK_CONVERSION_LOCALE');
    
    return `?aff_id=${affiliateId}&adgroup=${adgroupId}&url=${encodeURIComponent(originalUrl)}&offer_id=${offerId}&locale=${locale}`;
};

export const createAxiosInstance = (configService: ConfigService): AxiosInstance => {
    const baseUrl = configService.get<string>('LINK_CONVERSION_API_URL');
    return axios.create({
        baseURL: baseUrl,
        timeout: 5000,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
}; 