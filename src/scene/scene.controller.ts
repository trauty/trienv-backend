import { Body, Controller, Delete, ForbiddenException, Get, HttpStatus, ParseFilePipeBuilder, Patch, Post, Query, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { JWTGuard } from "src/auth/guards/jwt.guard";
import { SceneService } from "./scene.service";
import { FileFieldsInterceptor, FileInterceptor } from "@nestjs/platform-express";
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
        const name = params.name as string;

        if (name) {
            return this.sceneService.getSceneByName(name);
        } else {
            return this.sceneService.getSceneById(id);
        }
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
    async createScene(@GetUser() user: IUser, @Body() scene: SceneDto) {
        const check = await this.conn.query<IScene[]>("SELECT * FROM scene WHERE fk_user_id = ? AND approved = FALSE;", [user.user_id]);

        if (check.length > 0) {
            throw new ForbiddenException("Es existiert schon eine nicht genehmigte Szene.");
        }

        return this.sceneService.createScene(user, scene);
    }

    @Patch("data")
    @UseInterceptors(FileInterceptor("scene"))
    async uploadSceneFile(
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({
                    fileType: 'application/octet-stream',
                })
                .addMaxSizeValidator({
                    maxSize: 50000000
                })
                .build({
                    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
                }),
        ) sceneFile: Express.Multer.File,
        @GetUser() user: IUser,
        @Body() sceneData: UpdateSceneDto
    ) {
        const check = await this.conn.query<IScene[]>("SELECT * FROM scene WHERE fk_user_id = ? AND scene_id = ?;", [user.user_id, sceneData.scene_id]);

        if (check.length <= 0) {
            throw new ForbiddenException(`Kein Zugriff auf Szene mit der ID: ${sceneData.scene_id}.`);
        }

        return this.sceneService.uploadSceneFile(sceneFile, sceneData);
    }

    @Patch("icon")
    @UseInterceptors(FileInterceptor("icon"))
    async uploadIconFile(
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({
                    fileType: ".(png|jpeg|jpg)",
                })
                .addMaxSizeValidator({
                    maxSize: 256000
                })
                .build({
                    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
                }),
        ) sceneFile: Express.Multer.File,
        @GetUser() user: IUser,
        @Body() sceneData: UpdateSceneDto
    ) {
        const check = await this.conn.query<IScene[]>("SELECT * FROM scene WHERE fk_user_id = ? AND scene_id = ?;", [user.user_id, sceneData.scene_id]);

        if (check.length <= 0) {
            throw new ForbiddenException(`Kein Zugriff auf Szene mit der ID: ${sceneData.scene_id}.`);
        }

        return this.sceneService.uploadIconFile(sceneFile, sceneData);
    }

    @Patch("banner")
    @UseInterceptors(FileInterceptor("banner"))
    async uploadBannerFile(
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({
                    fileType: ".(png|jpeg|jpg)",
                })
                .addMaxSizeValidator({
                    maxSize: 4000000
                })
                .build({
                    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
                }),
        ) sceneFile: Express.Multer.File,
        @GetUser() user: IUser,
        @Body() sceneData: UpdateSceneDto
    ) {
        const check = await this.conn.query<IScene[]>("SELECT * FROM scene WHERE fk_user_id = ? AND scene_id = ?;", [user.user_id, sceneData.scene_id]);

        if (check.length <= 0) {
            throw new ForbiddenException(`Kein Zugriff auf Szene mit der ID: ${sceneData.scene_id}.`);
        }

        return this.sceneService.uploadBannerFile(sceneFile, sceneData);
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