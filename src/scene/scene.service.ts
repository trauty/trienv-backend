import { ForbiddenException, HttpStatus, Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectDataSource } from "@nestjs/typeorm";
import { IUser } from "src/types";
import { DataSource } from "typeorm";
import { SceneDto, UpdateSceneDto } from "./scene.dto";
import * as fs from "node:fs";
import { IScene } from "src/types/IScene";

@Injectable()
export class SceneService {
    constructor(
        private config: ConfigService,
        @InjectDataSource() private readonly conn: DataSource
    ) {}

    async getScene(id: string) {
        try {
            const scenes = await this.conn.query(`
                SELECT scene_id, version_id, name, description, icon_url, banner_url, scene_url, created_at, updated_at 
                FROM scene WHERE ${id == "all" ? "" : "scene_id = ? AND"} approved = TRUE;`, [id]
            );

            return { status: HttpStatus.OK, scenes };
        } catch (err) {
            throw new InternalServerErrorException("Serverfehler: " + err);
        }
    }

    async getUnapprovedScene(id: string) {
        try {
            const scenes = await this.conn.query(`
                SELECT scene_id, version_id, name, description, icon_url, banner_url, scene_url, created_at, updated_at 
                FROM scene WHERE scene_id = ? AND approved = FALSE;`, [id]
            );

            return { status: HttpStatus.OK, scene: scenes[0] };
        } catch (err) {
            throw new InternalServerErrorException("Serverfehler: " + err);
        }
    }

    async getUnapprovedScenesUser(user: IUser) {
        try {
            const scenes = await this.conn.query(`
                SELECT scene_id, version_id, name, description, icon_url, banner_url, scene_url, created_at, updated_at 
                FROM scene WHERE fk_user_id = ? AND approved = FALSE;`, [user.user_id]
            );

            return { status: HttpStatus.OK, scenes };
        } catch (err) {
            throw new InternalServerErrorException("Serverfehler: " + err);
        }
    }

    async getUnapprovedScenesAdmin() {
        try {
            const scenes = await this.conn.query("SELECT * FROM scene WHERE approved = FALSE;");

            return { status: HttpStatus.OK, scenes };
        } catch (err) {
            throw new InternalServerErrorException("Serverfehler: " + err);
        }
    }

    async uploadScene(icon: Express.Multer.File, banner: Express.Multer.File, scene: Express.Multer.File, user: IUser, sceneData: SceneDto) {
        try {
            await this.conn.query("START TRANSACTION;");

            await this.conn.query("INSERT INTO scene (name, description, icon_url, banner_url, scene_url, fk_user_id) VALUES (?, ?, ?, ?, ?, ?);", [sceneData.name, sceneData.description, "temp", "temp", "temp", user.user_id]);

            const res = await this.conn.query<IScene[]>("SELECT * FROM scene WHERE fk_user_id = ?;", [user.user_id]);

            const newScene = res[0];

            const baseUrl = `${this.config.get("BASE_URL")}/scenes/${newScene.scene_id}/`;


            const iconName = `icon.${icon.originalname.split(".").pop()}`;
            const bannerName = `banner.${banner.originalname.split(".").pop()}`;
            
            await this.conn.query("UPDATE scene SET icon_url = ?, banner_url = ?, scene_url = ? WHERE fk_user_id = ?;", [baseUrl + iconName, baseUrl + bannerName, baseUrl + "scene.pck", user.user_id]);

            fs.mkdirSync(`${this.config.get("STATIC_LOCATION")}/scenes/${newScene.scene_id}`, { recursive: true })

            const wsIcon = fs.createWriteStream(`${this.config.get("STATIC_LOCATION")}/scenes/${newScene.scene_id}/${iconName}`);
            wsIcon.write(icon.buffer);
            wsIcon.end();

            const wsBanner = fs.createWriteStream(`${this.config.get("STATIC_LOCATION")}/scenes/${newScene.scene_id}/${bannerName}`);
            wsBanner.write(banner.buffer);
            wsBanner.end();

            const wsScene = fs.createWriteStream(`${this.config.get("STATIC_LOCATION")}/scenes/${newScene.scene_id}/scene.pck`);
            wsScene.write(scene.buffer);
            wsScene.end();

            await this.conn.query("COMMIT;");

            return { status: HttpStatus.CREATED, message: "Szene erfolgreich hochgeladen." }
        } catch (err) {
            await this.conn.query("ROLLBACK;");
            throw new InternalServerErrorException("Serverfehler: " + err);
        }
    }

    async updateScene(newScene: Express.Multer.File, sceneData: UpdateSceneDto) {
        try {
            await this.conn.query("START TRANSACTION;");
            await this.conn.query("UPDATE scene SET version_id = version_id + 1 WHERE scene_id = ?;", [sceneData.scene_id]);

            const wsScene = fs.createWriteStream(`${this.config.get("STATIC_LOCATION")}/scenes/${sceneData.scene_id}/scene.pck`);
            wsScene.write(newScene.buffer);
            wsScene.end();
            await this.conn.query("COMMIT;");
            return { status: HttpStatus.CREATED, message: "Szene erfolgreich aktualisiert." };
        } catch (err) {
            await this.conn.query("ROLLBACK;");
            throw new InternalServerErrorException("Serverfehler: " + err);
        }
    }

    async approveScene(sceneData: UpdateSceneDto) {
        try {
            await this.conn.query("UPDATE scene SET approved = TRUE WHERE scene_id = ?;", [sceneData.scene_id]);
            return { status: HttpStatus.CREATED, message: "Szene erfolgreich genehmigt." };
        } catch (err) {
            throw new InternalServerErrorException("Serverfehler: " + err);
        }
    }

    async deleteScene(sceneData: UpdateSceneDto) {
        try {
            await this.conn.query("START TRANSACTION;");
            await this.conn.query("DELETE FROM scene WHERE scene_id = ?;", [sceneData.scene_id]);

            fs.rmSync(`${this.config.get("STATIC_LOCATION")}/scenes/${sceneData.scene_id}`, { recursive: true, force: true });

            await this.conn.query("COMMIT;");
            return { status: HttpStatus.CREATED, message: "Szene erfolgreich gelöscht." };
        } catch (err) {
            await this.conn.query("ROLLBACK;");
            throw new InternalServerErrorException("Serverfehler: " + err);
        }
    }
}