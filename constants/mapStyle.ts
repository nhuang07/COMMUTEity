// Dark Google Maps style (Android only — iOS uses MapView's native `userInterfaceStyle="dark"`).
// Tuned toward the app's green accent so land/park tones sit close to the palette.
export const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#141917" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9BA79E" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0A0D0B" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#242B26" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#1B211E" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1B2E1F" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#242B26" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#141917" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#333C36" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#242B26" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0D1614" }],
  },
] as const;
