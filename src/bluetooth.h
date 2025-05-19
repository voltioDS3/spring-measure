#ifndef BLUETOOTH_H
#define BLUETOOTH_H
#include "main.h"
static BLEUUID BLESERVICE_UUID("dc3048cc-4347-4256-8a06-6f0af67f2132");
#define SERVICE_UUID "dc3048cc-4347-4256-8a06-6f0af67f2132"
#define ENCODER_CHARACTERISTIC_UUID "08a90be8-81a3-4527-911d-38162f772296"
#define CONTROL_CHARACTERISTIC_UUID "2139c448-0991-423d-8153-30b115faeca0"
#define SAMPLES_PER_PACKET 5
struct EncoderSample {
    uint16_t idx;
    uint16_t vel_q;
};

void initBLE();
#endif