import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';

/**
 * Config'den offer ID eşlemelerini alır (JSON formatında tutulur)
 */
export const getOfferIdMap = (): Record<string, number> => {
    // Sabit offerId map
    return {
        "amazon": 6718,
        "boyner": 6568,
        "getir": 6906,
        "decathlon": 6786,
        "karaca": 6918,
        "mediamarkt": 6816,
        "n11": 6717,
        "trendyol": 6719,
        "ciceksepeti": 6721,
        "gittigidiyor": 6722,
        "supplementler": 5528,
        "amzn": 6718,
        "gratis": 6779
    };
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
export const getOfferIdFromWebsite = (url: string): number => {
    const offerIdMap = getOfferIdMap();
    const lowerUrl = url.toLowerCase();

    for (const [key, value] of Object.entries(offerIdMap)) {
        if (lowerUrl.includes(key)) {
            return value;
        }
    }

    return -1;
};

/**
 * API'ye gönderilecek URL'nin başındaki ve sonundaki çift tırnakları temizler
 */
export const cleanAffiliateParams = (rawUrl: string): string => {
    try {
        const url = new URL(rawUrl);
        const params = url.searchParams;

        const unwantedPrefixes = ['utm_', 'pd_rd_', 'pf_rd_', 'amzn1.', 'ref_', 'tag', 'aff_id', 'impression_id'];
        const keysToDelete: string[] = [];

        for (const [key] of params) {
            if (
                unwantedPrefixes.some((prefix) =>
                    key.toLowerCase().startsWith(prefix.toLowerCase())
                )
            ) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach((key) => params.delete(key));

        url.search = params.toString();

        return url.toString();
    } catch (err) {
        // URL bozuksa orijinalini döndür
        return rawUrl;
    }
};
/**
 * API endpoint URL'sini oluşturur (tam URL)
 * DİKKAT: originalUrl parametresi encode edilmemeli ve başında/sonunda çift tırnak olmamalı.
 */
export const buildApiRequestUrl = (
    originalUrl: string,
    offerId: number,
    configService: ConfigService
): string => {
    const baseUrl = configService.get<string>('LINK_CONVERSION_API_URL'); // Örn: https://gelirortaklari.api.hasoffers.com/Apiv3/json
    const apiKey = configService.get<string>('LINK_CONVERSION_API_KEY');

    const cleanedUrl = cleanAffiliateParams(originalUrl);
    const encodedUrl = encodeURIComponent(cleanedUrl); // ✅ BURASI ÖNEMLİ

    const params = new URLSearchParams({
        api_key: apiKey,
        Target: 'Affiliate_Offer',
        Method: 'generateTrackingLink',
        offer_id: offerId.toString(),
        'params[url]': encodedUrl,
    });

    return `${baseUrl}?api_key=${apiKey}&Target=Affiliate_Offer&Method=generateTrackingLink&offer_id=${offerId}&params[url]=${encodedUrl}`;
};