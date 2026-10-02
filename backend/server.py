import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from lib.db import client, ensure_indexes  # noqa: E402
from lib.booking_logic import process_reminders  # noqa: E402
from routers import admin, public  # noqa: E402

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


async def reminder_loop() -> None:
    """Queues WhatsApp (MOCK) reminders: day-of and 15 minutes before."""
    while True:
        try:
            await process_reminders()
        except Exception as exc:  # keep loop alive
            logger.error("reminder loop: %s", exc)
        await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index_task = asyncio.create_task(ensure_indexes())
    app.state.reminder_task = asyncio.create_task(reminder_loop())
    yield
    app.state.reminder_task.cancel()
    client.close()


app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Bella Nails API"}


api_router.include_router(public.router)
api_router.include_router(admin.router)
api_router.include_router(admin.protected)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the router in the main app — keep last
app.include_router(api_router)
