// App.js
import React, { useEffect, useState } from 'react';
import {
  Button,
  View,
  Text,
  FlatList,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const SERVICE_UUID        = '00001234-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC_UUID = '00005678-0000-1000-8000-00805f9b34fb';

async function requestBlePermissions() {
  if (Platform.OS === 'android' && Platform.Version >= 31) {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    const allGranted = Object.values(granted).every(status => status === 'granted');
    if (!allGranted) {
      throw new Error('No se otorgaron todos los permisos Bluetooth necesarios');
    }
  } else if (Platform.OS === 'android') {
    // Android <12 necesita ACCESS_FINE_LOCATION para escaneo BLE
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    if (granted !== 'granted') {
      throw new Error('Permiso de ubicación denegado');
    }
  }
}

export default function App() {
  const [manager]   = useState(() => new BleManager());
  const [devices, setDevices]   = useState([]);
  const [connected, setConnected] = useState(null);

  useEffect(() => {
    return () => {
      manager.destroy();
    };
  }, []);

  const scanAndConnect = async () => {
    // 1. Pedir permisos en Android
    try {
      await requestBlePermissions();
    } catch (err) {
      console.warn('Permisos BLE no concedidos:', err.message);
      return;
    }

    // 2. Limpiar lista y empezar escaneo
    setDevices([]);
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.warn('Scan error:', error);
        return;
      }

      // 3. Filtrar por dispositivo ESP32 (ajusta el criterio si hace falta)
      if (device && device.name?.includes('ESP32')) {
        manager.stopDeviceScan();

        device.connect()
          .then(dev => {
            setConnected(dev.id);
            return dev.discoverAllServicesAndCharacteristics();
          })
          .then(dev => {
            // Leer característica inicial
            return dev.readCharacteristicForService(
              SERVICE_UUID,
              CHARACTERISTIC_UUID
            );
          })
          .then(char => {
            console.log('Valor leído:', char.value);
            // Suscribirse a notificaciones
            manager.monitorCharacteristicForDevice(
              connected,
              SERVICE_UUID,
              CHARACTERISTIC_UUID,
              (err, c) => {
                if (err) console.warn('Monitor error:', err);
                else console.log('Notificación:', c.value);
              }
            );
          })
          .catch(err => console.warn('Conexión error:', err));
      } else if (device && !devices.find(d => d.id === device.id)) {
        // Añadir a lista de descubiertos
        setDevices(prev => [...prev, device]);
      }
    });
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Escanear y conectar" onPress={scanAndConnect} />

      <Text style={{ marginTop: 20, fontWeight: 'bold' }}>
        Dispositivos encontrados:
      </Text>
      <FlatList
        data={devices}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Text style={{ paddingVertical: 4 }}>
            {item.name || item.id}
          </Text>
        )}
      />

      {connected && (
        <Text style={{ marginTop: 20, color: 'green' }}>
          Conectado a: {connected}
        </Text>
      )}
    </View>
  );
}
