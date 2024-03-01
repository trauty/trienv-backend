import { RowDataPacket } from "mysql2";

export interface IUser {
    id: number;
    email: string;
    password: string;
    username: string;
    tag: string;
    image: string | null;
    admin: boolean;
    createdAt: Date;
    updatedAt: Date;
};