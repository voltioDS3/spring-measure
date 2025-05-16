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
  
  encoderData = String(counter);
  encoderDataCharacteristic->setValue(encoderData.c_str());
  encoderDataCharacteristic->notify();
  counter++;
  delay(2000);

}