import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto, SignUpDto } from './auth.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post("signup")
    signUp(@Body() dto: SignUpDto) {
        return this.authService.signUp(dto);
    }

    @Post("signin")
    async signIn(@Body() dto: SignInDto, @Res({ passthrough: true }) res: Response) {
        const access_token = (await this.authService.signIn(dto)).access_token;

        return {
            status: 200,
            message: "Erfolgreich angemeldet.",
            access_token,
            expires_in: 604800
        };
    }
}
