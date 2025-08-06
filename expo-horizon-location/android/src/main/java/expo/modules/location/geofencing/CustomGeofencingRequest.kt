package expo.modules.location.geofencing

/**
 * Custom GeofencingRequest implementation to replace Google Play Services GeofencingRequest
 */
data class CustomGeofencingRequest(
    val geofences: List<CustomGeofence>,
    val initialTrigger: Int
) {
    companion object {
        const val INITIAL_TRIGGER_ENTER = 1
        const val INITIAL_TRIGGER_EXIT = 2
        const val INITIAL_TRIGGER_DWELL = 4
    }

    class Builder {
        private val geofences = mutableListOf<CustomGeofence>()
        private var initialTrigger: Int = 0

        fun addGeofences(geofenceList: List<CustomGeofence>): Builder {
            geofences.addAll(geofenceList)
            return this
        }

        fun addGeofence(geofence: CustomGeofence): Builder {
            geofences.add(geofence)
            return this
        }

        fun setInitialTrigger(initialTrigger: Int): Builder {
            this.initialTrigger = initialTrigger
            return this
        }

        fun build(): CustomGeofencingRequest {
            return CustomGeofencingRequest(geofences.toList(), initialTrigger)
        }
    }
}