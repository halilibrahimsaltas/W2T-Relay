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
            let content: ProductInfo;
            if (typeof createMessageDto.content === 'string') {
                content = JSON.parse(createMessageDto.content);
            } else {
                content = createMessageDto.content;
            }
            const message = this.messageRepository.create({
                content,
                sender: createMessageDto.sender
            });
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
                where: { content: { name: productName } }
            });
            return !!message;
        } catch (error) {
            this.logger.error('[HATA] Ürün kontrolü hatası:', error);
            return false;
        }
    }

    async saveMessage(content: ProductInfo, sender: string) {
        try {
            const message = this.messageRepository.create({
                content,
                sender,
                convertedContent: content
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
                    content: { name: Like(`%${query}%`) }
                },
                order: { id: 'DESC' }
            });
        } catch (error) {
            this.logger.error('[HATA] İçerik arama hatası:', error);
            throw error;
        }
    }

    async findByContent(content: string): Promise<Message | null> {
        try {
            return await this.messageRepository.findOne({ where: { content: { name: content } } });
        } catch (error) {
            this.logger.error('Mesaj içeriğine göre arama yapılırken hata:', error);
            throw error;
        }
    }
}
