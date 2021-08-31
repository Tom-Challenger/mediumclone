import { Controller, Get, Post, Request } from '@nestjs/common';
import { TagService } from '@app/tag/tag.service';

@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  async findAll(): Promise<{ tags: string[] }> {
    const tags = await this.tagService.findAll();
    // Контроллер хранит логику нормализации данных для клиента
    return {
      tags: tags.map((tag) => tag.name),
    };
  }
}
