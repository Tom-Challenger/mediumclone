import ArticleEntity from '../article.entity';

// Тип описывает репрезентацию не сущности, а простого типа данных
export type ArticleType = Omit<ArticleEntity, 'updateTimestamp'>;
