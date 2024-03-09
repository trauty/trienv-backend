import { Body, Controller, Get, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { JWTGuard } from "src/auth/jwt.guard";
import { SceneService } from "./scene.service";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { GetUser } from "src/auth/get-user.decorator";
import { IUser } from "src/types";
import { SceneDto } from "./scene.dto";

@UseGuards(JWTGuard)
@Controller("scene")
export class SceneController {
    constructor(
        private sceneService: SceneService
    ) {}

    @Get()
    async getScenes(@Query() params: any) {
        const verified = params.verified == "true";

        return {verified}
    }

    @Post()
    @UseInterceptors(FileFieldsInterceptor([
        { name: "icon", maxCount: 1 },
        { name: "banner", maxCount: 1 },
        { name: "scene", maxCount: 1 }
    ]))
    async uploadScene(@UploadedFiles() files: { icon?: Express.Multer.File[], banner?: Express.Multer.File[], scene?: Express.Multer.File[] }, @GetUser() user: IUser, @Body() scene: SceneDto) {
        return this.sceneService.uploadScene(files.icon[0], files.banner[0], files.scene[0], user, scene);
    }
}