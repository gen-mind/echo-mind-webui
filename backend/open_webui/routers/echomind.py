"""
EchoMind API Proxy Router.

Proxies requests from the frontend to the EchoMind API backend.
This enables the webui to forward requests to EchoMind's FastAPI services
for documents, upload, connectors, assistants, LLMs, etc.

Environment Variables:
    ECHOMIND_API_URL: Base URL of the EchoMind API (e.g., http://api:8000)
"""

import logging
from typing import Optional

import aiohttp
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from starlette.background import BackgroundTask

from open_webui.env import (
    AIOHTTP_CLIENT_TIMEOUT,
    ECHOMIND_API_URL,
    ECHOMIND_API_ENABLED,
)
from open_webui.utils.auth import get_verified_user

log = logging.getLogger(__name__)

router = APIRouter()


async def cleanup_response(
    response: Optional[aiohttp.ClientResponse],
    session: Optional[aiohttp.ClientSession],
) -> None:
    """Clean up aiohttp response and session."""
    if response:
        response.close()
    if session:
        await session.close()


async def proxy_request(
    request: Request,
    path: str,
    method: str,
) -> StreamingResponse:
    """
    Proxy a request to the EchoMind API.

    Args:
        request: The incoming FastAPI request.
        path: The path to forward (without /api/v1 prefix).
        method: HTTP method.

    Returns:
        StreamingResponse with the proxied response.

    Raises:
        HTTPException: If EchoMind API is not configured or request fails.
    """
    if not ECHOMIND_API_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="EchoMind API integration is not configured. Set ECHOMIND_API_URL.",
        )

    target_url = f"{ECHOMIND_API_URL}/api/v1/{path}"
    log.debug(f"Proxying {method} request to: {target_url}")

    # Forward headers, excluding host
    headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in ("host", "content-length")
    }

    # Get request body
    body = await request.body()

    session = None
    response = None

    try:
        timeout = aiohttp.ClientTimeout(total=AIOHTTP_CLIENT_TIMEOUT)
        session = aiohttp.ClientSession(timeout=timeout, trust_env=True)

        response = await session.request(
            method=method,
            url=target_url,
            headers=headers,
            data=body if body else None,
            params=request.query_params,
        )

        # Get response headers to forward
        response_headers = {
            key: value
            for key, value in response.headers.items()
            if key.lower()
            not in (
                "content-encoding",
                "content-length",
                "transfer-encoding",
                "connection",
            )
        }

        async def generate():
            try:
                async for chunk in response.content.iter_any():
                    yield chunk
            finally:
                await cleanup_response(response, session)

        return StreamingResponse(
            generate(),
            status_code=response.status,
            headers=response_headers,
            media_type=response.headers.get("content-type"),
        )

    except aiohttp.ClientError as e:
        log.error(f"EchoMind API request failed: {e}")
        if session:
            await session.close()
        raise HTTPException(
            status_code=502,
            detail=f"Failed to connect to EchoMind API: {str(e)}",
        )
    except Exception as e:
        log.exception(f"Unexpected error proxying to EchoMind API: {e}")
        if session:
            await session.close()
        raise HTTPException(
            status_code=500,
            detail=f"Internal error: {str(e)}",
        )


# =============================================================================
# Documents Routes
# =============================================================================


@router.api_route(
    "/documents/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
)
async def proxy_documents(
    request: Request,
    path: str = "",
    user=Depends(get_verified_user),
):
    """Proxy /documents/* requests to EchoMind API."""
    full_path = f"documents/{path}" if path else "documents"
    return await proxy_request(request, full_path, request.method)


@router.api_route(
    "/documents",
    methods=["GET", "POST"],
)
async def proxy_documents_root(
    request: Request,
    user=Depends(get_verified_user),
):
    """Proxy /documents requests to EchoMind API."""
    return await proxy_request(request, "documents", request.method)


# =============================================================================
# Connectors Routes
# =============================================================================


@router.api_route(
    "/connectors/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
)
async def proxy_connectors(
    request: Request,
    path: str = "",
    user=Depends(get_verified_user),
):
    """Proxy /connectors/* requests to EchoMind API."""
    full_path = f"connectors/{path}" if path else "connectors"
    return await proxy_request(request, full_path, request.method)


