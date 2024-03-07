import { RowDataPacket } from "mysql2";

export interface IUser {
    user_id: number;
    email: string;
    password: string;
    username: string;
    tag: string;
    image: string | null;
    bg_color: string;
    admin: boolean;
    created_at: Date;
    updated_at: Date;
};