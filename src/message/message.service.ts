import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { ProductInfo } from './utils/product.utils';

@Injectable()
export class MessageService {
    private readonly logger = new Logger(MessageService.name);

    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
    ) {}

    async create(createMessageDto: CreateMessageDto) {
        try {
            const message = this.messageRepository.create(createMessageDto);
            return await this.messageRepository.save(message);
        } catch (error) {
            this.logger.error('[HATA] Mesaj oluşturma hatası:', error);
            throw error;
        }
    }

    async findAll() {
        try {
            return await this.messageRepository.find();
        } catch (error) {
            this.logger.error('[HATA] Mesajları getirme hatası:', error);
            throw error;
        }
    }

    async findOne(id: number) {
        try {
            return await this.messageRepository.findOne({ where: { id } });
        } catch (error) {
            this.logger.error('[HATA] Mesaj getirme hatası:', error);
            throw error;
        }
    }

    async update(id: number, updateMessageDto: UpdateMessageDto) {
        try {
            await this.messageRepository.update(id, updateMessageDto);
            return await this.findOne(id);
        } catch (error) {
            this.logger.error('[HATA] Mesaj güncelleme hatası:', error);
            throw error;
        }
    }

    async remove(id: number) {
        try {
            const message = await this.findOne(id);
            await this.messageRepository.remove(message);
            return message;
        } catch (error) {
            this.logger.error('[HATA] Mesaj silme hatası:', error);
            throw error;
        }
    }

    async isProductExists(productName: string): Promise<boolean> {
        try {
            const message = await this.messageRepository.findOne({
                where: { content: productName }
            });
            return !!message;
        } catch (error) {
            this.logger.error('[HATA] Ürün kontrolü hatası:', error);
            return false;
        }
    }

    async saveMessage(content: string, sender: string) {
        try {
            const message = this.messageRepository.create({
                content,
                sender,
                convertedContent: 'text'
            });
            return await this.messageRepository.save(message);
        } catch (error) {
            this.logger.error('[HATA] Mesaj kaydetme hatası:', error);
            throw error;
        }
    }
}
