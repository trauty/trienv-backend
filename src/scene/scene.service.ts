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

    async getSceneById(id: string) {
        try {
            const scenes = await this.conn.query(`
                SELECT scene_id, version_id, name, description, icon_url, banner_url, scene_url, created_at, updated_at 
                FROM scene WHERE ${id == "all" ? "" : "scene_id = ? AND"} approved = TRUE;`, [id]
            );

            return { status: HttpStatus.OK, scenes };
        } catch (err) {
            throw new InternalServerErrorException("Serverfehler.");
        }
    }

    async getSceneByName(name: string) {
        try {
            const scenes = await this.conn.query(`
                SELECT scene_id, version_id, name, description, icon_url, banner_url, scene_url, created_at, updated_at 
                FROM scene WHERE name LIKE ? AND approved = TRUE;`, [`%${name}%`]
            );

            return { status: HttpStatus.OK, scenes };
        } catch (err) {
            throw err;
            throw new InternalServerErrorException("Serverfehler.");
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
            throw new InternalServerErrorException("Serverfehler.");
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
            throw new InternalServerErrorException("Serverfehler.");
        }
    }

    async getUnapprovedScenesAdmin() {
        try {
            const scenes = await this.conn.query("SELECT * FROM scene WHERE approved = FALSE;");

            return { status: HttpStatus.OK, scenes };
        } catch (err) {
            throw new InternalServerErrorException("Serverfehler.");
        }
    }

    async createScene(user: IUser, sceneData: SceneDto) {
        try {
            await this.conn.query("INSERT INTO scene (name, description, fk_user_id) VALUES (?, ?, ?);", [sceneData.name, sceneData.description, user.user_id]);

            return { status: HttpStatus.CREATED, message: "Szene erfolgreich erstellt." }
        } catch (err) {
            throw new InternalServerErrorException("Serverfehler.");
        }
    }

    async uploadSceneFile(sceneFile: Express.Multer.File, sceneData: UpdateSceneDto) {
        try {
            await this.conn.query("START TRANSACTION;");

            const res = await this.conn.query<IScene[]>("SELECT * FROM scene WHERE scene_id = ?;", [sceneData.scene_id]);
            const scene = res[0];
            
            const baseUrl = `${this.config.get("BASE_URL")}/scenes/${scene.scene_id}/`;
            
            await this.conn.query("UPDATE scene SET scene_url = ?, version_id = version_id + 1 WHERE scene_id = ?;", [baseUrl + "scene.pck", scene.scene_id]);

            const baseDir = `${this.config.get("STATIC_LOCATION")}/scenes/${scene.scene_id}`;

            if (!fs.existsSync(baseDir)) {
                fs.mkdirSync(baseDir, { recursive: true });
            }

            const wsScene = fs.createWriteStream(`${baseDir}/scene.pck`);
            wsScene.write(sceneFile.buffer);
            wsScene.end();

            await this.conn.query("COMMIT;");

            return { status: HttpStatus.CREATED, message: "Szene erfolgreich hochgeladen." }
        } catch (err) {
            await this.conn.query("ROLLBACK;");
            throw new InternalServerErrorException("Serverfehler.");
        }
    }

    async uploadIconFile(iconFile: Express.Multer.File, sceneData: UpdateSceneDto) {
        try {
            await this.conn.query("START TRANSACTION;");

            const res = await this.conn.query<IScene[]>("SELECT * FROM scene WHERE scene_id = ?;", [sceneData.scene_id]);
            const scene = res[0];

            const baseUrl = `${this.config.get("BASE_URL")}/scenes/${scene.scene_id}/`;
            const iconName = `icon.${iconFile.originalname.split(".").pop()}`;
            
            await this.conn.query("UPDATE scene SET icon_url = ? WHERE scene_id = ?;", [baseUrl + iconName, scene.scene_id]);

            const baseDir = `${this.config.get("STATIC_LOCATION")}/scenes/${scene.scene_id}`;

            if (!fs.existsSync(baseDir)) {
                fs.mkdirSync(baseDir, { recursive: true });
            }

            const wsIcon = fs.createWriteStream(`${baseDir}/${iconName}`);
            wsIcon.write(iconFile.buffer);
            wsIcon.end();

            await this.conn.query("COMMIT;");

            return { status: HttpStatus.CREATED, message: "Icon erfolgreich hochgeladen." }
        } catch (err) {
            await this.conn.query("ROLLBACK;");
            throw new InternalServerErrorException("Serverfehler.");
        }
    }

    async uploadBannerFile(bannerFile: Express.Multer.File, sceneData: UpdateSceneDto) {
        try {
            await this.conn.query("START TRANSACTION;");

            const res = await this.conn.query<IScene[]>("SELECT * FROM scene WHERE scene_id = ?;", [sceneData.scene_id]);
            const scene = res[0];

            const baseUrl = `${this.config.get("BASE_URL")}/scenes/${scene.scene_id}/`;
            const bannerName = `banner.${bannerFile.originalname.split(".").pop()}`;
            
            await this.conn.query("UPDATE scene SET banner_url = ? WHERE scene_id = ?;", [baseUrl + bannerName, scene.scene_id]);

            const baseDir = `${this.config.get("STATIC_LOCATION")}/scenes/${scene.scene_id}`;

            if (!fs.existsSync(baseDir)) {
                fs.mkdirSync(baseDir, { recursive: true });
            }
            
            const wsBanner = fs.createWriteStream(`${baseDir}/${bannerName}`);
            wsBanner.write(bannerFile.buffer);
            wsBanner.end();

            await this.conn.query("COMMIT;");

            return { status: HttpStatus.CREATED, message: "Banner erfolgreich hochgeladen." }
        } catch (err) {
            await this.conn.query("ROLLBACK;");
            throw new InternalServerErrorException("Serverfehler.");
        }
    }

    async approveScene(sceneData: UpdateSceneDto) {
        try {
            await this.conn.query("UPDATE scene SET approved = TRUE WHERE scene_id = ?;", [sceneData.scene_id]);
            return { status: HttpStatus.CREATED, message: "Szene erfolgreich genehmigt." };
        } catch (err) {
            throw new InternalServerErrorException("Serverfehler.");
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
            throw new InternalServerErrorException("Serverfehler.");
        }
    }
}