import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectDataSource } from "@nestjs/typeorm";
import { IUser } from "src/types";
import { DataSource } from "typeorm";
import { SceneDto } from "./scene.dto";
import * as fs from "node:fs";
import { IScene } from "src/types/IScene";

@Injectable()
export class SceneService {
    constructor(
        private config: ConfigService,
        @InjectDataSource() private readonly conn: DataSource
    ) {}

    async uploadScene(icon: Express.Multer.File, banner: Express.Multer.File, scene: Express.Multer.File, user: IUser, sceneData: SceneDto) {

        try {
            await this.conn.query("START TRANSACTION;");

            await this.conn.query("INSERT INTO scene (name, description, icon_url, banner_url, scene_url, fk_user_id) VALUES (?, ?, ?, ?, ?, ?);", [sceneData.name, sceneData.description, "temp", "temp", "temp", user.user_id]);

            const res = await this.conn.query<IScene[]>("SELECT * FROM scene WHERE fk_user_id = ?;", [user.user_id]);

            const newScene = res[0];

            const baseUrl = `${this.config.get("BASE_URL")}/scenes/${newScene.scene_id}/`;


            const iconName = `icon.${icon.originalname.split(".").pop()}`;
            const bannerName = `banner.${banner.originalname.split(".").pop()}`;
            const sceneName = `scene.${scene.originalname.split(".").pop()}`;
            
            await this.conn.query("UPDATE scene SET icon_url = ?, banner_url = ?, scene_url = ? WHERE fk_user_id = ?;", [baseUrl + iconName, baseUrl + bannerName, baseUrl + sceneName, user.user_id]);

            const res2 = await this.conn.query<IScene[]>("SELECT * FROM scene WHERE fk_user_id = ?;", [user.user_id]);
            console.log(res2)

            fs.mkdirSync(`${this.config.get("STATIC_LOCATION")}/scenes/${newScene.scene_id}`, { recursive: true })

            const wsIcon = fs.createWriteStream(`${this.config.get("STATIC_LOCATION")}/scenes/${newScene.scene_id}/${iconName}`);
            wsIcon.write(icon.buffer);
            wsIcon.end();

            const wsBanner = fs.createWriteStream(`${this.config.get("STATIC_LOCATION")}/scenes/${newScene.scene_id}/${bannerName}`);
            wsBanner.write(banner.buffer);
            wsBanner.end();

            const wsScene = fs.createWriteStream(`${this.config.get("STATIC_LOCATION")}/scenes/${newScene.scene_id}/${sceneName}`);
            wsScene.write(scene.buffer);
            wsScene.end();

            await this.conn.query("COMMIT;");
        } catch (err) {
            await this.conn.query("ROLLBACK;");
            throw new InternalServerErrorException("Serverfehler: " + err);
        }
    }
}