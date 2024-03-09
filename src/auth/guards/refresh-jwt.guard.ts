import { AuthGuard } from "@nestjs/passport";

export class RefreshJWTGuard extends AuthGuard("jwt-refresh") {
    constructor() {
        super();
    }
}