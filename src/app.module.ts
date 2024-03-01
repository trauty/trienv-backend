import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: "mariadb",
      host: "localhost",
      port: 3310,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: "trienv",
      entities: [],
      synchronize: true
    }),
    AuthModule,
    UserModule,
  ],
})

export class AppModule {}
