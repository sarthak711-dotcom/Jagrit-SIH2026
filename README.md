# Jagrit - Sentinel-2 AI Super-Resolution & Analytics Platform

An AI-powered satellite imagery analytics platform built with **Next.js 16**, **Tailwind CSS**, and a **FastAPI PyTorch** backend. Features 4x ESRGAN/RRDBNet super-resolution, halo-free Unsharp Mask sharpening, dual-date temporal change detection, and model comparison tool.

---

## 🛠️ Prerequisites

Make sure you have the following installed on your machine:
- **Node.js** (v18.x or later) & `npm`
- **Python** (v3.10 or v3.11 recommended) & `pip`
- **Git**

---

## 🚀 Quickstart Guide

### 1. Clone the Repository
```bash
git clone https://github.com/AtifPerwaiz/jagrit.git
cd jagrit
```

### 2. Frontend Setup (Next.js)
Install Node dependencies and start the web development server:
```bash
npm install
npm run dev
```
The frontend will be running at: **`http://localhost:3000`**

---

### 3. Backend Setup (FastAPI + PyTorch)

Open a new terminal window in the project folder:

#### Install Python dependencies:
```bash
pip install -r jagrit/requirements.txt
```

#### Place AI Model Weights:
Copy your trained PyTorch model file (`data.pth`) into the `jagrit/` folder:
```text
jagrit/
├── app.py
├── data.pth        <-- Place your model weights here!
└── requirements.txt
```
*(Note: If `data.pth` is missing, the backend will automatically use visual patch simulation for demonstration).*

#### Start the FastAPI Server:
```bash
python -m uvicorn jagrit.app:app --host 127.0.0.1 --port 8000 --reload
```
The backend API will be running at: **`http://127.0.0.1:8000`** (Swagger docs available at `http://127.0.0.1:8000/docs`).

---

## 🌟 Key Features

- **4x AI Super-Resolution:** Upscales 10m Sentinel-2 GSD imagery to 2.5m resolution.
- **Unsharp Mask Post-Processing Sharpening:** Interactive strength slider ($0.0 - 3.0\times$) with thresholding and soft clipping to eliminate halo artifacts.
- **Resolution Preview Indicator:** Displays input ($128\times128\text{ px}$) and output ($512\times512\text{ px}$) pixel dimensions prior to inference.
- **Cloud-Free Year & Season Presets:** Pre-validated Copernicus acquisition dates across 2024, 2023, 2022, and 2021.
- **Temporal Change Detection & Model Comparison:** Side-by-side discrepancy heatmaps and dual-date analysis.
