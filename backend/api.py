from fastapi import FastAPI
import joblib
import pandas as pd
from pathlib import Path

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent.parent
model_path = BASE_DIR / "ai_model" / "pregnancy_risk_model.pkl"

model = joblib.load(model_path)

features = ["Pregnancies","Glucose","BloodPressure","BMI","Age"]

@app.get("/")
def home():
    return {"message": "MaaCare AI API running"}

@app.post("/predict")
def predict(pregnancies:int, glucose:int, bp:int, bmi:float, age:int):

    data = pd.DataFrame([[pregnancies,glucose,bp,bmi,age]], columns=features)

    prediction = model.predict(data)

    if prediction[0] == 1:
        risk = "High Risk"
    else:
        risk = "Low Risk"

    return {"pregnancy_risk": risk}