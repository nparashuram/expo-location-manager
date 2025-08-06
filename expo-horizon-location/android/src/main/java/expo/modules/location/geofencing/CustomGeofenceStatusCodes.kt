package expo.modules.location.geofencing

/**
 * Custom GeofenceStatusCodes to replace Google Play Services GeofenceStatusCodes
 */
object CustomGeofenceStatusCodes {
    const val SUCCESS = 0
    const val GEOFENCE_NOT_AVAILABLE = 1000
    const val GEOFENCE_TOO_MANY_GEOFENCES = 1001
    const val GEOFENCE_TOO_MANY_PENDING_INTENTS = 1002
    const val GEOFENCE_INSUFFICIENT_PERMISSIONS = 1003
    const val GEOFENCE_REQUEST_TOO_FREQUENT = 1004
}