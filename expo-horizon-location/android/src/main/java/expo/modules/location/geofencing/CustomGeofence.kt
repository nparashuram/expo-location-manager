package expo.modules.location.geofencing

import android.os.Parcel
import android.os.Parcelable

/**
 * Custom Geofence implementation to replace Google Play Services Geofence
 * Uses LocationManager instead of GMS
 */
data class CustomGeofence(
    val requestId: String,
    val latitude: Double,
    val longitude: Double,
    val radius: Float,
    val transitionTypes: Int,
    val expirationDuration: Long = NEVER_EXPIRE
) : Parcelable {
    constructor(parcel: Parcel) : this(
        parcel.readString() ?: "",
        parcel.readDouble(),
        parcel.readDouble(),
        parcel.readFloat(),
        parcel.readInt(),
        parcel.readLong()
    )

    override fun writeToParcel(parcel: Parcel, flags: Int) {
        parcel.writeString(requestId)
        parcel.writeDouble(latitude)
        parcel.writeDouble(longitude)
        parcel.writeFloat(radius)
        parcel.writeInt(transitionTypes)
        parcel.writeLong(expirationDuration)
    }

    override fun describeContents(): Int {
        return 0
    }

    companion object CREATOR : Parcelable.Creator<CustomGeofence> {
        const val NEVER_EXPIRE = -1L
        const val GEOFENCE_TRANSITION_ENTER = 1
        const val GEOFENCE_TRANSITION_EXIT = 2
        const val GEOFENCE_TRANSITION_DWELL = 4

        override fun createFromParcel(parcel: Parcel): CustomGeofence {
            return CustomGeofence(parcel)
        }

        override fun newArray(size: Int): Array<CustomGeofence?> {
            return arrayOfNulls(size)
        }
    }

    class Builder {
        private var requestId: String = ""
        private var latitude: Double = 0.0
        private var longitude: Double = 0.0
        private var radius: Float = 0f
        private var transitionTypes: Int = 0
        private var expirationDuration: Long = NEVER_EXPIRE

        fun setRequestId(requestId: String): Builder {
            this.requestId = requestId
            return this
        }

        fun setCircularRegion(latitude: Double, longitude: Double, radius: Float): Builder {
            this.latitude = latitude
            this.longitude = longitude
            this.radius = radius
            return this
        }

        fun setTransitionTypes(transitionTypes: Int): Builder {
            this.transitionTypes = transitionTypes
            return this
        }

        fun setExpirationDuration(expirationDuration: Long): Builder {
            this.expirationDuration = expirationDuration
            return this
        }

        fun build(): CustomGeofence {
            return CustomGeofence(requestId, latitude, longitude, radius, transitionTypes, expirationDuration)
        }
    }

    /**
     * Calculate distance from a point to the geofence center
     */
    fun distanceFrom(lat: Double, lon: Double): Float {
        val results = FloatArray(1)
        android.location.Location.distanceBetween(latitude, longitude, lat, lon, results)
        return results[0]
    }

    /**
     * Check if a location is inside the geofence
     */
    fun contains(lat: Double, lon: Double): Boolean {
        return distanceFrom(lat, lon) <= radius
    }
}