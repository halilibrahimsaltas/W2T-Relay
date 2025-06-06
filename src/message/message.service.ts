import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
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

    async findAll(options?: { order?: { [key: string]: 'ASC' | 'DESC' } }) {
        try {
            return await this.messageRepository.find({
                order: options?.order || { id: 'DESC' }
            });
        } catch (error) {
            this.logger.error('[HATA] Mesajları getirme hatası:', error);
            throw error;
        }
    }

    async findOne(id: number) {
        try {
            const message = await this.messageRepository.findOne({ where: { id } });
            if (!message) {
                throw new NotFoundException(`ID: ${id} olan mesaj bulunamadı`);
            }
            return message;
        } catch (error) {
            this.logger.error('[HATA] Mesaj getirme hatası:', error);
            throw error;
        }
    }

    async update(id: number, updateMessageDto: UpdateMessageDto) {
        try {
            const message = await this.findOne(id);
            Object.assign(message, updateMessageDto);
            return await this.messageRepository.save(message);
        } catch (error) {
            this.logger.error('[HATA] Mesaj güncelleme hatası:', error);
            throw error;
        }
    }

    async remove(id: number) {
        try {
            const message = await this.findOne(id);
            return await this.messageRepository.remove(message);
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

    async searchByContent(query: string) {
        try {
            return await this.messageRepository.find({
                where: {
                    content: Like(`%${query}%`)
                },
                order: { id: 'DESC' }
            });
        } catch (error) {
            this.logger.error('[HATA] İçerik arama hatası:', error);
            throw error;
        }
    }
}
