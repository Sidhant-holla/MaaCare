import joblib
import pandas as pd

model = joblib.load("ai_model/maternal_risk_model.pkl")

features = ["Age", "Pregnancies", "Glucose", "SystolicBP", "DiastolicBP", "BMI", "HeartRate", "BodyTemp"]

risk_labels = {0: "Low Risk", 1: "Medium Risk", 2: "High Risk"}

# test: healthy 25yo
low = pd.DataFrame([[25, 1, 95, 110, 70, 24, 75, 98.4]], columns=features)
print("Healthy patient:", risk_labels[model.predict(low)[0]])

# test: high risk 40yo
high = pd.DataFrame([[40, 3, 200, 155, 100, 38, 88, 100]], columns=features)
print("High risk patient:", risk_labels[model.predict(high)[0]])
