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
    return url.includes('sh.gelirortaklari.com') || 
           url.includes('ty.gl') || 
           url.includes('hb.gelirortaklari');
};

export const getOfferIdFromWebsite = (url: string): number => {
    for (const [key, value] of Object.entries(OFFER_ID_MAP)) {
        if (url.toLowerCase().includes(key)) {
            return value;
        }
    }
    return -1;
};

export const buildApiRequestUrl = (originalUrl: string, offerId: number): string => {
    return `?aff_id=${AFFILIATE_ID}&adgroup=${ADGROUP_ID}&url=${encodeURIComponent(originalUrl)}&offer_id=${offerId}&locale=${LOCALE}`;
};

export const createAxiosInstance = (configService: ConfigService): AxiosInstance => {
    return axios.create({
        baseURL: BASE_API_URL,
        timeout: 5000,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
}; 