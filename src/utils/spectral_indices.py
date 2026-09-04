"""
spectral_indices.py

Derived-index overlays for SatSR, built on the calibrated 4-band
(B2 Blue, B3 Green, B4 Red, B8 NIR) SR output.
"""
from jagrit.spectral_indices import (
    ndvi,
    crop_health_map,
    crop_health_overlay,
    ndwi,
    water_extent_map,
    flood_extent_overlay,
    verify_export_isolation,
    _NDVI_PALETTE,
)

__all__ = [
    "ndvi",
    "crop_health_map",
    "crop_health_overlay",
    "ndwi",
    "water_extent_map",
    "flood_extent_overlay",
    "verify_export_isolation",
    "_NDVI_PALETTE",
]
