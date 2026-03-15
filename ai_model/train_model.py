import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

pima = pd.read_csv("data/main.csv")
maternal = pd.read_csv("data/mortality.csv")

pima[['Glucose','BloodPressure','BMI']] = pima[['Glucose','BloodPressure','BMI']].replace(0, np.nan)
pima = pima.dropna()

pima = pima.rename(columns={
    "BloodPressure": "DiastolicBP"
})

pima["SystolicBP"] = pima["DiastolicBP"] + 40
pima["HeartRate"] = 75
pima["BodyTemp"] = 98.4

pima["RiskLevel"] = pima["Outcome"].map({
    0:0,
    1:2
})

maternal["Glucose"] = maternal["BS"] * 18  # mmol/L to mg/dL
maternal = maternal.drop(columns=["BS"])

maternal["Pregnancies"] = 2
maternal["BMI"] = 28

maternal["RiskLevel"] = maternal["RiskLevel"].map({
    "low risk":0,
    "mid risk":1,
    "high risk":2
})

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

pima_y = pima["RiskLevel"]
maternal_y = maternal["RiskLevel"]

pima = pima[features]
maternal = maternal[features]

dataset = pd.concat([pima, maternal], ignore_index=True)
labels = pd.concat([pima_y, maternal_y], ignore_index=True)

dataset = dataset.dropna()
labels = labels[dataset.index]

X_train, X_test, y_train, y_test = train_test_split(
    dataset, labels,
    test_size=0.2,
    random_state=42
)

model = RandomForestClassifier(
    n_estimators=300,
    max_depth=10,
    random_state=42
)

model.fit(X_train, y_train)

y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print("\nModel Accuracy:", accuracy)
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))

joblib.dump(model, "ai_model/maternal_risk_model.pkl")
print("\nModel saved as maternal_risk_model.pkl")
