import { UserResponseInterface } from './../user/types/userResponse.interface';
import { UpdateArticleDto } from './dto/updateArticle.dto';
import { DeleteResult, getRepository, Repository } from 'typeorm';
import ArticleEntity from '@app/article/article.entity';
import { CreateArticleDto } from './dto/createArticle.dto';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { UserEntity } from '@app/user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ArticleResponseInterface } from './types/articleResponse.interface';
import slugify from 'slugify';
import { ArticlesResponseInterface } from './types/articlesResponse.interface';
import { FollowEntity } from '@app/profile/follow.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
  ) {}

  async createArticle(
    currentUser: UserEntity,
    CreateAcrticleDto: CreateArticleDto,
  ) {
    const article = new ArticleEntity();
    Object.assign(article, CreateAcrticleDto);

    // Инициализация для поля tagList
    // В ArticleEntity поле описано как обязательное
    if (!article.tagList) {
      article.tagList = [];
    }

    // Генерируем уникальный slug для нового поста
    article.slug = this.getSlug(article.title);

    // Сохранение userId через описание связи на уровне TypeOrm
    //
    // Поля author в ArticleEntity создается автоматически
    // и хранит ObjectId от записи UserEntity
    // из-за описания связи ManyToOne и OneToMany между таблицами Article и User
    article.author = currentUser;

    return this.articleRepository.save(article);
  }

  async findBySlug(slug: string): Promise<ArticleEntity> {
    return this.articleRepository.findOne({ slug });
  }

  async findAll(
    currentUserId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    // Создаем QB и используем alias для удобства
    const queryBuilder = getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author');

    queryBuilder.orderBy('articles.createdAt', 'DESC');

    const articlesCount = await queryBuilder.getCount();

    if (query.tag) {
      queryBuilder.andWhere('articles.tagList LIKE :tag', {
        tag: `%${query.tag}%`,
      });
    }

    // andWhere можно использовать несколько последовательно
    if (query.author) {
      const author = await this.userRepository.findOne({
        username: query.author,
      });

      queryBuilder.andWhere('articles.authorId = :id', { id: author.id });
    }

    if (query.favorited) {
      const author = await this.userRepository.findOne(
        {
          username: query.favorited,
        },
        { relations: ['favorites'] },
      );

      const ids = author.favorites.map((el) => el.id);
      if (ids.length > 0) {
        // :...ids -обращение в TypeORM для поиска в массиве при запросе
        queryBuilder.andWhere('articles.authorId IN (:...ids)', { ids });
      } else {
        // Способ оконечить queryBuilder
        queryBuilder.andWhere('1=0');
      }
    }

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    let favoriteIds: number[] = [];

    if (currentUserId) {
      const currentUser = await this.userRepository.findOne(currentUserId, {
        relations: ['favorites'],
      });
      favoriteIds = currentUser.favorites.map((favorite) => favorite.id);
    }

    const articles = await queryBuilder.getMany();
    const articlesWithFavorites = articles.map((article) => {
      const favorited = favoriteIds.includes(article.id);
      return { ...article, favorited };
    });

    return { articles: articlesWithFavorites, articlesCount };
  }

  async deleteArticle(
    currentUserId: number,
    slug: string,
  ): Promise<DeleteResult> {
    // В начале проверим что пост существует
    const article = await this.findBySlug(slug);

    // Если undefined
    if (!article) {
      throw new HttpException('Article dos not exist', HttpStatus.NOT_FOUND);
    }

    // Если пользователь не является автором
    if (article.author.id !== currentUserId) {
      throw new HttpException('You are not an author', HttpStatus.FORBIDDEN);
    }

    return await this.articleRepository.delete({ slug });
  }

  async updateArticle(
    currentUserId: number,
    slug: string,
    UpdateArticleDto: UpdateArticleDto,
  ): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);
    const prevTitle = article.title;

    // Если undefined
    if (!article) {
      throw new HttpException('Article dos not exist', HttpStatus.NOT_FOUND);
    }

    // Если пользователь не является автором
    if (article.author.id !== currentUserId) {
      throw new HttpException('You are not an author', HttpStatus.FORBIDDEN);
    }

    Object.assign(article, UpdateArticleDto);

    // Обновить slug если изменился title
    if (prevTitle !== article.title) {
      article.slug = this.getSlug(article.title);
    }

    return this.articleRepository.save(article);
  }

  async addArticleToFavorite(
    currentUserId: number,
    slug: string,
  ): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);
    const user = await this.userRepository.findOne(currentUserId, {
      relations: ['favorites'],
    });
    const isNotFavorited =
      user.favorites.findIndex(
        (articleInFavorites) => articleInFavorites.id === article.id,
      ) === -1;

    if (isNotFavorited) {
      user.favorites.push(article);
      article.favoritesCount++;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return article;
  }

  async deleteArticleToFavorite(
    currentUserId: number,
    slug: string,
  ): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);
    const user = await this.userRepository.findOne(currentUserId, {
      relations: ['favorites'],
    });
    const articleIndex = user.favorites.findIndex(
      (articleInFavorites) => articleInFavorites.id === article.id,
    );

    if (articleIndex >= 0) {
      user.favorites.splice(articleIndex, 1);
      article.favoritesCount--;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return article;
  }

  async getFeed(
    currentUserId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    const follows = await this.followRepository.find({
      followerId: currentUserId,
    });

    if (follows.length === 0) {
      return { articles: [], articlesCount: 0 };
    }

    // Нужно найти записи article авторов из following
    const followingUserIds = follows.map((follow) => follow.followingId);
    const queryBuilder = getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author')
      .where('articles.authorId IN (:...ids)', { ids: followingUserIds });

    queryBuilder.orderBy('articles.createdAt', 'DESC');

    const articlesCount = await queryBuilder.getCount();

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    const articles = await queryBuilder.getMany();

    return { articles, articlesCount };
  }

  buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
    return { article };
  }

  private getSlug(title: string): string {
    return (
      slugify(title, { lower: true }) +
      '-' +
      ((Math.random() * Math.pow(36, 6)) | 0).toString(36)
    );
  }
}
