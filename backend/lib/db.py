"""Shared Mongo handle — import `client`/`db` from here (server.py, routers, seed.py)."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel

load_dotenv(Path(__file__).parent.parent / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

logger = logging.getLogger(__name__)

# One entry per collection: every field a route filters, sorts, or dedupes on. Applied by ensure_indexes() at startup.
INDEXES: dict[str, list[IndexModel]] = {
    "services": [IndexModel([("id", ASCENDING)], name="id", unique=True), IndexModel([("active", ASCENDING), ("price", ASCENDING)], name="active_price")],
    "bookings": [IndexModel([("id", ASCENDING)], name="id", unique=True), IndexModel([("date", ASCENDING), ("time", ASCENDING)], name="date_time"), IndexModel([("status", ASCENDING)], name="status")],
    "messages": [IndexModel([("id", ASCENDING)], name="id", unique=True), IndexModel([("booking_id", ASCENDING), ("kind", ASCENDING)], name="booking_kind"), IndexModel([("created_at", DESCENDING)], name="created_desc")],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:  # one at a time so a bad spec skips only itself
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:  # never block boot on an index; the log line names what to fix
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)
