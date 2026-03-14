from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
from pathlib import Path
from pymongo import MongoClient
from datetime import datetime

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

# load model
BASE_DIR = Path(__file__).resolve().parent.parent
model_path = BASE_DIR / "ai_model" / "pregnancy_risk_model.pkl"

model = joblib.load(model_path)

features = ["Pregnancies","Glucose","BloodPressure","BMI","Age"]

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["MaaCare"]
collection = db["Readings"]


@app.get("/")
def home():
    return {"message": "MaaCare AI API running"}


@app.post("/predict")
def predict(vitals: VitalsInput):
    pregnancies = vitals.pregnancies
    glucose = vitals.glucose
    bp = vitals.bp
    bmi = vitals.bmi
    age = vitals.age
    symptoms = vitals.symptoms

    # ML prediction
    data = pd.DataFrame([[pregnancies,glucose,bp,bmi,age]], columns=features)

    prediction = model.predict(data)[0]
    probability = model.predict_proba(data)[0][1]

    if prediction == 1:
        risk = "High Risk"
    else:
        risk = "Low Risk"

    # Save reading
    reading = {
        "pregnancies": pregnancies,
        "glucose": glucose,
        "blood_pressure": bp,
        "bmi": bmi,
        "age": age,
        "symptoms": symptoms,
        "risk": risk,
        "risk_probability": float(probability),
        "timestamp": datetime.utcnow()
    }

    collection.insert_one(reading)

    # Get history
    history = list(collection.find({}, {"_id":0}).sort("timestamp",-1).limit(10))

    return {
        "risk": risk,
        "risk_probability": round(probability*100,2),
        "history": history
    }


@app.get("/readings")
def get_readings():

    history = list(collection.find({}, {"_id":0}).sort("timestamp",-1).limit(10))

    return history