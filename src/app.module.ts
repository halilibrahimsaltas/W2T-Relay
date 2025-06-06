import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { MessageModule } from './message/message.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        HttpModule,
        MessageModule,
    ],
})
export class AppModule {}
