import { UserEntity } from './../user.entity';

// Тип описывает репрезентацию не сущности, а простого типа данных
export type UserType = Omit<UserEntity, 'hashPassword'>;
