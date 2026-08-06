#!/bin/bash
set -euo pipefail

# COMMUTEity — pull and trim TransLink GTFS static data
# Downloads the full feed, then filters routes/trips/shapes/stops down to
# a couple of real corridors near UBC (99 B-Line, Canada Line) so seed
# data follows actual streets/tracks instead of straight lines through
# buildings.

OUT_DIR="../data/translink-routes"
TMP_DIR=$(mktemp -d)

mkdir -p "$OUT_DIR"

echo "== Downloading TransLink GTFS static feed =="
# NOTE: TransLink updates this weekly. If this URL 404s, grab the current
# link from https://www.translink.ca/about-us/doing-business-with-translink/app-developer-resources/gtfs/gtfs-data
GTFS_URL="https://gtfs-static.translink.ca/gtfs/History/2026-07-31/google_transit.zip"

curl -sL "$GTFS_URL" -o "$TMP_DIR/gtfs.zip" || {
  echo "ERROR: download failed. Check the URL manually at:"
  echo "https://www.translink.ca/about-us/doing-business-with-translink/app-developer-resources/gtfs/gtfs-data"
  exit 1
}

unzip -q "$TMP_DIR/gtfs.zip" -d "$TMP_DIR"
echo "Downloaded and unzipped to $TMP_DIR"

echo "== Filtering to target routes: 099 (B-Line), Canada Line (route short_name varies) =="

python3 - "$TMP_DIR" "$OUT_DIR" <<'PYEOF'
import csv, sys, os

tmp_dir, out_dir = sys.argv[1], sys.argv[2]

# Adjust these short names if TransLink's current feed labels them
# differently — check routes.txt after first run if nothing matches.
TARGET_ROUTE_NAMES = {"099", "CANADA LINE", "CANADALINE"}

def read_csv(path):
    with open(path, newline='', encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))

def write_csv(path, rows, fieldnames):
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

routes = read_csv(os.path.join(tmp_dir, 'routes.txt'))
target_routes = [r for r in routes if r.get('route_short_name', '').strip().upper() in TARGET_ROUTE_NAMES]
target_route_ids = {r['route_id'] for r in target_routes}

if not target_route_ids:
    print("WARNING: no routes matched TARGET_ROUTE_NAMES.")
    print("Available route_short_names (first 30):")
    seen = set()
    for r in routes:
        name = r.get('route_short_name', '').strip()
        if name and name not in seen:
            seen.add(name)
        if len(seen) >= 30:
            break
    print(sorted(seen))
    sys.exit(1)

print(f"Matched {len(target_route_ids)} route(s): {target_route_ids}")

trips = read_csv(os.path.join(tmp_dir, 'trips.txt'))
target_trips = [t for t in trips if t['route_id'] in target_route_ids]
target_trip_ids = {t['trip_id'] for t in target_trips}
target_shape_ids = {t['shape_id'] for t in target_trips if t.get('shape_id')}

shapes = read_csv(os.path.join(tmp_dir, 'shapes.txt'))
target_shapes = [s for s in shapes if s['shape_id'] in target_shape_ids]

stop_times = read_csv(os.path.join(tmp_dir, 'stop_times.txt'))
target_stop_times = [st for st in stop_times if st['trip_id'] in target_trip_ids]
target_stop_ids = {st['stop_id'] for st in target_stop_times}

stops = read_csv(os.path.join(tmp_dir, 'stops.txt'))
target_stops = [s for s in stops if s['stop_id'] in target_stop_ids]

write_csv(os.path.join(out_dir, 'routes.txt'), target_routes, routes[0].keys())
write_csv(os.path.join(out_dir, 'trips.txt'), target_trips, trips[0].keys())
write_csv(os.path.join(out_dir, 'shapes.txt'), target_shapes, shapes[0].keys())
write_csv(os.path.join(out_dir, 'stops.txt'), target_stops, stops[0].keys())

print(f"Wrote trimmed subset to {out_dir}:")
print(f"  routes: {len(target_routes)}, trips: {len(target_trips)}, shapes: {len(target_shapes)} points, stops: {len(target_stops)}")
PYEOF

rm -rf "$TMP_DIR"
echo "Done. Trimmed GTFS subset is in $OUT_DIR"