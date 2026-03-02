"""API Routes for InsightSage Agent"""

from datetime import datetime
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address
from loguru import logger


# Rate limiter
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()


# Request/Response Models
class ExecuteSQLRequest(BaseModel):
    """Request body for SQL execution"""
    sql_query: str = Field(..., description="SQL SELECT query to execute")
    params: Optional[Dict[str, Any]] = Field(default=None, description="Query parameters")


class ExecuteSQLResponse(BaseModel):
    """Response body for SQL execution"""
    result: list
    metadata: Dict[str, Any]


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    agent_name: str
    version: str
    timestamp: str
    sage_connected: bool
    backend_registered: bool


class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    code: str
    timestamp: str


# Dependency injection placeholders (set by main.py)
_database = None
_heartbeat = None
_config = None


def set_dependencies(database, heartbeat, config):
    """Set module dependencies"""
    global _database, _heartbeat, _config
    _database = database
    _heartbeat = heartbeat
    _config = config


def get_database():
    """Get database instance"""
    if _database is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return _database


def get_heartbeat():
    """Get heartbeat service instance"""
    if _heartbeat is None:
        raise HTTPException(status_code=500, detail="Heartbeat service not initialized")
    return _heartbeat


def get_config():
    """Get config instance"""
    if _config is None:
        raise HTTPException(status_code=500, detail="Config not initialized")
    return _config


@router.get("/ping", response_model=HealthResponse, tags=["Health"])
async def ping(
    database = Depends(get_database),
    heartbeat = Depends(get_heartbeat),
    config = Depends(get_config)
):
    """
    Health check endpoint.
    Returns agent status and connectivity information.
    """
    # Test Sage connection
    sage_ok, _ = database.test_connection()
    
    # Get heartbeat status
    hb_status = heartbeat.get_status()
    
    return HealthResponse(
        status="ok",
        agent_name=config.agent.name,
        version="1.0.0",
        timestamp=datetime.utcnow().isoformat(),
        sage_connected=sage_ok,
        backend_registered=hb_status["is_registered"]
    )


@router.get("/health", tags=["Health"])
async def health():
    """Simple health check for load balancers"""
    return {"status": "ok"}


@router.post(
    "/execute_sql",
    response_model=ExecuteSQLResponse,
    responses={400: {"model": ErrorResponse}, 403: {"model": ErrorResponse}},
    tags=["Query"]
)
@limiter.limit("10/minute")
async def execute_sql(
    request: Request,
    body: ExecuteSQLRequest,
    database = Depends(get_database)
):
    """
    Execute a SQL SELECT query on Sage database.
    
    Security:
    - Only SELECT queries are allowed
    - Tables must be in the whitelist
    - Results limited to 1000 rows max
    - Rate limited to 10 requests/minute
    - Query timeout: 5 seconds
    """
    from ..security import SQLSecurityError
    from ..database import DatabaseError
    
    logger.info(f"Received SQL query request from {request.client.host}")
    
    try:
        result = database.execute_query(body.sql_query, body.params)
        return ExecuteSQLResponse(**result)
        
    except SQLSecurityError as e:
        logger.warning(f"Security violation: {e}")
        raise HTTPException(
            status_code=403,
            detail={"error": str(e), "code": "SECURITY_VIOLATION", "timestamp": datetime.utcnow().isoformat()}
        )
    except DatabaseError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(
            status_code=400,
            detail={"error": str(e), "code": "DATABASE_ERROR", "timestamp": datetime.utcnow().isoformat()}
        )
    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": "Internal server error", "code": "INTERNAL_ERROR", "timestamp": datetime.utcnow().isoformat()}
        )


@router.get("/status", tags=["Status"])
async def get_status(
    database = Depends(get_database),
    heartbeat = Depends(get_heartbeat),
    config = Depends(get_config)
):
    """
    Get detailed agent status.
    """
    sage_ok, sage_msg = database.test_connection()
    hb_status = heartbeat.get_status()
    
    return {
        "agent": {
            "name": config.agent.name,
            "version": "1.0.0",
            "uptime": "N/A"  # Could track this
        },
        "sage": {
            "connected": sage_ok,
            "message": sage_msg,
            "type": config.sage.type,
            "version": config.sage.version,
            "database": config.sage.database
        },
        "backend": hb_status,
        "security": {
            "allowed_tables": config.security.allowed_tables,
            "max_rows": config.security.max_rows,
            "rate_limit": f"{config.security.rate_limit}/minute"
        }
    }


