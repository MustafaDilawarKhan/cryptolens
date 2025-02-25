import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Set

import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

# Create router
router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.ws_client: Optional[websockets.WebSocketClientProtocol] = None
        self.subscribed_tokens: Set[str] = set()
        self.running = False
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting message: {str(e)}")
                await self.disconnect(connection)
    
    async def connect_to_pump_portal(self):
        if self.ws_client:
            return
        
        try:
            self.ws_client = await websockets.connect("wss://pumpportal.fun/api/data")
            logger.info("Connected to PumpPortal WebSocket")
            
            # Subscribe to new token events
            await self.ws_client.send(json.dumps({"method": "subscribeNewToken"}))
            logger.info("Subscribed to new token events")
            
            # Start listening for messages
            self.running = True
            asyncio.create_task(self.listen_to_messages())
        except Exception as e:
            logger.error(f"Error connecting to PumpPortal: {str(e)}")
            self.ws_client = None
    
    async def subscribe_to_token(self, token_address: str):
        if not self.ws_client:
            await self.connect_to_pump_portal()
        
        if token_address not in self.subscribed_tokens:
            try:
                await self.ws_client.send(json.dumps({
                    "method": "subscribeTokenTrade",
                    "keys": [token_address]
                }))
                self.subscribed_tokens.add(token_address)
                logger.info(f"Subscribed to token trades: {token_address}")
            except Exception as e:
                logger.error(f"Error subscribing to token: {str(e)}")
    
    async def unsubscribe_from_token(self, token_address: str):
        if not self.ws_client or token_address not in self.subscribed_tokens:
            return
        
        try:
            await self.ws_client.send(json.dumps({
                "method": "unsubscribeTokenTrade",
                "keys": [token_address]
            }))
            self.subscribed_tokens.remove(token_address)
            logger.info(f"Unsubscribed from token trades: {token_address}")
        except Exception as e:
            logger.error(f"Error unsubscribing from token: {str(e)}")
    
    async def listen_to_messages(self):
        if not self.ws_client:
            return
        
        while self.running:
            try:
                message = await self.ws_client.recv()
                data = json.loads(message)
                await self.broadcast(data)
            except Exception as e:
                logger.error(f"Error in message listener: {str(e)}")
                # Try to reconnect
                self.ws_client = None
                await self.connect_to_pump_portal()
    
    async def cleanup(self):
        self.running = False
        if self.ws_client:
            await self.ws_client.close()
            self.ws_client = None
        logger.info("WebSocket manager cleaned up")

# Create WebSocket manager instance
manager = WebSocketManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            try:
                # Keep connection alive and handle client messages
                data = await websocket.receive_json()
                
                # Handle subscribe/unsubscribe requests
                if data.get("type") == "subscribe" and data.get("token"):
                    await manager.subscribe_to_token(data["token"])
                elif data.get("type") == "unsubscribe" and data.get("token"):
                    await manager.unsubscribe_from_token(data["token"])
            except WebSocketDisconnect:
                manager.disconnect(websocket)
                break
            except Exception as e:
                logger.error(f"Error handling websocket message: {str(e)}")
    finally:
        manager.disconnect(websocket)

# Connect to PumpPortal when the API starts
@router.on_event("startup")
async def startup_event():
    await manager.connect_to_pump_portal()

# Cleanup when the API shuts down
@router.on_event("shutdown")
async def shutdown_event():
    await manager.cleanup()
