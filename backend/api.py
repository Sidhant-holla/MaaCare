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

SECRET_KEY = "maacare-secret-2026"
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
    pregnancies: int
    glucose: float
    bp: float
    bmi: float
    age: int
    symptoms: list[str] = []

class UserAuth(BaseModel):
    username: str
    password: str

# load model
BASE_DIR = Path(__file__).resolve().parent.parent
model_path = BASE_DIR / "ai_model" / "pregnancy_risk_model.pkl"
model = joblib.load(model_path)
features = ["Pregnancies", "Glucose", "BloodPressure", "BMI", "Age"]

# MongoDB
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


@app.post("/predict")
def predict(vitals: VitalsInput, username: str = Depends(get_current_user)):
    pregnancies = vitals.pregnancies
    glucose = vitals.glucose
    bp = vitals.bp
    bmi = vitals.bmi
    age = vitals.age
    symptoms = vitals.symptoms

    data = pd.DataFrame([[pregnancies, glucose, bp, bmi, age]], columns=features)
    prediction = model.predict(data)[0]
    probability = model.predict_proba(data)[0][1]
    risk = "High Risk" if prediction == 1 else "Low Risk"

    reading = {
        "username": username,
        "pregnancies": pregnancies,
        "glucose": glucose,
        "blood_pressure": bp,
        "bmi": round(bmi, 2),
        "age": age,
        "symptoms": symptoms,
        "risk": risk,
        "risk_probability": float(probability),
        "timestamp": datetime.now(timezone.utc)
    }
    collection.insert_one(reading)

    history = list(collection.find({"username": username}, {"_id": 0}).sort("timestamp", -1).limit(10))
    return {
        "risk": risk,
        "risk_probability": round(probability * 100, 2),
        "history": history
    }


@app.get("/readings")
def get_readings(username: str = Depends(get_current_user)):
    return list(collection.find({"username": username}, {"_id": 0}).sort("timestamp", -1).limit(10))
