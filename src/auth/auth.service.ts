import { ForbiddenException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SignInDto, SignUpDto } from './auth.dto';
import * as argon2 from "argon2";
import { IUser } from 'src/types';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthService {
    constructor(
        private jwt: JwtService,
        private config: ConfigService,
        @InjectDataSource() private readonly conn: DataSource
    ) {}

    async signUp(cred: SignUpDto) {
        const hash = await argon2.hash(cred.password);

        try {
            const tag = (Math.random().toString(36) + '00000000000000000').slice(2, 8);

            await this.conn.query("INSERT INTO user(email, password, username, tag) VALUES(?, ?, ?, ?)",
                [cred.email, hash, cred.username, tag]
            );

            const userArray = await this.conn.query<IUser[]>("SELECT * FROM user WHERE email = ?", [cred.email]);

            const user = userArray[0];

            delete user.password;

            return { status: HttpStatus.CREATED, message: "Konto erstellt." }
        } catch (err) {
            if (err.code == "ER_DUP_ENTRY") {
                throw new ForbiddenException("E-Mail wird schon verwendet.");
            }

            throw new InternalServerErrorException("Serverfehler.");
        }
    }

    async signIn(dto: SignInDto) {
        try {
            const userArray = await this.conn.query<IUser[]>("SELECT * FROM user WHERE email = ?", [dto.email]);
            const user = userArray[0];

            if (!user) {
                throw new ForbiddenException("Konto nicht gefunden.");
            }

            const passwordMatch = await argon2.verify(user.password, dto.password);

            if (!passwordMatch) {
                throw new ForbiddenException("E-Mail oder Passwort nicht korrekt.");
            }

            return {
                access_token: await this.signAccessToken(user.user_id, user.email),
                refresh_token: await this.signRefreshToken(user.user_id, user.email)
            };
        } catch (err) {
            throw err;
        }
    }

    async refreshToken(sub: number, email: string) {
        return {
            access_token: await this.signAccessToken(sub, email)
        };
    }

    async signAccessToken(id: number, email: string): Promise<string> {
        const payload = {
            sub: id,
            email
        };

        const token = await this.jwt.signAsync(payload, {
            expiresIn: "6000s",
            secret: this.config.get("JWT_SECRET"),
        });

        return token;
    }

    async signRefreshToken(id: number, email: string): Promise<string> {
        const payload = {
            sub: id,
            email
        };

        const token = await this.jwt.signAsync(payload, {
            expiresIn: "7d",
            secret: this.config.get("REFRESH_JWT_SECRET"),
        });

        return token;
    }
}