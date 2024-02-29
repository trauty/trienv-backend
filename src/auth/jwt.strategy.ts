import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { conn } from "src/db";

@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy) {
    constructor(
        config: ConfigService
    ) {
        super({
            jwtReq: ExtractJwt.fromExtractors([
                JWTStrategy.extractJWTFromCookie,
                ExtractJwt.fromAuthHeaderAsBearerToken()
            ]),
            ignoreExpiration: false,
            secretOrKey: config.get("JWT_SECRET"),
        });
    }

    private static extractJWTFromCookie(req: Request): string | null {
        if 
        (
            req.signedCookies &&
            "trienv_token" in req.signedCookies &&
            req.signedCookies["trienv_token"].length > 0
        ) {
            return req.signedCookies["trienv_token"];
        }

        return null;
    }

    async validate(payload: { sub: number, email:string }) {
        try {
            const [rows] = conn.query(`SELECT * FROM users WHERE 'id' = ?`, payload.sub);
            
        } catch (err) {
            return null;
        }
    }
}