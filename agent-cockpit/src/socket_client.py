"""InsightSage Agent - WebSocket Client for Real-Time Commands"""

import socketio
import asyncio
from loguru import logger
from typing import Dict, Any, Optional
from datetime import datetime

from .config import Config
from .security import SQLValidator
from .database import SageDatabase


class SocketClient:
    """Manages WebSocket communication with InsightSage Backend"""
    
    def __init__(self, config: Config, database: SageDatabase):
        self.config = config
        self.database = database
        self.sio = socketio.AsyncClient(
            reconnection=True,
            reconnection_attempts=0,
            reconnection_delay=1,
            reconnection_delay_max=5
        )
        self.is_connected = False
        self.org_id = None
        
        # Register events
        self.sio.on('connect', self.on_connect, namespace='/agents')
        self.sio.on('disconnect', self.on_disconnect, namespace='/agents')
        self.sio.on('authenticated', self.on_authenticated, namespace='/agents')
        self.sio.on('execute_sql', self.on_execute_sql, namespace='/agents')
        self.sio.on('connect_error', self.on_connect_error, namespace='/agents')

    async def connect(self):
        """Connect to the backend WebSocket"""
        backend_url = self.config.backend.url.rstrip('/')
        token = self.config.backend.agent_token
        
        logger.info(f"Connecting to WebSocket: {backend_url}/agents")
        
        try:
            await self.sio.connect(
                f"{backend_url}",
                namespaces=['/agents'],
                auth={'token': token},
                transports=['websocket'] # Force WebSocket for efficiency
            )
        except Exception as e:
            logger.error(f"WebSocket connection failed: {e}")

    async def on_connect(self):
        logger.info("✅ Connected to InsightSage WebSocket")
        self.is_connected = True

    async def on_disconnect(self):
        logger.warning("❌ Disconnected from InsightSage WebSocket")
        self.is_connected = False
        self.org_id = None
        await self.log_to_backend("warning", "Agent disconnected from WebSocket")

    async def log_to_backend(self, level: str, message: str):
        """Send a log message to the backend for centralization"""
        if self.is_connected:
            try:
                await self.sio.emit('agent_log', {
                    'level': level,
                    'message': message,
                    'timestamp': datetime.utcnow().isoformat()
                }, namespace='/agents')
            except Exception:
                pass # Avoid infinite loops or crashing on log failure

    async def on_connect_error(self, data):
        logger.error(f"WebSocket connection error: {data}")

    async def on_authenticated(self, data):
        self.org_id = data.get('organizationId')
        logger.info(f"🔐 Authenticated via WebSocket for Org: {self.org_id}")
        await self.log_to_backend("info", f"Agent authenticated and ready for organization {self.org_id}")

    async def on_execute_sql(self, data):
        """Handle SQL execution request from backend"""
        job_id = data.get('jobId')
        sql = data.get('sql')
        
        logger.info(f"📥 Received SQL job: {job_id}")
        logger.debug(f"SQL: {sql}")
        
        try:
            # Execute query through database service (which includes its own validation)
            result = self.database.execute_query(sql)
            
            # Send result back
            await self.sio.emit('sql_result', {
                'jobId': job_id,
                'result': result
            }, namespace='/agents')
            
            logger.info(f"📤 Sent result for job: {job_id}")
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"❌ Error executing job {job_id}: {error_msg}")
            
            await self.log_to_backend("error", f"SQL execution failed for job {job_id}: {error_msg}")
            
            await self.sio.emit('sql_result', {
                'jobId': job_id,
                'error': error_msg
            }, namespace='/agents')

    async def disconnect(self):
        """Disconnect helper"""
        if self.is_connected:
            await self.sio.disconnect()
            logger.info("WebSocket client disconnected")
