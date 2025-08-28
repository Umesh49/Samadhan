// Geolocation utilities for location matching and validation

export interface Location {
  latitude: number
  longitude: number
}

/**
 * Calculate the distance between two points using the Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (point1.latitude * Math.PI) / 180
  const φ2 = (point2.latitude * Math.PI) / 180
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Check if two locations are within acceptable range for issue resolution
 * Default threshold is 50 meters
 */
export function isLocationMatch(originalLocation: Location, responseLocation: Location, thresholdMeters = 50): boolean {
  const distance = calculateDistance(originalLocation, responseLocation)
  return distance <= thresholdMeters
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

/**
 * Get current location with error handling
 */
export function getCurrentLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Location access denied by user"))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Location information is unavailable"))
            break
          case error.TIMEOUT:
            reject(new Error("Location request timed out"))
            break
          default:
            reject(new Error("An unknown error occurred while retrieving location"))
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    )
  })
}

/**
 * Validate location coordinates
 */
export function isValidLocation(location: Location): boolean {
  return (
    typeof location.latitude === "number" &&
    typeof location.longitude === "number" &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180
  )
}

/**
 * Get location accuracy description
 */
export function getLocationAccuracy(distance: number): {
  level: "excellent" | "good" | "fair" | "poor"
  description: string
  color: string
} {
  if (distance <= 10) {
    return {
      level: "excellent",
      description: "Exact location match",
      color: "text-green-600",
    }
  } else if (distance <= 25) {
    return {
      level: "good",
      description: "Very close to original location",
      color: "text-blue-600",
    }
  } else if (distance <= 50) {
    return {
      level: "fair",
      description: "Close to original location",
      color: "text-yellow-600",
    }
  } else {
    return {
      level: "poor",
      description: "Far from original location",
      color: "text-red-600",
    }
  }
}
