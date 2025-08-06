package expo.modules.location.geofencing

import android.content.Intent
import android.location.Location

/**
 * Custom GeofencingEvent implementation to replace Google Play Services GeofencingEvent
 */
data class CustomGeofencingEvent(
    val geofenceTransition: Int,
    val triggeringGeofences: List<CustomGeofence>,
    val triggeringLocation: Location?,
    val hasError: Boolean = false,
    val errorCode: Int = 0
) {
    companion object {
        const val EXTRA_GEOFENCING_EVENT = "expo.modules.location.geofencing.GEOFENCING_EVENT"
        const val EXTRA_TRANSITION_TYPE = "expo.modules.location.geofencing.TRANSITION_TYPE"
        const val EXTRA_TRIGGERING_GEOFENCES = "expo.modules.location.geofencing.TRIGGERING_GEOFENCES"
        const val EXTRA_TRIGGERING_LOCATION = "expo.modules.location.geofencing.TRIGGERING_LOCATION"
        const val EXTRA_ERROR_CODE = "expo.modules.location.geofencing.ERROR_CODE"

        fun fromIntent(intent: Intent?): CustomGeofencingEvent? {
            if (intent == null) return null
            
            val transitionType = intent.getIntExtra(EXTRA_TRANSITION_TYPE, -1)
            if (transitionType == -1) return null

            val errorCode = intent.getIntExtra(EXTRA_ERROR_CODE, 0)
            if (errorCode != 0) {
                return CustomGeofencingEvent(
                    geofenceTransition = transitionType,
                    triggeringGeofences = emptyList(),
                    triggeringLocation = null,
                    hasError = true,
                    errorCode = errorCode
                )
            }

            val triggeringGeofences = intent.getParcelableArrayListExtra<CustomGeofence>(EXTRA_TRIGGERING_GEOFENCES) ?: emptyList()
            val triggeringLocation = intent.getParcelableExtra<Location>(EXTRA_TRIGGERING_LOCATION)

            return CustomGeofencingEvent(
                geofenceTransition = transitionType,
                triggeringGeofences = triggeringGeofences,
                triggeringLocation = triggeringLocation,
                hasError = false,
                errorCode = 0
            )
        }

        fun createIntent(
            transitionType: Int,
            triggeringGeofences: List<CustomGeofence>,
            triggeringLocation: Location?
        ): Intent {
            return Intent().apply {
                putExtra(EXTRA_TRANSITION_TYPE, transitionType)
                putParcelableArrayListExtra(EXTRA_TRIGGERING_GEOFENCES, ArrayList(triggeringGeofences))
                putExtra(EXTRA_TRIGGERING_LOCATION, triggeringLocation)
                putExtra(EXTRA_ERROR_CODE, 0)
            }
        }

        fun createErrorIntent(errorCode: Int): Intent {
            return Intent().apply {
                putExtra(EXTRA_TRANSITION_TYPE, -1)
                putExtra(EXTRA_ERROR_CODE, errorCode)
            }
        }
    }
}