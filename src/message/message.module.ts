import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { Message } from './entities/message.entity';
import { SeleniumService } from './selenium/selenium.service';
import { LinkConversionService } from './link-conversion.service';
import { ForwardService } from './forward.service';

@Module({
    imports: [TypeOrmModule.forFeature([Message])],
    controllers: [MessageController],
    providers: [MessageService, SeleniumService, LinkConversionService, ForwardService],
    exports: [MessageService, SeleniumService, LinkConversionService, ForwardService]
})
export class MessageModule {}
