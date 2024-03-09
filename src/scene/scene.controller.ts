import { Body, Controller, Delete, ForbiddenException, Get, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { JWTGuard } from "src/auth/guards/jwt.guard";
import { SceneService } from "./scene.service";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { GetUser } from "src/auth/get-user.decorator";
import { IUser } from "src/types";
import { SceneDto, UpdateSceneDto } from "./scene.dto";
import { IScene } from "src/types/IScene";
import { DataSource } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";

@UseGuards(JWTGuard)
@Controller("scenes")
export class SceneController {
    constructor(
        private sceneService: SceneService,
        @InjectDataSource() private readonly conn: DataSource
    ) { }

    @Get()
    async getScene(@Query() params: any) {
        const id = params.sceneId as string;

        return this.sceneService.getScene(id);
    }

    @Get("unapproved")
    async getUnapprovedScene(@Query() params: any, @GetUser() user: IUser) {
        const id = params.sceneId as string;
        const check = await this.conn.query<IScene[]>("SELECT * FROM scene WHERE fk_user_id = ? AND scene_id = ? AND approved = FALSE;", [user.user_id, id]);

        if (check.length <= 0 && !user.admin) {
            throw new ForbiddenException("Kein Zugriff.");
        }

        return this.sceneService.getUnapprovedScene(id);
    }

    @Get("unapproved/all")
    async getUnapprovedScenesUser(@GetUser() user: IUser) {
        const check = await this.conn.query<IScene[]>("SELECT * FROM scene WHERE fk_user_id = ? AND approved = FALSE;", [user.user_id]);

        if (check.length <= 0 && !user.admin) {
            throw new ForbiddenException("Kein Zugriff.");
        }

        return this.sceneService.getUnapprovedScenesUser(user);
    }

    @Get("unapproved/admin")
    async getUnapprovedScenesAdmin(@GetUser() user: IUser) {
        if (!user.admin) {
            throw new ForbiddenException("Nur Admins können diesen Endpunkt benutzen.");
        }

        return this.sceneService.getUnapprovedScenesAdmin();
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

    @Patch()
    @UseInterceptors(FileFieldsInterceptor([
        { name: "new_scene", maxCount: 1 }
    ]))
    async updateScene(@UploadedFiles() files: { new_scene?: Express.Multer.File[] }, @GetUser() user: IUser, @Body() scene: UpdateSceneDto) {

        const check = await this.conn.query<IScene[]>("SELECT * FROM scene WHERE fk_user_id = ? AND scene_id = ?;", [user.user_id, scene.scene_id]);

        if (check.length <= 0) {
            throw new ForbiddenException(`Kein Zugriff auf Szene mit der ID: ${scene.scene_id}.`);
        }

        return this.sceneService.updateScene(files.new_scene[0], scene);
    }

    @Patch("approve")
    async approveScene(@GetUser() user: IUser, @Body() scene: UpdateSceneDto) {

        if (!user.admin) {
            throw new ForbiddenException("Nur Admins können diesen Endpunkt benutzen.");
        }

        return this.sceneService.approveScene(scene);
    }

    @Delete()
    async deleteScene(@GetUser() user: IUser, @Body() scene: UpdateSceneDto) {

        const check = await this.conn.query<IScene[]>("SELECT * FROM scene WHERE fk_user_id = ? AND scene_id = ?;", [user.user_id, scene.scene_id]);

        if (check.length <= 0 && !user.admin) {
            throw new ForbiddenException(`Kein Zugriff auf Szene mit der ID: ${scene.scene_id}.`);
        }

        return this.sceneService.deleteScene(scene);
    }
}