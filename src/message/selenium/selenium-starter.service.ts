import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SeleniumService } from './selenium.service';

@Injectable()
export class SeleniumServiceStarter implements OnModuleInit {
    private readonly logger = new Logger(SeleniumServiceStarter.name);

    constructor(private readonly seleniumService: SeleniumService) {}

    async onModuleInit() {
        try {
            this.logger.log('[BILGI] SeleniumService başlatılıyor...');
            await this.seleniumService.onModuleInit();
            this.logger.log('[BILGI] SeleniumService başarıyla başlatıldı');
        } catch (error) {
            this.logger.error('[HATA] SeleniumService başlatılırken hata:', error);
            throw error;
        }
    }
} 