import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';

export const BASE_API_URL = 'https://sh.gelirortaklari.com/shortlink';
export const AFFILIATE_ID = '38040';
export const ADGROUP_ID = '38040';
export const LOCALE = 'tr';

export const OFFER_ID_MAP: Record<string, number> = {
    'amazon': 6718,
    'boyner': 6568,
    'getir': 6906,
    'decathlon': 6786,
    'karaca': 6716,
    'mediamarkt': 6816,
    'n11': 6717,
    'trendyol': 6719,
    'ciceksepeti': 6721,
    'gittigidiyor': 6722,
    'supplementler': 5528,
    'amzn': 6718,
    'gratis': 6779
};

export const isAlreadyConvertedLink = (url: string): boolean => {
    return url.includes('tracking') || url.includes('affiliate');
};

export const getOfferIdFromWebsite = (url: string): string | null => {
    const offerIdMap: { [key: string]: string } = {
        'hepsiburada.com': '5043',
        'amazon.com.tr': '5044',
        'trendyol.com': '5045',
        'n11.com': '5046',
        'mediamarkt.com.tr': '5047',
        'boyner.com.tr': '5048',
        'karaca.com': '5049',
        'gratis.com': '5050'
    };

    for (const [domain, offerId] of Object.entries(offerIdMap)) {
        if (url.includes(domain)) {
            return offerId;
        }
    }

    return null;
};

export const buildApiRequestUrl = (originalUrl: string, offerId: string, configService: ConfigService): string => {
    const affiliateId = configService.get<string>('LINK_CONVERSION_AFFILIATE_ID');
    const adgroupId = configService.get<string>('LINK_CONVERSION_ADGROUP_ID');
    const locale = configService.get<string>('LINK_CONVERSION_LOCALE');

    return `/link?url=${encodeURIComponent(originalUrl)}&offerId=${offerId}&affiliateId=${affiliateId}&adgroupId=${adgroupId}&locale=${locale}`;
};

export const createAxiosInstance = (configService: ConfigService): AxiosInstance => {
    return axios.create({
        baseURL: configService.get<string>('LINK_CONVERSION_API_URL'),
        timeout: 5000
    });
}; 