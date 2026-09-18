from fastapi import APIRouter

from app.api import routes_auth, routes_health, routes_notes, routes_tags, routes_tasks

api_router = APIRouter()
api_router.include_router(routes_auth.router)
api_router.include_router(routes_tasks.router)
api_router.include_router(routes_notes.router)
api_router.include_router(routes_tags.router)
api_router.include_router(routes_health.router)
