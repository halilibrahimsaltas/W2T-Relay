import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });



  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`[BILGI] Uygulama başlatıldı - Port: ${port}`);
  logger.log('[BILGI] Servisler başlatılıyor...');
  logger.log('[BILGI] - SeleniumService: WhatsApp Web bağlantısı kuruluyor');
  logger.log('[BILGI] - ForwardService: Telegram bot bağlantısı hazırlanıyor');
  logger.log('[BILGI] - MessageService: Veritabanı bağlantısı kontrol ediliyor');
}
bootstrap();
