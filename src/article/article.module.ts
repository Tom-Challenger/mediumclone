import { FollowEntity } from './../profile/follow.entity';
import { UserEntity } from './../user/user.entity';
import { ArticleService } from './article.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import ArticleEntity from './article.entity';
import { ArticleController } from './article.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArticleEntity, UserEntity, FollowEntity]),
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
