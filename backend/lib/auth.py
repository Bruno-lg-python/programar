import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, Request

COOKIE = "admin_session"
SECRET = os.environ.get("JWT_SECRET", "change-me-nails-secret")


def make_token() -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=7)
    return jwt.encode({"role": "admin", "exp": exp}, SECRET, algorithm="HS256")


async def require_admin(request: Request) -> None:
    token = request.cookies.get(COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        jwt.decode(token, SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Sessão inválida")
