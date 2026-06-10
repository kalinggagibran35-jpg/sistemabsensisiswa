export interface Location {
  latitude: number
  longitude: number
}

export interface AttendanceLocation {
  id: string
  name: string
  latitude: number
  longitude: number
  radiusMeters: number
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (loc1.latitude * Math.PI) / 180
  const φ2 = (loc2.latitude * Math.PI) / 180
  const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180
  const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

// Get current position with Promise wrapper
export function getCurrentPosition(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Browser tidak mendukung Geolocation API'))
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
            reject(
              new Error(
                'Izin akses lokasi ditolak. Aktifkan GPS dan izinkan akses lokasi.'
              )
            )
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Informasi lokasi tidak tersedia'))
            break
          case error.TIMEOUT:
            reject(new Error('Permintaan lokasi timeout'))
            break
          default:
            reject(new Error('Terjadi kesalahan saat mendapatkan lokasi'))
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  })
}

// Check if user is within any of the attendance locations
export function checkLocationInRadius(
  userLocation: Location,
  locations: AttendanceLocation[]
): {
  isValid: boolean
  nearestLocation: AttendanceLocation | null
  distance: number
} {
  let nearest: AttendanceLocation | null = null
  let minDistance = Infinity

  for (const loc of locations) {
    const distance = calculateDistance(userLocation, {
      latitude: loc.latitude,
      longitude: loc.longitude,
    })
    if (distance < minDistance) {
      minDistance = distance
      nearest = loc
    }
  }

  return {
    isValid: nearest ? minDistance <= nearest.radiusMeters : false,
    nearestLocation: nearest,
    distance: minDistance,
  }
}
