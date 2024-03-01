import { ForbiddenException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IUser } from "src/types";
import { UserNameChangeDto } from "./user.dto";
import { DataSource } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import * as fs from "node:fs";
import { v4 as uuidv4 } from "uuid";
import { error } from "node:console";

@Injectable()
export class UserService {
    constructor(
        private config: ConfigService,
        @InjectDataSource() private readonly conn: DataSource
    ) {}

    async changeName(user: IUser, dto: UserNameChangeDto) {
        try {
            await this.conn.query("UPDATE users SET username = ?, tag = ? WHERE email = ?", 
                [dto.new_username, dto.new_tag, user.email]
            );
        } catch (err) {
            if (err.code == "ER_DUP_ENTRY") {
                throw new ForbiddenException("Benutzername-Tag-Kombination schon vorhanden.");
            }
        }
        
        return { status: HttpStatus.OK, message: "Benutzername und Tag aktualisiert." };
    }

    async removeProfileImage(user: IUser) {
        try {
            if (!user.image) {
                throw new ForbiddenException();
            }

            const filename = user.image.split('/').pop();
            
            fs.rmSync(`${this.config.get("STATIC_LOCATION")}/images/${filename}`, {
                force: true,
            });

            await this.conn.query("UPDATE users SET image = ? WHERE email = ?", 
                [null, user.email]
            );
            
        } catch (err) {
            if(err instanceof ForbiddenException) {
                throw new ForbiddenException("Benutzer hat kein Bild.");
            }

            throw new InternalServerErrorException("Serverfehler.");
        }

        return { status: HttpStatus.OK, message: "Bild entfernt." }
    }

    async uploadProfilePicture(user: IUser, file: Express.Multer.File) {
        try {
            let filename: string;
            if (user.image) {
                filename = user.image.split('/').pop();
            } else {
                filename = `${user.id}-${uuidv4()}.${file.originalname.split('.').pop()}`;
            }

            fs.mkdirSync(`${this.config.get("STATIC_LOCATION")}/images`, { recursive: true })
            const ws = fs.createWriteStream(`${this.config.get("STATIC_LOCATION")}/images/${filename}`);
            ws.write(file.buffer);

            await this.conn.query("UPDATE users SET image = ? WHERE email = ?", 
                [`${this.config.get("BASE_URL")}/icons/${filename}`, user.email]
            );
        } catch (err) {
            throw new InternalServerErrorException("Serverfehler.");
        }

        return { status: HttpStatus.OK, message: "Bild hochgeladen." }
    }
}