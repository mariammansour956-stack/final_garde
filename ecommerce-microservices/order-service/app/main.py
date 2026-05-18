import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from prometheus_fastapi_instrumentator import Instrumentator

from app.config import settings
from app.database import async_session_factory, check_db_connection, engine
from app.models import Base
from app.routers import orders

logger = logging.getLogger(settings.service_name)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    )
    logger.info("Starting %s", settings.service_name)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.service_name,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Structured JSON Logging Middleware ──

@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start_time = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 2)
    logger.info(
        "request_id=%s | method=%s | path=%s | status_code=%s | duration_ms=%s",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


# ── Global Exception Handler ──

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# ── Health / Ready ──

@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.service_name, "version": "1.0.0"}


@app.get("/ready")
async def ready():
    db_ok = await check_db_connection()
    if db_ok:
        return {"ready": True}
    return JSONResponse(status_code=503, content={"ready": False})


# ── Routes ──

app.include_router(orders.router)


# ── Prometheus Metrics (must be after app creation, before server starts) ──

Instrumentator().instrument(app).expose(app)
