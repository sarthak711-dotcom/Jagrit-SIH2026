"""
spectral_indices.py

Derived-index overlays for SatSR, built on the calibrated 4-band
(B2 Blue, B3 Green, B4 Red, B8 NIR) SR output.

Covers two of the three named use cases in PS 26142:
  - Crop monitoring  -> NDVI + health classification
  - Disaster assessment -> NDWI (water/flood extent)

Design constraints (matches the rest of the pipeline):
  - Pure numpy, no model calls, no state mutation of the SR tensor.
  - Operates on the CALIBRATED output only (post radiometric calibration,
    post NIR-bug fix). Do not feed raw/uncalibrated bands into these
    functions — index values are only physically meaningful post-fix.
  - Display-only: these produce RGB overlay arrays for the viewport.
    They must never be written back into the .npy export or the
    GeoTIFF export. See `verify_export_isolation()` at the bottom for
    the same bit-exact-hash pattern used for the unsharp-mask toggle.
"""

import numpy as np


# ---------------------------------------------------------------------------
# NDVI — crop monitoring
# ---------------------------------------------------------------------------

def ndvi(nir_band: np.ndarray, red_band: np.ndarray, eps: float = 1e-6) -> np.ndarray:
    """
    Normalized Difference Vegetation Index.

    nir_band, red_band: 2D float arrays, calibrated BOA reflectance in [0, 1]
                         (NIR = B8, Red = B4)
    Returns: 2D float array in [-1, 1]
    """
    nir = nir_band.astype(np.float32)
    red = red_band.astype(np.float32)
    return (nir - red) / (nir + red + eps)


_NDVI_PALETTE = np.array(
    [
        [140, 100, 60],   # 0: bare soil / built-up / water  (NDVI < 0.1)
        [220, 200, 80],   # 1: stressed / sparse vegetation  (0.1 <= NDVI < 0.3)
        [130, 200, 90],   # 2: moderate / healthy vegetation (0.3 <= NDVI < 0.6)
        [30, 120, 40],    # 3: dense / vigorous vegetation   (NDVI >= 0.6)
    ],
    dtype=np.uint8,
)


def crop_health_map(ndvi_arr: np.ndarray) -> np.ndarray:
    """
    Classify an NDVI array into 4 human-readable health bands and
    return an RGB overlay (H, W, 3) uint8 for display.
    """
    classes = np.zeros(ndvi_arr.shape, dtype=np.uint8)
    classes[(ndvi_arr >= 0.1) & (ndvi_arr < 0.3)] = 1
    classes[(ndvi_arr >= 0.3) & (ndvi_arr < 0.6)] = 2
    classes[(ndvi_arr >= 0.6)] = 3
    return _NDVI_PALETTE[classes]


def crop_health_overlay(nir_band: np.ndarray, red_band: np.ndarray) -> dict:
    """
    Convenience wrapper: calibrated NIR/Red bands -> both the raw NDVI
    array (for scientific display / stats) and the classified RGB overlay
    (for the demo viewport).
    """
    ndvi_arr = ndvi(nir_band, red_band)
    return {
        "ndvi": ndvi_arr,
        "overlay_rgb": crop_health_map(ndvi_arr),
        "mean_ndvi": float(np.nanmean(ndvi_arr)),
    }


# ---------------------------------------------------------------------------
# NDWI — disaster / flood assessment
# ---------------------------------------------------------------------------

def ndwi(green_band: np.ndarray, nir_band: np.ndarray, eps: float = 1e-6) -> np.ndarray:
    """
    Normalized Difference Water Index (McFeeters formulation).

    green_band, nir_band: 2D float arrays, calibrated BOA reflectance in [0, 1]
                           (Green = B3, NIR = B8)
    Returns: 2D float array in [-1, 1]. Positive values -> open water.
    """
    green = green_band.astype(np.float32)
    nir = nir_band.astype(np.float32)
    return (green - nir) / (green + nir + eps)


def water_extent_map(ndwi_arr: np.ndarray, threshold: float = 0.0) -> np.ndarray:
    """
    Binary water mask overlay from NDWI, rendered as a semi-transparent
    blue RGB overlay (H, W, 3) uint8. Standard threshold is NDWI > 0.
    """
    water_mask = ndwi_arr > threshold
    overlay = np.zeros((*ndwi_arr.shape, 3), dtype=np.uint8)
    overlay[water_mask] = np.array([30, 90, 220], dtype=np.uint8)   # water = blue
    overlay[~water_mask] = np.array([90, 80, 70], dtype=np.uint8)   # land = neutral
    return overlay


def flood_extent_overlay(green_band: np.ndarray, nir_band: np.ndarray) -> dict:
    """
    Convenience wrapper: calibrated Green/NIR bands -> NDWI array +
    classified water/land RGB overlay + percent-area-flooded stat
    (useful as a headline number for the disaster-management slide).
    """
    ndwi_arr = ndwi(green_band, nir_band)
    water_pct = float(np.mean(ndwi_arr > 0.0) * 100.0)
    return {
        "ndwi": ndwi_arr,
        "overlay_rgb": water_extent_map(ndwi_arr),
        "water_pct": water_pct,
    }


# ---------------------------------------------------------------------------
# Export isolation check (same discipline as display_enhance.py)
# ---------------------------------------------------------------------------

def verify_export_isolation(npy_export_fn, geotiff_export_fn, sr_calibrated: np.ndarray) -> bool:
    """
    Confirms these overlays are display-only: exports must be bit-identical
    whether or not an NDVI/NDWI overlay toggle is active. Mirrors the
    bit-exact hash check already used for the unsharp-mask sharpening
    isolation.

    npy_export_fn, geotiff_export_fn: callables that take sr_calibrated
        and return bytes (or a hashable array) for the respective export.
    """
    import hashlib

    def _hash(obj) -> str:
        arr = np.asarray(obj)
        return hashlib.sha256(arr.tobytes()).hexdigest()

    npy_hash_before = _hash(npy_export_fn(sr_calibrated))
    geotiff_hash_before = _hash(geotiff_export_fn(sr_calibrated))

    # Overlay computation happens here in the real flow (UI toggle on),
    # but since these functions never touch sr_calibrated in place,
    # re-exporting after computing overlays must still match.
    if sr_calibrated.ndim == 3 and sr_calibrated.shape[-1] == 4:
        # Shape (H, W, 4)
        _ = crop_health_overlay(sr_calibrated[..., 3], sr_calibrated[..., 2])
        _ = flood_extent_overlay(sr_calibrated[..., 1], sr_calibrated[..., 3])
    elif sr_calibrated.ndim == 3 and sr_calibrated.shape[0] == 4:
        # Shape (4, H, W)
        _ = crop_health_overlay(sr_calibrated[3], sr_calibrated[2])
        _ = flood_extent_overlay(sr_calibrated[1], sr_calibrated[3])
    else:
        raise ValueError(f"Unexpected sr_calibrated shape: {sr_calibrated.shape}")

    npy_hash_after = _hash(npy_export_fn(sr_calibrated))
    geotiff_hash_after = _hash(geotiff_export_fn(sr_calibrated))

    return (npy_hash_before == npy_hash_after) and (geotiff_hash_before == geotiff_hash_after)
