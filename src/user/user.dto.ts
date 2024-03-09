import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class UserNameChangeDto {
    @MaxLength(32)
    @IsNotEmpty()
    @IsString()
    new_username: string;

    @MaxLength(6)
    @IsNotEmpty()
    @IsString()
    new_tag: string;
}

export class UserBgDto {
    @MaxLength(7)
    @MinLength(7)
    @IsNotEmpty()
    @IsString()
    new_color: string;
}