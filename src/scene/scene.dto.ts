import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class SceneDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(32)
    name: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(512)
    description: string;
}

export class UpdateSceneDto {
    @IsNotEmpty()
    scene_id: string;
}