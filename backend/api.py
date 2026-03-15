from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import joblib
import pandas as pd
from pathlib import Path
from pymongo import MongoClient
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt
import os

SECRET_KEY = os.environ.get("MAACARE_SECRET", "dev-only-fallback")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

bearer = HTTPBearer()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class VitalsInput(BaseModel):
    glucose: float
    systolic_bp: float
    diastolic_bp: float
    bmi: float
    heart_rate: float
    body_temp: float
    symptoms: list[str] = []

class UserAuth(BaseModel):
    username: str
    password: str

class UserProfile(BaseModel):
    age: int
    pregnancies: int

BASE_DIR = Path(__file__).resolve().parent.parent
model_path = BASE_DIR / "ai_model" / "maternal_risk_model.pkl"
model = joblib.load(model_path)
features = [
    "Age",
    "Pregnancies",
    "Glucose",
    "SystolicBP",
    "DiastolicBP",
    "BMI",
    "HeartRate",
    "BodyTemp"
]

client = MongoClient("mongodb://localhost:27017/")
db = client["MaaCare"]
collection = db["Readings"]
users_col = db["Users"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def create_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": username, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> str:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@app.get("/")
def home():
    return {"message": "MaaCare API running"}


@app.post("/register")
def register(user: UserAuth):
    if users_col.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already taken")
    users_col.insert_one({
        "username": user.username,
        "password": hash_password(user.password),
        "created_at": datetime.now(timezone.utc)
    })
    return {"token": create_token(user.username), "username": user.username}


@app.post("/login")
def login(user: UserAuth):
    db_user = users_col.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"token": create_token(user.username), "username": user.username}


@app.get("/profile")
def get_profile(username: str = Depends(get_current_user)):
    user = users_col.find_one({"username": username}, {"_id": 0, "age": 1, "pregnancies": 1})
    return {"age": user.get("age"), "pregnancies": user.get("pregnancies")}


@app.post("/profile")
def save_profile(profile: UserProfile, username: str = Depends(get_current_user)):
    users_col.update_one({"username": username}, {"$set": {"age": profile.age, "pregnancies": profile.pregnancies}})
    return {"ok": True}


@app.post("/predict")
def predict(vitals: VitalsInput, username: str = Depends(get_current_user)):

    user_doc = users_col.find_one({"username": username})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")

    age = user_doc.get("age")
    pregnancies = user_doc.get("pregnancies")

    if age is None or pregnancies is None:
        raise HTTPException(status_code=400, detail="Profile incomplete")

    sbp  = vitals.systolic_bp
    dbp  = vitals.diastolic_bp
    gluc = vitals.glucose
    temp = vitals.body_temp
    hr   = vitals.heart_rate

    if sbp >= 160 or sbp < 90 or dbp >= 110 or gluc >= 180 or temp >= 100.4:
        risk = "High Risk"
        probability = 0.92
    elif sbp >= 140 or dbp >= 90 or gluc >= 140 or temp >= 99.5 or hr >= 100:
        risk = "Medium Risk"
        probability = 0.65
    else:
        data = pd.DataFrame([[
            age, pregnancies, gluc, sbp, dbp, vitals.bmi, hr, temp
        ]], columns=features)
        prediction = model.predict(data)[0]
        probabilities = model.predict_proba(data)[0]
        risk_map = {0: "Low Risk", 1: "Medium Risk", 2: "High Risk"}
        risk = risk_map[prediction]
        probability = float(max(probabilities))

    reading = {
        "username": username,
        "pregnancies": pregnancies,
        "age": age,
        "glucose": vitals.glucose,
        "systolic_bp": vitals.systolic_bp,
        "diastolic_bp": vitals.diastolic_bp,
        "bmi": round(vitals.bmi, 2),
        "heart_rate": vitals.heart_rate,
        "body_temp": vitals.body_temp,
        "symptoms": vitals.symptoms,
        "risk": risk,
        "risk_probability": probability,
        "timestamp": datetime.now(timezone.utc)
    }

    collection.insert_one(reading)

    history = list(collection.find(
        {"username": username},
        {"_id": 0}
    ).sort("timestamp", -1).limit(10))

    return {
        "risk": risk,
        "risk_probability": round(probability * 100, 2),
        "history": history
    }


@app.get("/readings")
def get_readings(username: str = Depends(get_current_user)):
    return list(collection.find({"username": username}, {"_id": 0}).sort("timestamp", -1).limit(10))
