package expo.modules.location

import android.content.Context
import android.location.Criteria
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Looper
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.location.records.LocationLastKnownOptions
import expo.modules.location.records.LocationOptions
import expo.modules.location.records.LocationResponse
import expo.modules.location.records.PermissionRequestResponse
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

class LocationHelpers {
  companion object {
    /**
     * Checks whether given location didn't exceed given `maxAge` and fits in the required accuracy.
     */
    internal fun isLocationValid(location: Location?, options: LocationLastKnownOptions): Boolean {
      if (location == null) {
        return false
      }
      val maxAge = options.maxAge ?: Double.MAX_VALUE
      val requiredAccuracy = options.requiredAccuracy ?: Double.MAX_VALUE
      val timeDiff = (System.currentTimeMillis() - location.time).toDouble()
      return timeDiff <= maxAge && location.accuracy <= requiredAccuracy
    }

    fun hasNetworkProviderEnabled(context: Context?): Boolean {
      if (context == null) {
        return false
      }
      val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
      return locationManager != null && locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }

    internal fun prepareLocationCriteria(options: LocationOptions): Criteria {
      val criteria = Criteria()
      
      // Set accuracy based on options
      when (options.accuracy) {
        LocationModule.ACCURACY_BEST_FOR_NAVIGATION, LocationModule.ACCURACY_HIGHEST, LocationModule.ACCURACY_HIGH -> {
          criteria.accuracy = Criteria.ACCURACY_FINE
          criteria.horizontalAccuracy = Criteria.ACCURACY_HIGH
        }
        LocationModule.ACCURACY_BALANCED -> {
          criteria.accuracy = Criteria.ACCURACY_MEDIUM
          criteria.horizontalAccuracy = Criteria.ACCURACY_MEDIUM
        }
        LocationModule.ACCURACY_LOW -> {
          criteria.accuracy = Criteria.ACCURACY_COARSE
          criteria.horizontalAccuracy = Criteria.ACCURACY_LOW
        }
        LocationModule.ACCURACY_LOWEST -> {
          criteria.accuracy = Criteria.ACCURACY_COARSE
          criteria.horizontalAccuracy = Criteria.ACCURACY_LOW
        }
        else -> {
          criteria.accuracy = Criteria.ACCURACY_MEDIUM
          criteria.horizontalAccuracy = Criteria.ACCURACY_MEDIUM
        }
      }

      // Set power consumption
      when (options.accuracy) {
        LocationModule.ACCURACY_BEST_FOR_NAVIGATION, LocationModule.ACCURACY_HIGHEST, LocationModule.ACCURACY_HIGH -> {
          criteria.powerRequirement = Criteria.POWER_HIGH
        }
        LocationModule.ACCURACY_BALANCED -> {
          criteria.powerRequirement = Criteria.POWER_MEDIUM
        }
        LocationModule.ACCURACY_LOW, LocationModule.ACCURACY_LOWEST -> {
          criteria.powerRequirement = Criteria.POWER_LOW
        }
        else -> {
          criteria.powerRequirement = Criteria.POWER_MEDIUM
        }
      }

      return criteria
    }

    fun requestSingleLocation(locationManager: LocationManager, criteria: Criteria, promise: Promise) {
      try {
        val bestProvider = locationManager.getBestProvider(criteria, true)
        if (bestProvider == null) {
          promise.reject(CurrentLocationIsUnavailableException())
          return
        }

        val locationListener = object : LocationListener {
          override fun onLocationChanged(location: Location) {
            locationManager.removeUpdates(this)
            promise.resolve(LocationResponse(location))
          }

          override fun onProviderEnabled(provider: String) {}
          override fun onProviderDisabled(provider: String) {}
          override fun onStatusChanged(provider: String, status: Int, extras: Bundle) {}
        }

        locationManager.requestSingleUpdate(bestProvider, locationListener, Looper.getMainLooper())
      } catch (e: SecurityException) {
        promise.reject(LocationRequestRejectedException(e))
      }
    }

    fun requestContinuousUpdates(locationModule: LocationModule, criteria: Criteria, watchId: Int, promise: Promise) {
      locationModule.requestLocationUpdates(
        criteria,
        watchId,
        object : LocationRequestCallbacks {
          override fun onLocationChanged(location: Location) {
            locationModule.sendLocationResponse(watchId, LocationResponse(location))
          }

          override fun onRequestSuccess() {
            promise.resolve(null)
          }

          override fun onRequestFailed(cause: CodedException) {
            promise.reject(cause)
          }
        }
      )
    }

    fun isAnyProviderAvailable(context: Context?): Boolean {
      val locationManager = context?.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        ?: return false
      return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) || locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }

    // Decorator for Permissions.getPermissionsWithPermissionsManager, for use in Kotlin coroutines
    internal suspend fun getPermissionsWithPermissionsManager(contextPermissions: Permissions, vararg permissionStrings: String): PermissionRequestResponse {
      return suspendCoroutine { continuation ->
        Permissions.getPermissionsWithPermissionsManager(
          contextPermissions,
          object : Promise {
            override fun resolve(value: Any?) {
              val result = value as? Bundle
                ?: throw ConversionException(Any::class.java, Bundle::class.java, "value returned by the permission promise is not a Bundle")
              continuation.resume(PermissionRequestResponse(result))
            }

            override fun reject(code: String, message: String?, cause: Throwable?) {
              continuation.resumeWithException(CodedException(code, message, cause))
            }
          },
          *permissionStrings
        )
      }
    }

    // Decorator for Permissions.getPermissionsWithPermissionsManager, for use in Kotlin coroutines
    internal suspend fun askForPermissionsWithPermissionsManager(contextPermissions: Permissions, vararg permissionStrings: String): Bundle {
      return suspendCoroutine {
        Permissions.askForPermissionsWithPermissionsManager(
          contextPermissions,
          object : Promise {
            override fun resolve(value: Any?) {
              it.resume(
                value as? Bundle
                  ?: throw ConversionException(Any::class.java, Bundle::class.java, "value returned by the permission promise is not a Bundle")
              )
            }

            override fun reject(code: String, message: String?, cause: Throwable?) {
              it.resumeWithException(CodedException(code, message, cause))
            }
          },
          *permissionStrings
        )
      }
    }
  }
}

/**
 * A singleton that keeps information about whether the app is in the foreground or not.
 * This is a simple solution for passing current foreground information from the LocationModule to LocationTaskConsumer.
 */
object AppForegroundedSingleton {
  var isForegrounded = false
}
