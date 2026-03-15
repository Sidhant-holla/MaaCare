# MaaCare

Maternal health monitoring platform that uses machine learning to assess pregnancy risk based on vitals, symptoms, and medical history.

## Features

- **Risk Prediction** — RandomForest classifier trained on maternal health data, outputs low / medium / high risk with confidence scores
- **Clinical Thresholds** — hardcoded safety overrides for vitals outside the model's reliable range (BP, glucose, temperature)
- **Diagnostics Panel** — explains why a given risk level was assigned, flags concerning symptoms separately
- **Per-user Profiles** — JWT auth with MongoDB, age and pregnancy count stored once per account
- **Vitals History** — tracks last 10 readings with timestamped BP & glucose chart
- **Symptom Tracking** — 9 symptom checkboxes with severity-aware messaging (serious vs mild)

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | HTML, CSS, vanilla JS, Chart.js |
| Backend | FastAPI, PyJWT, bcrypt |
| Database | MongoDB (Users + Readings collections) |
| ML | scikit-learn RandomForestClassifier, joblib |
| Data | Maternal Mortality Risk dataset + Pima Indians Diabetes dataset |

## Project Structure

```
MaaCare/
├── ai_model/
│   ├── train_model.py        # data cleaning, training, evaluation
│   ├── predict.py             # standalone prediction test
│   └── maternal_risk_model.pkl
├── backend/
│   └── api.py                 # FastAPI endpoints, JWT auth, prediction logic
├── mobile_app/
│   ├── index.html             # main dashboard
│   ├── login.html             # auth page with splash animation
│   ├── script.js              # dashboard logic, chart, diagnostics
│   ├── auth.js                # login/signup handlers
│   └── style.css
├── data/
│   ├── mortality.csv          # maternal health dataset (1014 rows)
│   └── main.csv               # Pima diabetes dataset (768 rows)
└── assets/
    └── MaaCare logo.jpeg
```

## Setup

**Requirements:** Python 3.10+, MongoDB running on localhost:27017

```bash
# install dependencies
pip install -r backend/requirements.txt

# train the model (run from project root)
python ai_model/train_model.py

# set secret key (or it uses a dev fallback)
export MAACARE_SECRET=your-secret-here

# start the backend
cd backend
uvicorn api:app --reload

# open the frontend
# open mobile_app/login.html in browser
```

## Model Details

- **Algorithm:** RandomForest (300 trees, max depth 10)
- **Training data:** Combined Pima diabetes + maternal mortality datasets, cleaned and aligned to 8 shared features
- **Features:** Age, Pregnancies, Glucose, SystolicBP, DiastolicBP, BMI, HeartRate, BodyTemp
- **Output:** 3-class classification — low risk, medium risk, high risk
- **Accuracy:** ~81% on held-out test set
- **Safety layer:** Clinical threshold overrides for extreme vitals that fall outside the model's training distribution