@router.api_route(
    "/connectors",
    methods=["GET", "POST"],
)
async def proxy_connectors_root(
    request: Request,
    user=Depends(get_verified_user),
):
    """Proxy /connectors requests to EchoMind API."""
    return await proxy_request(request, "connectors", request.method)


# =============================================================================
# Assistants Routes
# =============================================================================


@router.api_route(
    "/assistants/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
)
async def proxy_assistants(
    request: Request,
    path: str = "",
    user=Depends(get_verified_user),
):
    """Proxy /assistants/* requests to EchoMind API."""
    full_path = f"assistants/{path}" if path else "assistants"
    return await proxy_request(request, full_path, request.method)


@router.api_route(
    "/assistants",
    methods=["GET", "POST"],
)
async def proxy_assistants_root(
    request: Request,
    user=Depends(get_verified_user),
):
    """Proxy /assistants requests to EchoMind API."""
    return await proxy_request(request, "assistants", request.method)


# =============================================================================
# LLMs Routes
# =============================================================================


@router.api_route(
    "/llms/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
)
async def proxy_llms(
    request: Request,
    path: str = "",
    user=Depends(get_verified_user),
):
    """Proxy /llms/* requests to EchoMind API."""
    full_path = f"llms/{path}" if path else "llms"
    return await proxy_request(request, full_path, request.method)


@router.api_route(
    "/llms",
    methods=["GET", "POST"],
)
async def proxy_llms_root(
    request: Request,
    user=Depends(get_verified_user),
):
    """Proxy /llms requests to EchoMind API."""
    return await proxy_request(request, "llms", request.method)


# =============================================================================
# Embedding Models Routes
# =============================================================================


@router.api_route(
    "/embedding-models/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
)
async def proxy_embedding_models(
    request: Request,
    path: str = "",
    user=Depends(get_verified_user),
):
    """Proxy /embedding-models/* requests to EchoMind API."""
    full_path = f"embedding-models/{path}" if path else "embedding-models"
    return await proxy_request(request, full_path, request.method)


@router.api_route(
    "/embedding-models",
    methods=["GET", "POST"],
)
async def proxy_embedding_models_root(
    request: Request,
    user=Depends(get_verified_user),
):
    """Proxy /embedding-models requests to EchoMind API."""
    return await proxy_request(request, "embedding-models", request.method)


# =============================================================================
# Teams Routes
# =============================================================================


@router.api_route(
    "/teams/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
)
async def proxy_teams(
    request: Request,
    path: str = "",
    user=Depends(get_verified_user),
):
    """Proxy /teams/* requests to EchoMind API."""
    full_path = f"teams/{path}" if path else "teams"
    return await proxy_request(request, full_path, request.method)


@router.api_route(
    "/teams",
    methods=["GET", "POST"],
)
async def proxy_teams_root(
    request: Request,
    user=Depends(get_verified_user),
):
    """Proxy /teams requests to EchoMind API."""
    return await proxy_request(request, "teams", request.method)


# =============================================================================
# Chat Routes (EchoMind RAG chat)
# =============================================================================


@router.api_route(
    "/chat/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
)
async def proxy_chat(
    request: Request,
    path: str = "",
    user=Depends(get_verified_user),
):
    """Proxy /chat/* requests to EchoMind API."""
    full_path = f"chat/{path}" if path else "chat"
    return await proxy_request(request, full_path, request.method)


# =============================================================================
# Health Check
# =============================================================================


@router.get("/echomind/health")
async def echomind_health():
    """Check if EchoMind API integration is enabled and reachable."""
    if not ECHOMIND_API_ENABLED:
        return {
            "status": "disabled",
            "message": "ECHOMIND_API_URL not configured",
        }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{ECHOMIND_API_URL}/health",
                timeout=aiohttp.ClientTimeout(total=5),
            ) as response:
                if response.status == 200:
                    return {
                        "status": "healthy",
                        "echomind_api_url": ECHOMIND_API_URL,
                    }
                return {
                    "status": "unhealthy",
                    "echomind_api_url": ECHOMIND_API_URL,
                    "response_status": response.status,
                }
    except Exception as e:
        return {
            "status": "error",
            "echomind_api_url": ECHOMIND_API_URL,
            "error": str(e),
        }
