import React, { useEffect, useState } from 'react';
import {
  Button,
  View,
  Text,
  Dimensions,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import base64 from 'react-native-base64';
import SummaryChart from './src/services/components/SummaryChart';

const SERVICE_UUID = 'dc3048cc-4347-4256-8a06-6f0af67f2132';
const CHARACTERISTIC_UUID = '08a90be8-81a3-4527-911d-38162f772296';
const CONTROL_CHARACTERISTIC_UUID = '2139c448-0991-423d-8153-30b115faeca0';

const data = [
    { x: 10, y: 20 },
    { x: 20, y: 45 },
    { x: 30, y: 28 },
    { x: 40, y: 80 },
    { x: 50, y: 99 },
  ];

function parseEncoderData(base64value) {
  const raw = base64.decode(base64value);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }

  const samples = [];
  for (let i = 0; i + 3 < bytes.length; i += 4) {
    const index = bytes[i] | (bytes[i + 1] << 8);
    const velocity = bytes[i + 2] | (bytes[i + 3] << 8);
    // convertir si es necesario (signed?)
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
  const [connectedId, setConnectedId] = useState(null);
  const [deviceObj, setDeviceObj] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [measuring, setMeasuring] = useState(false);
  const [samplesData, setSamplesData] = useState([]);

  useEffect(() => {
    return () => {
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

    manager.startDeviceScan(null, null, async (error, device) => {
      if (error) {
        console.warn('Error en el escaneo:', error);
        return;
      }
      if (!device?.id) return;
      if (device.name?.includes('encoder-sensor')) {
        manager.stopDeviceScan();
        try {
          const connectedDevice = await device.connect();
          setConnectedId(connectedDevice.id);
          setDeviceObj(connectedDevice);
          await connectedDevice.discoverAllServicesAndCharacteristics();
        } catch (err) {
          console.warn('Error de conexión:', err);
        }
      }
    });
  };

  const startMeasurement = async () => {
    if (!deviceObj) return;
    setSamplesData([]);
    setMeasuring(true);
    try {
      await deviceObj.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CONTROL_CHARACTERISTIC_UUID,
        base64.encode(String.fromCharCode(0x01))
      );

      const sub = deviceObj.monitorCharacteristicForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.warn('Error al monitorear:', error);
            return;
          }
          if (characteristic?.value) {
            const newSamples = parseEncoderData(characteristic.value);
            // console.log(newSamples);
            setSamplesData(prev => [...prev, ...newSamples]);
            console.log(samplesData);
          }
        }
      );
      setSubscription(sub);
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
    subscription?.remove();
    setSubscription(null);
    setMeasuring(false);
  };

  // preparar datos para el gráfico
  const times = samplesData.map(s => (s.index * 0.01).toFixed(2));
  const velocities = samplesData.map(s => s.velocity);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>

      {!connectedId && <Button title="Conectar BLE" onPress={scanAndConnect} />}
      {connectedId && !measuring && (
        <Button title="Empezar medición" onPress={startMeasurement} />
      )}
      {connectedId && measuring && (
        <Button title="Detener medición" onPress={stopMeasurement} />
      )}
      <SummaryChart data={samplesData} />
    </View>
  );
}
