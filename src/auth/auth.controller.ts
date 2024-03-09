import { Body, Controller, Post, Request, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto, SignUpDto } from './auth.dto';
import { Response } from 'express';
import { RefreshJWTGuard } from './guards/refresh-jwt.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post("signup")
    signUp(@Body() dto: SignUpDto) {
        return this.authService.signUp(dto);
    }

    @Post("signin")
    async signIn(@Body() dto: SignInDto) {
        return this.authService.signIn(dto);
    }

    @UseGuards(RefreshJWTGuard)
    @Post("refresh")
    async refreshToken(@Request() req) {
        return this.authService.refreshToken(req.user.sub, req.user.email);
    }
}
