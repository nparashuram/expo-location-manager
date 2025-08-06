import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-horizon-location';

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [lastKnownLocation, setLastKnownLocation] = useState<Location.LocationObject | null>(null);
  const [heading, setHeading] = useState<Location.LocationHeadingObject | null>(null);
  const [providerStatus, setProviderStatus] = useState<Location.LocationProviderStatus | null>(null);
  const [permissions, setPermissions] = useState<Location.LocationPermissionResponse | null>(null);
  const [backgroundPermissions, setBackgroundPermissions] = useState<any>(null);
  const [servicesEnabled, setServicesEnabled] = useState<boolean | null>(null);
  const [backgroundLocationAvailable, setBackgroundLocationAvailable] = useState<boolean | null>(null);
  const [locationUpdatesActive, setLocationUpdatesActive] = useState(false);
  const [geofencingActive, setGeofencingActive] = useState(false);
  const [geocodedAddress, setGeocodedAddress] = useState<Location.LocationGeocodedAddress[] | null>(null);
  const [geocodedLocation, setGeocodedLocation] = useState<Location.LocationGeocodedLocation[] | null>(null);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [headingSubscription, setHeadingSubscription] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    checkInitialStatus();
  }, []);

  const checkInitialStatus = async () => {
    try {
      const status = await Location.getProviderStatusAsync();
      setProviderStatus(status);
      
      const services = await Location.hasServicesEnabledAsync();
      setServicesEnabled(services);
      
      const available = await Location.isBackgroundLocationAvailableAsync();
      setBackgroundLocationAvailable(available);
      
      const perms = await Location.getForegroundPermissionsAsync();
      setPermissions(perms);
      
      const bgPerms = await Location.getBackgroundPermissionsAsync();
      setBackgroundPermissions(bgPerms);
    } catch (error) {
      console.error('Error checking initial status:', error);
    }
  };

  const requestForegroundPermissions = async () => {
    try {
      const result = await Location.requestForegroundPermissionsAsync();
      setPermissions(result);
      Alert.alert('Foreground Permissions', `Status: ${result.status}`);
    } catch (error) {
      Alert.alert('Error', `Failed to request foreground permissions: ${error}`);
    }
  };

  const requestBackgroundPermissions = async () => {
    try {
      const result = await Location.requestBackgroundPermissionsAsync();
      setBackgroundPermissions(result);
      Alert.alert('Background Permissions', `Status: ${result.status}`);
    } catch (error) {
      Alert.alert('Error', `Failed to request background permissions: ${error}`);
    }
  };

  const getCurrentPosition = async () => {
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(position);
      Alert.alert('Current Position', `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`);
    } catch (error) {
      Alert.alert('Error', `Failed to get current position: ${error}`);
    }
  };

  const getLastKnownPosition = async () => {
    try {
      const position = await Location.getLastKnownPositionAsync({
        maxAge: 60000, // 1 minute
        requiredAccuracy: 100, // 100 meters
      });
      setLastKnownLocation(position);
      if (position) {
        Alert.alert('Last Known Position', `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`);
      } else {
        Alert.alert('Last Known Position', 'No last known position available');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to get last known position: ${error}`);
    }
  };

  const startLocationWatching = async () => {
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation: Location.LocationObject) => {
          setLocation(newLocation);
          console.log('Location update:', newLocation);
        },
        (error: string) => {
          console.error('Location watch error:', error);
        }
      );
      setLocationSubscription(subscription);
      setLocationUpdatesActive(true);
      Alert.alert('Location Watching', 'Started watching location updates');
    } catch (error) {
      Alert.alert('Error', `Failed to start location watching: ${error}`);
    }
  };

  const stopLocationWatching = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
      setLocationUpdatesActive(false);
      Alert.alert('Location Watching', 'Stopped watching location updates');
    }
  };

  const getHeading = async () => {
    try {
      const headingData = await Location.getHeadingAsync();
      setHeading(headingData);
      Alert.alert('Heading', `True: ${headingData.trueHeading}°, Magnetic: ${headingData.magHeading}°`);
    } catch (error) {
      Alert.alert('Error', `Failed to get heading: ${error}`);
    }
  };

  const startHeadingWatching = async () => {
    try {
      const subscription = await Location.watchHeadingAsync(
        (newHeading: Location.LocationHeadingObject) => {
          setHeading(newHeading);
          console.log('Heading update:', newHeading);
        },
        (error: string) => {
          console.error('Heading watch error:', error);
        }
      );
      setHeadingSubscription(subscription);
      Alert.alert('Heading Watching', 'Started watching heading updates');
    } catch (error) {
      Alert.alert('Error', `Failed to start heading watching: ${error}`);
    }
  };

  const stopHeadingWatching = () => {
    if (headingSubscription) {
      headingSubscription.remove();
      setHeadingSubscription(null);
      Alert.alert('Heading Watching', 'Stopped watching heading updates');
    }
  };

  const geocodeAddress = async () => {
    try {
      const locations = await Location.geocodeAsync('1600 Pennsylvania Avenue NW, Washington, DC');
      setGeocodedLocation(locations);
      if (locations.length > 0) {
        Alert.alert('Geocoding Result', `Found ${locations.length} location(s)`);
      } else {
        Alert.alert('Geocoding Result', 'No locations found');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to geocode address: ${error}`);
    }
  };

  const reverseGeocodeLocation = async () => {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: 38.8977,
        longitude: -77.0365,
      });
      setGeocodedAddress(addresses);
      if (addresses.length > 0) {
        Alert.alert('Reverse Geocoding Result', `Found ${addresses.length} address(es)`);
      } else {
        Alert.alert('Reverse Geocoding Result', 'No addresses found');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to reverse geocode location: ${error}`);
    }
  };

  const startBackgroundLocationUpdates = async () => {
    try {
      await Location.startLocationUpdatesAsync('test-location-task', {
        accuracy: Location.Accuracy.Balanced,
        activityType: Location.ActivityType.Fitness,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Location Tracking',
          notificationBody: 'Tracking your location in the background',
          notificationColor: '#FF0000',
        },
      });
      setLocationUpdatesActive(true);
      Alert.alert('Background Location', 'Started background location updates');
    } catch (error) {
      Alert.alert('Error', `Failed to start background location updates: ${error}`);
    }
  };

  const stopBackgroundLocationUpdates = async () => {
    try {
      await Location.stopLocationUpdatesAsync('test-location-task');
      setLocationUpdatesActive(false);
      Alert.alert('Background Location', 'Stopped background location updates');
    } catch (error) {
      Alert.alert('Error', `Failed to stop background location updates: ${error}`);
    }
  };

  const startGeofencing = async () => {
    try {
      const regions: Location.LocationRegion[] = [
        {
          identifier: 'test-region-1',
          latitude: 38.8977,
          longitude: -77.0365,
          radius: 1000, // 1km
          notifyOnEnter: true,
          notifyOnExit: true,
        },
      ];
      await Location.startGeofencingAsync('test-geofencing-task', regions);
      setGeofencingActive(true);
      Alert.alert('Geofencing', 'Started geofencing with test region');
    } catch (error) {
      Alert.alert('Error', `Failed to start geofencing: ${error}`);
    }
  };

  const stopGeofencing = async () => {
    try {
      await Location.stopGeofencingAsync('test-geofencing-task');
      setGeofencingActive(false);
      Alert.alert('Geofencing', 'Stopped geofencing');
    } catch (error) {
      Alert.alert('Error', `Failed to stop geofencing: ${error}`);
    }
  };

  const enableNetworkProvider = async () => {
    if (Platform.OS === 'android') {
      try {
        await Location.enableNetworkProviderAsync();
        Alert.alert('Network Provider', 'Network provider enabled');
      } catch (error) {
        Alert.alert('Error', `Failed to enable network provider: ${error}`);
      }
    } else {
      Alert.alert('Network Provider', 'This method is only available on Android');
    }
  };

  const checkLocationUpdatesStatus = async () => {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync('test-location-task');
      Alert.alert('Location Updates Status', `Active: ${hasStarted}`);
    } catch (error) {
      Alert.alert('Error', `Failed to check location updates status: ${error}`);
    }
  };

  const checkGeofencingStatus = async () => {
    try {
      const hasStarted = await Location.hasStartedGeofencingAsync('test-geofencing-task');
      Alert.alert('Geofencing Status', `Active: ${hasStarted}`);
    } catch (error) {
      Alert.alert('Error', `Failed to check geofencing status: ${error}`);
    }
  };

  const TestButton = ({ title, onPress, color = '#007AFF' }: { title: string; onPress: () => void; color?: string }) => (
    <TouchableOpacity style={[styles.button, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );

  const StatusText = ({ label, value }: { label: string; value: any }) => (
    <Text style={styles.statusText}>
      <Text style={styles.statusLabel}>{label}: </Text>
      <Text style={styles.statusValue}>{String(value)}</Text>
    </Text>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Expo Horizon Location Test</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <StatusText label="Services Enabled" value={servicesEnabled} />
          <StatusText label="Background Location Available" value={backgroundLocationAvailable} />
          <StatusText label="Foreground Permissions" value={permissions?.status} />
          <StatusText label="Background Permissions" value={backgroundPermissions?.status} />
          <StatusText label="Location Updates Active" value={locationUpdatesActive} />
          <StatusText label="Geofencing Active" value={geofencingActive} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <TestButton title="Request Foreground Permissions" onPress={requestForegroundPermissions} />
          <TestButton title="Request Background Permissions" onPress={requestBackgroundPermissions} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <TestButton title="Get Current Position" onPress={getCurrentPosition} />
          <TestButton title="Get Last Known Position" onPress={getLastKnownPosition} />
          <TestButton title="Start Location Watching" onPress={startLocationWatching} />
          <TestButton title="Stop Location Watching" onPress={stopLocationWatching} color="#FF3B30" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Heading</Text>
          <TestButton title="Get Heading" onPress={getHeading} />
          <TestButton title="Start Heading Watching" onPress={startHeadingWatching} />
          <TestButton title="Stop Heading Watching" onPress={stopHeadingWatching} color="#FF3B30" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geocoding</Text>
          <TestButton title="Geocode Address" onPress={geocodeAddress} />
          <TestButton title="Reverse Geocode Location" onPress={reverseGeocodeLocation} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Background Services</Text>
          <TestButton title="Start Background Location Updates" onPress={startBackgroundLocationUpdates} />
          <TestButton title="Stop Background Location Updates" onPress={stopBackgroundLocationUpdates} color="#FF3B30" />
          <TestButton title="Start Geofencing" onPress={startGeofencing} />
          <TestButton title="Stop Geofencing" onPress={stopGeofencing} color="#FF3B30" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utilities</Text>
          <TestButton title="Enable Network Provider" onPress={enableNetworkProvider} />
          <TestButton title="Check Location Updates Status" onPress={checkLocationUpdatesStatus} />
          <TestButton title="Check Geofencing Status" onPress={checkGeofencingStatus} />
        </View>

        {location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Location</Text>
            <Text style={styles.dataText}>Latitude: {location.coords.latitude}</Text>
            <Text style={styles.dataText}>Longitude: {location.coords.longitude}</Text>
            <Text style={styles.dataText}>Accuracy: {location.coords.accuracy}m</Text>
            <Text style={styles.dataText}>Timestamp: {new Date(location.timestamp).toLocaleString()}</Text>
          </View>
        )}

        {heading && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Heading</Text>
            <Text style={styles.dataText}>True Heading: {heading.trueHeading}°</Text>
            <Text style={styles.dataText}>Magnetic Heading: {heading.magHeading}°</Text>
            <Text style={styles.dataText}>Accuracy: {heading.accuracy}</Text>
          </View>
        )}

        {geocodedAddress && geocodedAddress.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Geocoded Address</Text>
            {geocodedAddress.map((address, index) => (
              <View key={index} style={styles.addressContainer}>
                <Text style={styles.dataText}>Name: {address.name}</Text>
                <Text style={styles.dataText}>Street: {address.street} {address.streetNumber}</Text>
                <Text style={styles.dataText}>City: {address.city}</Text>
                <Text style={styles.dataText}>Region: {address.region}</Text>
                <Text style={styles.dataText}>Country: {address.country}</Text>
              </View>
            ))}
          </View>
        )}

        {geocodedLocation && geocodedLocation.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Geocoded Location</Text>
            {geocodedLocation.map((loc, index) => (
              <View key={index} style={styles.locationContainer}>
                <Text style={styles.dataText}>Latitude: {loc.latitude}</Text>
                <Text style={styles.dataText}>Longitude: {loc.longitude}</Text>
                {loc.accuracy && <Text style={styles.dataText}>Accuracy: {loc.accuracy}m</Text>}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 5,
  },
  statusLabel: {
    fontWeight: 'bold',
    color: '#666',
  },
  statusValue: {
    color: '#333',
  },
  dataText: {
    fontSize: 14,
    marginBottom: 3,
    color: '#333',
  },
  addressContainer: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  locationContainer: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
});
