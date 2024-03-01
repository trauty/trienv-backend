import { IsNotEmpty, IsString, MaxLength } from "class-validator";

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