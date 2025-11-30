import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import type { JWTPayload, JWTVerifyResult } from "jose";

const s = new TextEncoder().encode(process.env.DATABASE_URL || nanoid(32));

export function sign(
    payload: { id: string } & JWTPayload,
    expire: string = "24h",
    secret: Uint8Array = s
) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(expire)
        .sign(secret);
}

export function verify(token: string, secret: Uint8Array = s) {
    return jwtVerify(token, secret) as Promise<JWTVerifyResult<{ id?: string } & JWTPayload>>;
}
