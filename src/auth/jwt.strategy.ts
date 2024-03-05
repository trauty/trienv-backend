import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { InjectDataSource } from "@nestjs/typeorm";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { IUser } from "src/types";
import { DataSource } from "typeorm";

@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy) {
    constructor(
        config: ConfigService,
        @InjectDataSource() private readonly conn: DataSource

    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken()
            ]),
            ignoreExpiration: false,
            secretOrKey: config.get("JWT_SECRET"),
        });
    }

    async validate(payload: { sub: number, email: string }) {
        try {
            const userArray = await this.conn.query<IUser[]>("SELECT * FROM users WHERE email = ?", [payload.email]);

            const user = userArray[0];

            delete user.password;

            return user;
            
        } catch (err) {
            return null;
        }
    }
}