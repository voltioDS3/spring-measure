#include "main.h"

BLECharacteristic *encoderDataCharacteristic;
int counter = 0;
String encoderData;

void setup() {
  Serial.begin(115200);
  initBLE(); 
  initEncoder();
}

void loop(){
  #ifdef DEBUG
    Serial.print("velocidad angular: ");
    Serial.println(angular_velocity);
    
    Serial.print("Velocidad lineal: ");
    Serial.println(getLinearVelocity());

    Serial.print("distancia lineal: ");
    Serial.println(getLinearDistance());
  #endif
  encoderData = String(counter);
  encoderDataCharacteristic->setValue(encoderData.c_str());
  encoderDataCharacteristic->notify();
  counter++;
  delay(1000);

}