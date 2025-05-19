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
import base64 from 'react-native-base64';

const SERVICE_UUID                   = "dc3048cc-4347-4256-8a06-6f0af67f2132";
const CHARACTERISTIC_UUID            = "08a90be8-81a3-4527-911d-38162f772296";
const CONTROL_CHARACTERISTIC_UUID    = "2139c448-0991-423d-8153-30b115faeca0";

async function requestBlePermissions() {
  if (Platform.OS === 'android' && Platform.Version >= 31) {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    if (!Object.values(granted).every(status => status === 'granted')) {
      throw new Error('No se otorgaron todos los permisos Bluetooth necesarios');
    }
  } else if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    if (granted !== 'granted') {
      throw new Error('Permiso de ubicación denegado');
    }
  }
}

export default function App() {
  const [manager]      = useState(() => new BleManager());
  const [devices, setDevices] = useState([]);
  const [connected, setConnected] = useState(null);
  const [deviceObj, setDeviceObj] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    return () => {
      // limpiar todo al desmontar
      subscription && subscription.remove();
      manager.destroy();
    };
  }, [subscription]);

  const scanAndConnect = async () => {
    try {
      await requestBlePermissions();
    } catch (err) {
      console.warn(err.message);
      return;
    }

    setDevices([]);
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.warn('Scan error:', error);
        return;
      }
      if (device && device.name?.includes('encoder-sensor')) {
        manager.stopDeviceScan();
        device.connect()
          .then(dev => {
            setConnected(dev.id);
            setDeviceObj(dev);
            return dev.discoverAllServicesAndCharacteristics();
          })
          .then(dev => {
            // leer y luego subscribir
            return dev.readCharacteristicForService(
              SERVICE_UUID,
              CHARACTERISTIC_UUID
            );
          })
          .then(char => {
            console.log('Valor leído:', char.value);
          })
          .catch(err => console.warn('Conexión error:', err));
      } else if (device && !devices.find(d => d.id === device.id)) {
        setDevices(prev => [...prev, device]);
      }
    });
  };

  const startMeasurement = async () => {
    if (!deviceObj) return;
    // escribe 0x01 (base64 "AQ==")
    await deviceObj.writeCharacteristicWithResponseForService(
      SERVICE_UUID,
      CONTROL_CHARACTERISTIC_UUID,
      base64.encode(String.fromCharCode(0x01))
    );
  };

  const stopMeasurement = async () => {
    if (!deviceObj) return;
    // escribe 0x00 (base64 "AA==")
    await deviceObj.writeCharacteristicWithResponseForService(
      SERVICE_UUID,
      CONTROL_CHARACTERISTIC_UUID,
      base64.encode(String.fromCharCode(0x00))
    );
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Escanear y conectar" onPress={scanAndConnect} />

      {connected && (
        <>
          <Text style={{ marginTop: 20, color: 'green' }}>
            Conectado a: {connected}
          </Text>

          <View style={{ marginVertical: 10 }}>
            <Button title="Empezar medición" onPress={startMeasurement} />
          </View>

          <View style={{ marginBottom: 20 }}>
            <Button title="Parar medición" onPress={stopMeasurement} />
          </View>
        </>
      )}

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
    </View>
  );
}