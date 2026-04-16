/**
 * Geolocation Utilities for PharmaTrace
 * Haversine formula + impossible travel detection
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
 * Check for impossible travel between two tracking events
 * Returns { impossible: boolean, speed: number, distance: number }
 * 
 * Threshold: 900 km/h (slightly above commercial jet speed)
 */
function checkImpossibleTravel(prevEvent, currentEvent) {
    if (!prevEvent || !currentEvent) return { impossible: false };
    if (!prevEvent.latitude || !prevEvent.longitude || !currentEvent.latitude || !currentEvent.longitude) {
        return { impossible: false };
    }

    const distance = calculateDistance(
        prevEvent.latitude, prevEvent.longitude,
        currentEvent.latitude, currentEvent.longitude
    );

    const timeDiffHours = (new Date(currentEvent.timestamp || Date.now()) - new Date(prevEvent.timestamp)) / (1000 * 60 * 60);

    // Prevent division by zero
    if (timeDiffHours <= 0) {
        return {
            impossible: distance > 1, // If same time but different location, suspicious
            speed: Infinity,
            distance: Math.round(distance)
        };
    }

    const speed = distance / timeDiffHours; // km/h

    return {
        impossible: speed > 900,
        speed: Math.round(speed),
        distance: Math.round(distance)
    };
}

module.exports = { calculateDistance, checkImpossibleTravel };
