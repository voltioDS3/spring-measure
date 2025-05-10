#include "bluetooth.h"  
void initBLE(){
  Serial.println("Starting BLE work!");
 
  BLEDevice::init("encoder-sensor");  //creamos el dispositivo

  BLEServer *pServer = BLEDevice::createServer(); // creamos server
  BLEService *pService = pServer->createService(SERVICE_UUID); // creamos servicio
  
  encoderDataCharacteristic = pService->createCharacteristic(
    ENCODER_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_NOTIFY);
  encoderDataCharacteristic->addDescriptor(new BLE2902());
    // comit  test
  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  #ifdef DEBUG
  Serial.println("BLE DEVICE READY TO BE CONNECTED");
  //digitalWrite(BUILTIN_LED, HIGH);
  #endif
}