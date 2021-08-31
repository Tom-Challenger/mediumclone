import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDb1629715119390 implements MigrationInterface {
  name = 'SeedDb1629715119390';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Чистая комманда SQL Posgres
    await queryRunner.query(
      `INSERT INTO tags(name) VALUES ('dragons'), ('coffee'), ('nestjs')`,
    );

    // password is 123
    await queryRunner.query(
      `INSERT INTO users (username, email, password) VALUES('foo', 'foo@gmail.com', '$2b$10$q63kZV6VVgbzN/.SrbHV/OXeYz5V/RmgugPNMjroEmB3SrUoYbjL2')`,
    );

    await queryRunner.query(
      `INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES ('first-article', 'First article', 'first article desc', 'first article body', 'coffee,dragons', 1)`,
    );

    await queryRunner.query(
      `INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES ('second-article', 'Second article', 'second article desc', 'second article body', 'coffee,dragons', 1)`,
    );
  }

  public async down() {}
}