@router.get("/debug", response_class=HTMLResponse, include_in_schema=False)
async def debug_dashboard(
    request: Request,
    database = Depends(get_database),
    heartbeat = Depends(get_heartbeat),
    config = Depends(get_config)
):
    """
    Visual debug dashboard for the agent.
    """
    sage_status = database.get_status()
    hb_status = heartbeat.get_status()
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>InsightSage Agent - Debug</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
            body {{ font-family: 'Inter', sans-serif; background: #0f172a; color: #f8fafc; }}
            .glass {{
                background: rgba(30, 41, 59, 0.7);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 1rem;
            }}
            .status-ok {{ color: #4ade80; text-shadow: 0 0 10px rgba(74, 222, 128, 0.3); }}
            .status-error {{ color: #f87171; text-shadow: 0 0 10px rgba(248, 113, 113, 0.3); }}
            .pulse {{ animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }}
            @keyframes pulse {{ 0%, 100% {{ opacity: 1; }} 50% {{ opacity: .5; }} }}
        </style>
    </head>
    <body class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                <div>
                    <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                        InsightSage Agent
                    </h1>
                    <p class="text-slate-400 mt-1 uppercase tracking-widest text-xs font-semibold">Local Diagnostic Dashboard</p>
                </div>
                <div class="text-right">
                    <span class="px-3 py-1 glass text-xs font-mono text-slate-300">v1.0.0</span>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <!-- Sage Connection Card -->
                <div class="glass p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-slate-200">Sage SQL Server</h2>
                        <div class="flex items-center">
                            <div class="w-3 h-3 rounded-full mr-2 {'bg-green-400' if sage_status['connected'] else 'bg-red-400 pulse'}"></div>
                            <span class="text-xs font-bold uppercase tracking-tighter {'status-ok' if sage_status['connected'] else 'status-error'}">
                                {('Connected' if sage_status['connected'] else 'Disconnected')}
                            </span>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <div class="flex justify-between border-b border-slate-800/50 pb-2">
                            <span class="text-slate-400 text-sm">Instance</span>
                            <span class="text-slate-200 text-sm font-mono">{sage_status['config']['host']}:{sage_status['config']['port']}</span>
                        </div>
                        <div class="flex justify-between border-b border-slate-800/50 pb-2">
                            <span class="text-slate-400 text-sm">Database</span>
                            <span class="text-slate-200 text-sm font-mono">{sage_status['config']['database']}</span>
                        </div>
                        {f'''<div class="mt-4 p-3 bg-red-900/20 border border-red-500/20 rounded-md">
                            <p class="text-red-400 text-xs font-mono break-all">{sage_status['last_error']}</p>
                        </div>''' if sage_status['last_error'] else ''}
                    </div>
                </div>

                <!-- Backend Connection Card -->
                <div class="glass p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-slate-200">Backend SaaS</h2>
                        <div class="flex items-center">
                            <div class="w-3 h-3 rounded-full mr-2 {'bg-green-400' if hb_status['is_registered'] else 'bg-red-400 pulse'}"></div>
                            <span class="text-xs font-bold uppercase tracking-tighter {'status-ok' if hb_status['is_registered'] else 'status-error'}">
                                {('Registered' if hb_status['is_registered'] else 'Not Registered')}
                            </span>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <div class="flex justify-between border-b border-slate-800/50 pb-2">
                            <span class="text-slate-400 text-sm">Organization ID</span>
                            <span class="text-slate-200 text-sm font-mono truncate ml-4" title="{hb_status['organization_id']}">{hb_status['organization_id'] or '—'}</span>
                        </div>
                        <div class="flex justify-between border-b border-slate-800/50 pb-2">
                            <span class="text-slate-400 text-sm">Last Heartbeat</span>
                            <span class="text-slate-200 text-sm font-mono">{hb_status['last_status'] or 'Pending'}</span>
                        </div>
                        {f'''<div class="mt-4 p-3 bg-red-900/20 border border-red-500/20 rounded-md">
                            <p class="text-red-400 text-xs font-mono break-all">{hb_status['last_error']}</p>
                        </div>''' if hb_status['last_error'] else ''}
                    </div>
                </div>
            </div>

            <!-- Configuration & Whitelist -->
            <div class="glass p-6">
                <h2 class="text-lg font-semibold text-slate-200 mb-4">Security Whitelist</h2>
                <div class="flex flex-wrap gap-2">
                    {" ".join([f'<span class="px-2 py-1 bg-slate-800/50 border border-slate-700 rounded text-xs text-slate-300 font-mono">{table}</span>' for table in config.security.allowed_tables])}
                </div>
            </div>
            
            <div class="mt-8 text-center text-slate-500 text-xs">
                Uptime: 1.0.0 | Refresh manually to update status
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
