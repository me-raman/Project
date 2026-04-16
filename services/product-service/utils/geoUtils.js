/**
 * Geolocation Utilities for Product Service
 * Consumer scan anomaly detection (distance-based, not speed-based)
 */

/**
 * Calculate distance between two GPS coordinates in kilometers
 * Uses the Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Check consumer scan anomaly (distance-based)
 * 
 * Logic: Once a product is at a pharmacy, consumer scans should be
 * near the pharmacy location. Scans >50km away are suspicious.
 * Two consumer scans >50km apart indicate cloning.
 * 
 * @param {Object} consumerScan - { latitude, longitude }
 * @param {Object} pharmacyLocation - { latitude, longitude }
 * @param {Object} lastConsumerScan - { latitude, longitude } (optional)
 * @returns {Object} { anomaly: boolean, type: string, details: string }
 */
function checkConsumerScanAnomaly(consumerScan, pharmacyLocation, lastConsumerScan) {
    const DISTANCE_THRESHOLD_KM = 50;
    const result = { anomaly: false, type: null, details: null };

    // Check 1: Distance from pharmacy
    if (pharmacyLocation && pharmacyLocation.latitude && pharmacyLocation.longitude) {
        const distFromPharmacy = calculateDistance(
            consumerScan.latitude, consumerScan.longitude,
            pharmacyLocation.latitude, pharmacyLocation.longitude
        );
        if (distFromPharmacy > DISTANCE_THRESHOLD_KM) {
            result.anomaly = true;
            result.type = 'FAR_FROM_PHARMACY';
            result.details = `Consumer scan is ${Math.round(distFromPharmacy)}km from pharmacy location`;
            result.distance = Math.round(distFromPharmacy);
            return result;
        }
    }

    // Check 2: Distance from previous consumer scan
    if (lastConsumerScan && lastConsumerScan.latitude && lastConsumerScan.longitude) {
        const distFromLastScan = calculateDistance(
            consumerScan.latitude, consumerScan.longitude,
            lastConsumerScan.latitude, lastConsumerScan.longitude
        );
        if (distFromLastScan > DISTANCE_THRESHOLD_KM) {
            result.anomaly = true;
            result.type = 'CONSUMER_SCANS_FAR_APART';
            result.details = `Consumer scans are ${Math.round(distFromLastScan)}km apart — possible clone`;
            result.distance = Math.round(distFromLastScan);
            return result;
        }
    }

    return result;
}

module.exports = { calculateDistance, checkConsumerScanAnomaly };
