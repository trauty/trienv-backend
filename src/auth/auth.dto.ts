import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SignUpDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(32)
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SignInDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}