#ifndef MAIN_H
#define MAIN_H
#include <ArduinoJson.h>
#include <Arduino.h>

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>

#include "bluetooth.h"

#define DEBUG
#define RELEASE

extern BLECharacteristic *encoderDataCharacteristic;


#endif