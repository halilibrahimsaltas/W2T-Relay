import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { Message } from './entities/message.entity';
import { ForwardService } from './forward.service';
import { LinkConversionService } from './link-conversion.service';
import { SeleniumService } from './selenium/selenium.service';
import { SeleniumServiceStarter } from './selenium/selenium-starter.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Message]),
        HttpModule,
        ConfigModule
    ],
    controllers: [MessageController],
    providers: [
        MessageService,
        ForwardService,
        LinkConversionService,
        SeleniumService,
        SeleniumServiceStarter
    ],
    exports: [MessageService]
})
export class MessageModule {}
