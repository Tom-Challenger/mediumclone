import { UserType } from './user.type';

// Интерфейс описывает репрезентацию сущности для ответа на запрос
// При ответе на запрос
// Интерфейс используется вместо DTO по скольку для ответа не требуется валидация объекта
export interface UserResponseInterface {
  user: UserType & { token: string };
}
