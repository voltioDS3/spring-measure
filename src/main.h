#ifndef MAIN_H
#define MAIN_H
#include <ArduinoJson.h>
#include <Arduino.h>

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>

#include "bluetooth.h"
#include "encoder.h"

// #define DEBUG
// #define RELEASE
#define DEBUG_SAMPLE_INTERVAL_MS 500
extern BLECharacteristic *encoderDataCharacteristic;
extern BLECharacteristic *controlCharacteristic;
extern bool measuring;
extern int encoder_count;
extern volatile float angular_velocity;
extern volatile float linear_velocity;
#endif