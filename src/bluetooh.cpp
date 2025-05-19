#include "bluetooth.h" 

class ControlCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pChar, esp_ble_gatts_cb_param_t* param) {
    std::string v = pChar->getValue();
    if (v.size() == 1) {
      // Si mandas 0x01 arranca, si 0x00 para
      measuring = (v[0] == 0x01);
    } else {
      // También podrías comparar texto "START"/"STOP"
      if (v == "START") measuring = true;
      else if (v == "STOP") measuring = false;
    }
    #ifdef DEBUG
      Serial.print("Measuring now: ");
      Serial.println(measuring);
    #endif
  }
};

void initBLE(){
  Serial.println("Starting BLE work!");
 
  BLEDevice::init("encoder-sensor");  //creamos el dispositivo

  BLEServer *pServer = BLEDevice::createServer(); // creamos server
  BLEService *pService = pServer->createService(SERVICE_UUID); // creamos servicio
  
  encoderDataCharacteristic = pService->createCharacteristic(
    ENCODER_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_NOTIFY);
  encoderDataCharacteristic->addDescriptor(new BLE2902());

  controlCharacteristic = pService->createCharacteristic(
  CONTROL_CHARACTERISTIC_UUID ,
  BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
);

  
  controlCharacteristic->setCallbacks(new ControlCallbacks());

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