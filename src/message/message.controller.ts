import { Controller, Get, Post, Body, Patch, Param, Delete, Query, NotFoundException } from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messageService.create(createMessageDto);
  }

  @Get()
  async findAll() {
    // ID'ye göre azalan sırada tüm mesajları getir
    return this.messageService.findAll({ order: { id: 'DESC' } });
  }

  @Get('search')
  async searchMessages(@Query('q') query: string) {
    if (!query) {
      throw new NotFoundException('Arama sorgusu boş olamaz');
    }
    return this.messageService.searchByContent(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const message = await this.messageService.findOne(+id);
    if (!message) {
      throw new NotFoundException(`ID: ${id} olan mesaj bulunamadı`);
    }
    return message;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messageService.update(+id, updateMessageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messageService.remove(+id);
  }
}
