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
import base64, { decode } from 'react-native-base64';

const SERVICE_UUID                = "dc3048cc-4347-4256-8a06-6f0af67f2132";
const CHARACTERISTIC_UUID         = "08a90be8-81a3-4527-911d-38162f772296";
const CONTROL_CHARACTERISTIC_UUID = "2139c448-0991-423d-8153-30b115faeca0";


function parseEncoderData(base64value) {
  const raw = base64.decode(base64value);
  // raw es un string con caracteres cuyo código corresponde a un byte
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }

  const samples = [];
  // Cada muestra tiene 4 bytes: 2 para index, 2 para velocidad
  for (let i = 0; i + 3 < bytes.length; i += 4) {
    // Leer index (2 bytes little endian)
    const index = bytes[i] | (bytes[i + 1] << 8);
    // Leer velocidad (2 bytes little endian)
    const velocity = bytes[i + 2] | (bytes[i + 3] << 8);

    samples.push({ index, velocity });
  }

  return samples;
}

async function requestBlePermissions() {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 31) {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      if (!Object.values(granted).every(val => val === 'granted')) {
        throw new Error('No se otorgaron todos los permisos Bluetooth necesarios');
      }
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Permiso de ubicación denegado');
      }
    }
  }
}

export default function App() {
  const [manager] = useState(() => new BleManager());
  const [devices, setDevices] = useState([]);
  const [connectedId, setConnectedId] = useState(null);
  const [deviceObj, setDeviceObj] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    return () => {
      // limpiar recursos al desmontar
      subscription?.remove();
      
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
    manager.startDeviceScan(null, null, async (error, device) => {
      if (error) {
        console.warn('Error en el escaneo:', error);
        return;
      }

      if (!device?.id) return;

      // evitar duplicados
      setDevices(prev =>
        prev.some(d => d.id === device.id) ? prev : [...prev, device]
      );

      if (device.name?.includes('encoder-sensor')) {
        manager.stopDeviceScan();

        try {
          const connectedDevice = await device.connect();
          setConnectedId(connectedDevice.id);
          setDeviceObj(connectedDevice);

          await connectedDevice.discoverAllServicesAndCharacteristics();

          const characteristic = await connectedDevice.readCharacteristicForService(
            SERVICE_UUID,
            CHARACTERISTIC_UUID
          );

          console.log('Valor leído:', characteristic.value);
        } catch (err) {
          console.warn('Error de conexión:', err);
        }
      }
    });
  };

  const startMeasurement = async () => {
    if (!deviceObj) return;

    try {
      await deviceObj.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CONTROL_CHARACTERISTIC_UUID,
        base64.encode(String.fromCharCode(0x01))
      );
    } catch (err) {
      console.warn('Error al empezar medición:', err);
    }
  };

  const stopMeasurement = async () => {
    if (!deviceObj) return;

    try {
      await deviceObj.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CONTROL_CHARACTERISTIC_UUID,
        base64.encode(String.fromCharCode(0x00))
      );
    } catch (err) {
      console.warn('Error al parar medición:', err);
    }
    const sub = deviceObj.monitorCharacteristicForService(
    SERVICE_UUID,
    CHARACTERISTIC_UUID,
    (error, characteristic) => {
      if (error) {
        console.warn('Error al suscribirse:', error);
        return;
      }
      if (characteristic?.value) {
        const samples = parseEncoderData(characteristic.value);
        console.log(samples);
        // console.log('Dato recibido:', parseEncoderData(decoded));
        // Aquí podrías actualizar el estado si quieres mostrarlo en pantalla
      }
    }
  );

  setSubscription(sub);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Escanear y conectar" onPress={scanAndConnect} />

      {connectedId && (
        <>
          <Text style={{ marginTop: 20, color: 'green' }}>
            Conectado a: {connectedId}
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
