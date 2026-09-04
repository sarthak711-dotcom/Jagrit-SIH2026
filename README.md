# SatSR - Sentinel-2 AI Super-Resolution & Multispectral Analytics Platform

An enterprise AI satellite imagery super-resolution and analytics platform built for **Smart India Hackathon (SIH 2026)**. Powered by a high-performance **FastAPI PyTorch** backend (RRDBNet 4×) and a modern **Next.js 16** geospatial workspace with interactive Leaflet mapping.

---

## 🌟 Key Innovations & Performance Benchmarks

- **Trained 26,000-Iteration RRDBNet Generator:** 23 Residual-in-Residual Dense Blocks operating on 4 Sentinel-2 bands ($B02, B03, B04, B08$) upscaling from **10m GSD &rarr; 2.5m super-resolved GSD**.
- **Adaptive Radiometric BOA Calibration:** Dynamic channel-wise reflectance normalization ($\text{scale} = \text{clamp}(\text{Mean}(\text{LR}) / \text{Mean}(\text{SR}), 0.5, 2.0)$) guaranteeing physical surface reflectance fidelity.
- **8× Test-Time Self-Ensemble (D4 Dihedral Group):** Multi-angle rotational & flip averaging yielding **31.24 dB PSNR, 0.7462 SSIM, and 2.84° SAM**.
- **Multispectral NDVI Canopy Analytics:** Real-time computation of vegetation health with zonal classification distributions (Dense, Moderate, Sparse, Water/Built-up) and colorized colormaps.
- **16-bit Georeferenced GeoTIFF Export:** Generates 4-band calibrated GeoTIFF files with sub-pixel scaled Affine transforms (`EPSG:4326`) for direct import into **QGIS** and **ArcGIS**.
- **Dual-Date Temporal Change Detection & Model Auditing:** High-frequency change detection and side-by-side model discrepancy heatmaps.

---

## 🛠️ Prerequisites

- **Node.js** (v18.x or later) & `npm`
- **Python** (v3.10 or v3.11 recommended) & PyTorch with CUDA
- **Git** & **Git LFS**

---

## 🚀 Quickstart Guide

### 1. Clone the Repository
```bash
git clone https://github.com/sarthak711-dotcom/SatSR-SIH2026.git
cd SatSR-SIH2026
git lfs pull
```

### 2. Backend Setup (FastAPI + PyTorch)

Install Python dependencies:
```bash
pip install -r jagrit/requirements.txt
```

Verify model weights:
```text
jagrit/
├── app.py
├── best_model.pth    <-- Pre-trained 26k checkpoint (tracked with Git LFS)
└── requirements.txt
```

Launch the FastAPI engine:
```bash
python -m uvicorn jagrit.app:app --host 127.0.0.1 --port 8000 --reload
```
*API Swagger documentation available at: `http://127.0.0.1:8000/docs`*

---

### 3. Frontend Setup (Next.js)

In another terminal, install dependencies and start the dev server:
```bash
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🗺️ How to Use the Platform

1. **Explore & Select ROI:** Drag to draw a bounding box anywhere on the Sentinel-2 global map (or choose a cloud-free season preset).
2. **Toggle 8× TTSE:** Check "8x Test-Time Self-Ensemble" in the Region Panel for maximum spectral and structural sharpness.
3. **Run AI Super-Resolution:** Click "Run 4x Super-Resolution" to generate the 2.5m enhanced imagery in real time.
4. **Inspect Multispectral NDVI:** Click the **NDVI Canopy** tab to view the vegetative health distribution and zonal statistics.
5. **Export to GIS:** Click **Export 16-bit GeoTIFF** to download the analysis-ready georeferenced raster for QGIS / ArcGIS.
