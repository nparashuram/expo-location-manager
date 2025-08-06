package expo.modules.location.geofencing

import android.app.PendingIntent
import android.content.Context
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Looper
import android.util.Log
import androidx.core.location.LocationManagerCompat
import java.util.concurrent.ConcurrentHashMap

/**
 * Custom GeofencingClient implementation using LocationManager instead of Google Play Services
 */
class CustomGeofencingClient(private val context: Context) {
    private val locationManager: LocationManager by lazy {
        context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    }
    
    private val activeGeofences = ConcurrentHashMap<String, CustomGeofence>()
    private val geofenceStates = ConcurrentHashMap<String, Boolean>() // true = inside, false = outside
    private var pendingIntent: PendingIntent? = null
    private var locationListener: LocationListener? = null
    
    companion object {
        private const val TAG = "CustomGeofencingClient"
        private const val MIN_TIME_MS = 5000L // 5 seconds
        private const val MIN_DISTANCE_M = 10f // 10 meters
    }

    /**
     * Add geofences with the given request and pending intent
     */
    fun addGeofences(request: CustomGeofencingRequest, pendingIntent: PendingIntent): Boolean {
        try {
            this.pendingIntent = pendingIntent
            
            // Store geofences
            for (geofence in request.geofences) {
                activeGeofences[geofence.requestId] = geofence
                geofenceStates[geofence.requestId] = false // Initially assume outside
            }
            
            // Start location monitoring
            startLocationMonitoring()
            
            Log.d(TAG, "Added ${request.geofences.size} geofences")
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to add geofences", e)
            return false
        }
    }

    /**
     * Remove geofences using pending intent
     */
    fun removeGeofences(pendingIntent: PendingIntent): Boolean {
        try {
            stopLocationMonitoring()
            activeGeofences.clear()
            geofenceStates.clear()
            this.pendingIntent = null
            Log.d(TAG, "Removed all geofences")
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to remove geofences", e)
            return false
        }
    }

    /**
     * Remove geofences by request IDs
     */
    fun removeGeofences(geofenceRequestIds: List<String>): Boolean {
        try {
            for (requestId in geofenceRequestIds) {
                activeGeofences.remove(requestId)
                geofenceStates.remove(requestId)
            }
            
            if (activeGeofences.isEmpty()) {
                stopLocationMonitoring()
                pendingIntent = null
            }
            
            Log.d(TAG, "Removed ${geofenceRequestIds.size} geofences")
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to remove geofences", e)
            return false
        }
    }

    private fun startLocationMonitoring() {
        if (locationListener != null) {
            stopLocationMonitoring()
        }

        locationListener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                checkGeofences(location)
            }

            override fun onProviderEnabled(provider: String) {}
            override fun onProviderDisabled(provider: String) {}
        }

        try {
            // Try GPS first, then network
            val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
            
            for (provider in providers) {
                if (LocationManagerCompat.isLocationEnabled(locationManager) && 
                    locationManager.isProviderEnabled(provider)) {
                    
                    locationManager.requestLocationUpdates(
                        provider,
                        MIN_TIME_MS,
                        MIN_DISTANCE_M,
                        locationListener!!,
                        Looper.getMainLooper()
                    )
                    
                    Log.d(TAG, "Started location monitoring with provider: $provider")
                    break
                }
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "Location permission not granted", e)
        }
    }

    private fun stopLocationMonitoring() {
        locationListener?.let { listener ->
            try {
                locationManager.removeUpdates(listener)
                Log.d(TAG, "Stopped location monitoring")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to stop location monitoring", e)
            }
        }
        locationListener = null
    }

    private fun checkGeofences(location: Location) {
        val triggeredGeofences = mutableListOf<CustomGeofence>()
        var transitionType = -1

        for (geofence in activeGeofences.values) {
            val isInside = geofence.contains(location.latitude, location.longitude)
            val wasInside = geofenceStates[geofence.requestId] ?: false

            if (isInside != wasInside) {
                // State changed
                geofenceStates[geofence.requestId] = isInside
                
                val currentTransition = if (isInside) {
                    CustomGeofence.GEOFENCE_TRANSITION_ENTER
                } else {
                    CustomGeofence.GEOFENCE_TRANSITION_EXIT
                }

                // Check if this transition type is monitored
                if ((geofence.transitionTypes and currentTransition) != 0) {
                    triggeredGeofences.add(geofence)
                    if (transitionType == -1) {
                        transitionType = currentTransition
                    }
                }

                Log.d(TAG, "Geofence ${geofence.requestId} transition: ${if (isInside) "ENTER" else "EXIT"}")
            }
        }

        if (triggeredGeofences.isNotEmpty() && transitionType != -1) {
            sendGeofenceEvent(transitionType, triggeredGeofences, location)
        }
    }

    private fun sendGeofenceEvent(
        transitionType: Int,
        triggeredGeofences: List<CustomGeofence>,
        location: Location
    ) {
        pendingIntent?.let { intent ->
            try {
                val geofenceIntent = CustomGeofencingEvent.createIntent(
                    transitionType,
                    triggeredGeofences,
                    location
                )
                
                intent.send(context, 0, geofenceIntent)
                Log.d(TAG, "Sent geofence event for ${triggeredGeofences.size} geofences")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to send geofence event", e)
            }
        }
    }
}