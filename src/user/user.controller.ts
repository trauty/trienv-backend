import { Body, Controller, Delete, Get, HttpStatus, ParseFilePipeBuilder, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { GetUser } from "src/auth/get-user.decorator";
import { JWTGuard } from "src/auth/jwt.guard";
import { IUser } from "src/types";
import { UserService } from "./user.service";
import { UserBgDto, UserNameChangeDto } from "./user.dto";
import { FileInterceptor } from "@nestjs/platform-express";

@UseGuards(JWTGuard)
@Controller("user")
export class UserController {
    constructor(
        private userService: UserService
    ) { }

    @Get("me")
    getUser(@GetUser() user: IUser) {
        return user;
    }

    @Patch("username")
    changeUsername(@GetUser() user: IUser, @Body() dto: UserNameChangeDto) {
        return this.userService.changeName(user, dto);
    }

    @Patch("color")
    changeBgColor(@GetUser() user: IUser, @Body() dto: UserBgDto) {
        return this.userService.changeBgColor(user, dto);
    }

    @Delete("image")
    removeProfileImage(@GetUser() user: IUser) {
        return this.userService.removeProfileImage(user);
    }

    @Post("image")
    @UseInterceptors(FileInterceptor("image"))
    uploadProfileImage(@GetUser() user: IUser, @UploadedFile(
        new ParseFilePipeBuilder()
            .addFileTypeValidator({
                fileType: '.(png|jpeg|jpg)',
            })
            .addMaxSizeValidator({
                maxSize: 256000
            })
            .build({
                errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
            }),
    ) file: Express.Multer.File) {
        return this.userService.uploadProfilePicture(user, file);
    }
}