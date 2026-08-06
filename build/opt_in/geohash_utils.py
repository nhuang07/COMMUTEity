"""
Pure-Python geohash encoding. No external dependencies on purpose —
this avoids needing a Lambda layer for a native/C-extension geohash
library, which is a common source of last-minute packaging pain.

Precision guide (roughly, at the equator):
  5 chars ~ 4.9km x 4.9km   (too coarse for commute matching)
  6 chars ~ 1.2km x 0.61km  (reasonable for "same general path")
  7 chars ~ 153m x 153m     (good default for commute overlap)
  8 chars ~ 38m x 19m       (precise, more cells, fewer coincidental overlaps)

Start with 7. If your overlap engine is matching too many unrelated
people, drop to 8. If it's matching too few genuine overlaps, go to 6.
"""

_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"


def encode(latitude: float, longitude: float, precision: int = 7) -> str:
    """Encode a lat/lon point into a geohash string of the given precision."""
    lat_range = [-90.0, 90.0]
    lon_range = [-180.0, 180.0]

    geohash = []
    bits = 0
    bit_count = 0
    even_bit = True  # geohash interleaves longitude first

    while len(geohash) < precision:
        if even_bit:
            mid = (lon_range[0] + lon_range[1]) / 2
            if longitude >= mid:
                bits = (bits << 1) | 1
                lon_range[0] = mid
            else:
                bits = bits << 1
                lon_range[1] = mid
        else:
            mid = (lat_range[0] + lat_range[1]) / 2
            if latitude >= mid:
                bits = (bits << 1) | 1
                lat_range[0] = mid
            else:
                bits = bits << 1
                lat_range[1] = mid

        even_bit = not even_bit
        bit_count += 1

        if bit_count == 5:
            geohash.append(_BASE32[bits])
            bits = 0
            bit_count = 0

    return "".join(geohash)


def checkpoint_sequence(points, precision: int = 7):
    """
    Convert a raw list of location pings into the geohash+timestamp
    sequence that actually gets sent to the backend.

    points: list of dicts like {"lat": 49.2606, "lon": -123.2460, "ts": 1723000000}
    returns: list of dicts like {"geohash": "c2b2qz3", "ts": 1723000000}

    This is the on-device step — raw lat/lon should never leave the
    phone. Only call this locally, then send the output.
    """
    return [
        {"geohash": encode(p["lat"], p["lon"], precision), "ts": p["ts"]}
        for p in points
    ]


if __name__ == "__main__":
    # Quick sanity check — UBC Bus Loop area
    ubc_bus_loop = encode(49.2664, -123.2510, precision=7)
    print("UBC Bus Loop geohash:", ubc_bus_loop)

    # Two points ~50m apart should usually share a 7-char prefix
    nearby_point = encode(49.2665, -123.2511, precision=7)
    print("Nearby point geohash:", nearby_point)

    print("Same 7-char cell:", ubc_bus_loop == nearby_point)
