import * as React from 'react';
import { Text, View, useWindowDimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

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
  const { width: screenWidth } = useWindowDimensions();

  // Mapear datos originales
  const rawData = data.map(({ index, velocity }) => ({
    value: velocity / 1000,
    label: (index * 0.01).toFixed(2) + 's',
  }));

  if (!rawData.length) {
    return (
      <View style={styles.container}>
        <Text>No hay datos para graficar</Text>
      </View>
    );
  }

  const chartData = smoothData(rawData, 10);
  const spacing = screenWidth / chartData.length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Velocidad (m/s) vs Tiempo (s)</Text>
      <LineChart
        data={chartData}
        width={screenWidth - 32} // dejar margen horizontal pero escalar con pantalla
        height={screenWidth > 600 ? 300 : 220} // si es tablet, hacerlo más alto
        spacing={spacing}
        initialSpacing={0}
        hideDataPoints={false}
        hideRules={false}
        isBezier={true}
        xAxisLabelTextStyle={{ fontSize: 10 }}
        yAxisLabelTextStyle={{ fontSize: 10 }}
        yAxisSuffix=" m/s"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
});
