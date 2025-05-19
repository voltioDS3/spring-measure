#include "main.h"

BLECharacteristic *encoderDataCharacteristic;
int counter = 0;
String encoderData;

EncoderSample encoder_packet[SAMPLES_PER_PACKET];
uint8_t packet_count = 0;
uint16_t sample_index = 0;
unsigned long lastSampleTime = 0;

void bufferSample(float speed){
  int16_t vq = (int16_t)round(speed * 1000.0f);
  encoder_packet[packet_count++] = {sample_index++, vq};

  if(packet_count >= SAMPLES_PER_PACKET){

    #ifdef DEBUG
      Serial.println("enviando paquetes");
      Serial.println("=== Paquete BLE ===");
      for (uint8_t i = 0; i < packet_count; i++) {
        Serial.print("Muestra ");
        Serial.print(i);
        Serial.print(" -> idx: ");
        Serial.print(encoder_packet[i].idx);
        Serial.print(" | vel (mm/s): ");
        Serial.println(encoder_packet[i].vel_q);
      }
      Serial.println("===================");
    #endif
    encoderDataCharacteristic->setValue(
      (uint8_t*)encoder_packet,
      sizeof(EncoderSample)*SAMPLES_PER_PACKET
    );
    encoderDataCharacteristic->notify();
    packet_count = 0;
  }
}
void setup() {
  Serial.begin(115200);
  initBLE(); 
  initEncoder();
}

void loop(){
  unsigned long now = millis();
  #ifdef DEBUG
  if(now - lastSampleTime > DEBUG_SAMPLE_INTERVAL_MS){
 
    Serial.print("velocidad angular: ");
    Serial.println(angular_velocity);
    
    Serial.print("Velocidad lineal: ");
    Serial.println(getLinearVelocity());

    Serial.print("distancia lineal: ");
    Serial.println(getLinearDistance());

  }
  #endif
 

  if (now - lastSampleTime >= SAMPLE_PERIOD_MS) {
    lastSampleTime += SAMPLE_PERIOD_MS;
    float linear_velocity  = getLinearVelocity();
    bufferSample(linear_velocity);
  }

  // encoderData = String(counter);
  // encoderDataCharacteristic->setValue(encoderData.c_str());
  // encoderDataCharacteristic->notify();
  // counter++;
  // delay(1000);

}