from fastapi import FastAPI, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import os
import jwt
import uuid
from passlib.context import CryptContext
import json
from dotenv import load_dotenv

load_dotenv()

# Database setup
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')
cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')

client = MongoClient(mongo_url)
db = client[db_name]

app = FastAPI(title="Sistema de Reporte CJP VIGIA API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 720

# Collections
users_collection = db.users
reports_collection = db.reports
notifications_collection = db.notifications
announcements_collection = db.announcements

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# Pydantic models
class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "alguacil"  # "admin" or "alguacil"
    full_name: str

class UserLogin(BaseModel):
    username: str
    password: str

class ReportCreate(BaseModel):
    expediente: str
    tribunal: str
    decision: str
    observacion: str
    nombre_acusado: str
    fecha: str
    hora: str

class ReportUpdate(BaseModel):
    expediente: Optional[str] = None
    tribunal: Optional[str] = None
    decision: Optional[str] = None
    observacion: Optional[str] = None
    nombre_acusado: Optional[str] = None
    fecha: Optional[str] = None
    hora: Optional[str] = None

class AnnouncementCreate(BaseModel):
    title: str
    message: str

class PasswordUpdate(BaseModel):
    user_id: str
    new_password: str

# Auth functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = users_collection.find_one({"username": username})
    if user is None:
        raise credentials_exception
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

# Initialize with default admin user
@app.on_event("startup")
async def startup_event():
    admin_exists = users_collection.find_one({"role": "admin"})
    if not admin_exists:
        admin_user = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password": get_password_hash("admin123"),
            "role": "admin",
            "full_name": "Administrador Principal",
            "created_at": datetime.utcnow().isoformat()
        }
        users_collection.insert_one(admin_user)
        print("Default admin user created: admin/admin123")

# WebSocket endpoint for real-time notifications
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_personal_message(f"Message received: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Routes
@app.post("/api/login")
async def login(user_data: UserLogin):
    user = users_collection.find_one({"username": user_data.username})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user["username"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "full_name": user["full_name"]
        }
    }

@app.get("/api/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "role": current_user["role"],
        "full_name": current_user["full_name"]
    }

@app.post("/api/reports")
async def create_report(report: ReportCreate, current_user: dict = Depends(get_current_user)):
    report_data = {
        "id": str(uuid.uuid4()),
        "expediente": report.expediente,
        "tribunal": report.tribunal,
        "decision": report.decision,
        "observacion": report.observacion,
        "nombre_acusado": report.nombre_acusado,
        "fecha": report.fecha,
        "hora": report.hora,
        "nombre_alguacil": current_user["full_name"],
        "created_by": current_user["id"],
        "created_at": datetime.utcnow().isoformat()
    }
    
    result = reports_collection.insert_one(report_data)
    
    # Create notification for admins
    notification = {
        "id": str(uuid.uuid4()),
        "type": "new_report",
        "title": "Nuevo Reporte Creado",
        "message": f"El alguacil {current_user['full_name']} ha creado un nuevo reporte para el expediente {report.expediente}",
        "created_at": datetime.utcnow().isoformat(),
        "read": False,
        "report_id": report_data["id"]
    }
    notifications_collection.insert_one(notification)
    
    # Send real-time notification
    await manager.broadcast(json.dumps({
        "type": "notification",
        "data": notification
    }))
    
    return {"message": "Reporte creado exitosamente", "report_id": report_data["id"]}

@app.get("/api/reports")
async def get_reports(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        reports = list(reports_collection.find({}, {"_id": 0}).sort("created_at", -1))
    else:
        reports = list(reports_collection.find({"created_by": current_user["id"]}, {"_id": 0}).sort("created_at", -1))
    
    return reports

@app.put("/api/reports/{report_id}")
async def update_report(report_id: str, report_update: ReportUpdate, current_user: dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in report_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = reports_collection.update_one(
        {"id": report_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {"message": "Reporte actualizado exitosamente"}

@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: str, current_user: dict = Depends(get_admin_user)):
    result = reports_collection.delete_one({"id": report_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {"message": "Reporte eliminado exitosamente"}

@app.post("/api/users")
async def create_user(user: UserCreate, current_user: dict = Depends(get_admin_user)):
    # Check if username already exists
    existing_user = users_collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    user_data = {
        "id": str(uuid.uuid4()),
        "username": user.username,
        "password": get_password_hash(user.password),
        "role": user.role,
        "full_name": user.full_name,
        "created_at": datetime.utcnow().isoformat()
    }
    
    users_collection.insert_one(user_data)
    return {"message": "Usuario creado exitosamente", "user_id": user_data["id"]}

@app.get("/api/users")
async def get_users(current_user: dict = Depends(get_admin_user)):
    users = list(users_collection.find({}, {"_id": 0, "password": 0}))
    return users

@app.get("/api/users/{user_id}/password")
async def get_user_password(user_id: str, current_user: dict = Depends(get_admin_user)):
    user = users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Note: In production, you should never expose passwords like this
    # This is only for admin functionality as requested
    return {"username": user["username"], "password": "Contraseña cifrada - contacte IT para resetear"}

@app.put("/api/users/{user_id}/password")
async def update_user_password(user_id: str, password_update: PasswordUpdate, current_user: dict = Depends(get_admin_user)):
    hashed_password = get_password_hash(password_update.new_password)
    
    result = users_collection.update_one(
        {"id": user_id},
        {"$set": {"password": hashed_password, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Contraseña actualizada exitosamente"}

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_admin_user)):
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = users_collection.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Usuario eliminado exitosamente"}

@app.get("/api/notifications")
async def get_notifications(current_user: dict = Depends(get_admin_user)):
    notifications = list(notifications_collection.find({}, {"_id": 0}).sort("created_at", -1))
    return notifications

@app.put("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_admin_user)):
    result = notifications_collection.update_one(
        {"id": notification_id},
        {"$set": {"read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notificación marcada como leída"}

@app.post("/api/announcements")
async def create_announcement(announcement: AnnouncementCreate, current_user: dict = Depends(get_admin_user)):
    announcement_data = {
        "id": str(uuid.uuid4()),
        "title": announcement.title,
        "message": announcement.message,
        "created_by": current_user["full_name"],
        "created_at": datetime.utcnow().isoformat()
    }
    
    announcements_collection.insert_one(announcement_data)
    
    # Send real-time announcement to all connected clients
    await manager.broadcast(json.dumps({
        "type": "announcement",
        "data": announcement_data
    }))
    
    return {"message": "Anuncio enviado exitosamente"}

@app.get("/api/announcements")
async def get_announcements(current_user: dict = Depends(get_current_user)):
    announcements = list(announcements_collection.find({}, {"_id": 0}).sort("created_at", -1).limit(10))
    return announcements

@app.get("/api/stats")
async def get_stats(current_user: dict = Depends(get_admin_user)):
    total_reports = reports_collection.count_documents({})
    total_users = users_collection.count_documents({"role": "alguacil"})
    total_admins = users_collection.count_documents({"role": "admin"})
    unread_notifications = notifications_collection.count_documents({"read": False})
    
    return {
        "total_reports": total_reports,
        "total_alguaciles": total_users,
        "total_admins": total_admins,
        "unread_notifications": unread_notifications
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)