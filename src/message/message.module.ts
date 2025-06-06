import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { Message } from './entities/message.entity';
import { SeleniumService } from './selenium/selenium.service';
import { ForwardService } from './forward.service';
import { LinkConversionService } from './link-conversion.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Message]),
        HttpModule,
        ConfigModule
    ],
    controllers: [MessageController],
    providers: [
        MessageService,
        SeleniumService,
        ForwardService,
        LinkConversionService
    ],
    exports: [MessageService]
})
export class MessageModule {}
