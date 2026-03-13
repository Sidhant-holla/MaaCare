import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline


# 1. LOAD DATASET

data = pd.read_csv("data/main.csv")

print("Dataset loaded")
print("Dataset shape:", data.shape)


# 2. SELECT FEATURES

features = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "BMI",
    "Age"
]

X = data[features]
y = data["Outcome"]


# 3. HANDLE MISSING DATA

# Some medical datasets contain 0 values which are invalid
X = X.replace(0, np.nan)


# 4. TRAIN TEST SPLIT

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# 5. BUILD ML PIPELINE
pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("model", RandomForestClassifier(
        n_estimators=200,
        random_state=42
    ))
])

# 6. TRAIN MODEL
pipeline.fit(X_train, y_train)

print("\nModel training complete")

# 7. PREDICT
pred = pipeline.predict(X_test)

accuracy = accuracy_score(y_test, pred)

print("\nAccuracy:", accuracy)

# 8. MODEL EVALUATION
print("\nClassification Report:")
print(classification_report(y_test, pred))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, pred))

# 9. FEATURE IMPORTANCE
model = pipeline.named_steps["model"]

feature_importance = pd.Series(
    model.feature_importances_,
    index=features
)

print("\nFeature Importance:")
print(feature_importance.sort_values(ascending=False))

# 10. SAVE MODEL
joblib.dump(pipeline, "ai_model/pregnancy_risk_model.pkl")

print("\nModel saved successfully")

# 11. TEST PREDICTIONS
print("\nTesting predictions")

test_low = pd.DataFrame([[1,120,80,25,22]], columns=features)
test_high = pd.DataFrame([[4,180,100,35,38]], columns=features)

print("Low risk example:", pipeline.predict(test_low))
print("High risk example:", pipeline.predict(test_high))