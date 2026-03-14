import joblib
import pandas as pd

# load model
model = joblib.load("ai_model/pregnancy_risk_model.pkl")

features = ["Pregnancies","Glucose","BloodPressure","BMI","Age"]

# sample patient
patient = pd.DataFrame([[2,140,90,30,32]], columns=features)

prediction = model.predict(patient)

if prediction[0] == 1:
    print("High Risk Pregnancy")
else:
    print("Low Risk Pregnancy")