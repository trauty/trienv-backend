import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { InjectDataSource } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { DataSource } from "typeorm";

@Injectable()
export class RefreshJWTStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(
        config: ConfigService,
        @InjectDataSource() private readonly conn: DataSource

    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromBodyField("refresh_token"),
            ]),
            ignoreExpiration: false,
            secretOrKey: config.get("REFRESH_JWT_SECRET"),
            
        });
    }

    async validate(payload: { sub: number, email: string }) {
        return payload;
    }
}