import * as React from 'react';
import { Text, View, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

// Función para suavizar con media móvil simple
function smoothData(data, windowSize = 5) {
  const smoothed = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length - 1, i + Math.floor(windowSize / 2));
    const window = data.slice(start, end + 1);
    const avg = window.reduce((sum, p) => sum + p.value, 0) / window.length;
    smoothed.push({ value: avg, label: data[i].label });
  }
  return smoothed;
}

export default function SummaryChart({ data = [] }) {
  // Mapear datos originales
  const rawData = data.map(({ index, velocity }) => ({
    value: velocity/1000,
    label: (index * 0.01).toFixed(2) + 's',
  }));

  if (!rawData.length) {
    return (
      <View style={{ padding: 20 }}>
        <Text>No hay datos para graficar</Text>
      </View>
    );
  }

  // Suavizar datos (ventana de 5 muestras)
  const chartData = smoothData(rawData, 20);

  // Dimensiones
  const screenWidth = Dimensions.get('window').width - 40;
  const spacing = screenWidth / chartData.length;

  return (
    <View style={{ paddingVertical: 20, paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 8 }}>
        Velocidad (m/s) vs Tiempo (s)
      </Text>
      <LineChart
        data={chartData}
        width={screenWidth}
        height={220}
        spacing={spacing}
        initialSpacing={0}
        hideDataPoints={false}
        hideRules={false}
        isBezier={true}        // curva suave
        xAxisLabelTextStyle={{ fontSize: 10 }}
        yAxisLabelTextStyle={{ fontSize: 10 }}
        yAxisSuffix=" m/s"
      />
    </View>
  );
}
