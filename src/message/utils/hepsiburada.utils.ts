import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';

export const createHepsiburadaAxiosInstance = (configService: ConfigService): AxiosInstance => {
    return axios.create({
        baseURL: configService.get<string>('HEPSIBURADA_API_URL'),
        timeout: 5000,
        headers: {
            'accept': 'application/json',
            'x-app-version': configService.get<string>('HEPSIBURADA_APP_VERSION'),
            'x-os-version': configService.get<string>('HEPSIBURADA_OS_VERSION'),
            'x-device-id': configService.get<string>('HEPSIBURADA_DEVICE_ID'),
            'x-app-type': configService.get<string>('HEPSIBURADA_APP_TYPE'),
            'x-platform': configService.get<string>('HEPSIBURADA_PLATFORM'),
            'x-correlation-id': configService.get<string>('HEPSIBURADA_CORRELATION_ID'),
            'x-device-model': configService.get<string>('HEPSIBURADA_DEVICE_MODEL'),
            'x-app-key': configService.get<string>('HEPSIBURADA_APP_KEY'),
            'authorization': configService.get<string>('HEPSIBURADA_AUTHORIZATION'),
            'user-agent': configService.get<string>('HEPSIBURADA_USER_AGENT'),
            'x-unique-campaign-id': configService.get<string>('HEPSIBURADA_CAMPAIGN_ID'),
            'unique-device-id': configService.get<string>('HEPSIBURADA_DEVICE_ID'),
            'x-authorization': configService.get<string>('HEPSIBURADA_JWT'),
            'x-jwt': configService.get<string>('HEPSIBURADA_JWT'),
            'x-anonymous-id': configService.get<string>('HEPSIBURADA_ANONYMOUS_ID'),
            'x-language': configService.get<string>('HEPSIBURADA_LANGUAGE'),
            'x-device-type': configService.get<string>('HEPSIBURADA_DEVICE_TYPE'),
            'content-type': 'application/json; charset=UTF-8',
            'host': 'subzero.hepsiburada.com',
            'connection': 'Keep-Alive',
            'accept-encoding': 'gzip'
        }
    });
};

export const generateHepsiburadaRequestBody = (originalUrl: string): string => {
    return JSON.stringify({
        webUrl: originalUrl,
        title: 'HBCV0000333333'
    });
};

export const createHepsiburadaRequest = (url: string) => {
    return {
        url,
        locale: 'tr-TR',
        affiliateId: 'w2t-relay',
        adgroupId: 'w2t-relay',
    };
}; 