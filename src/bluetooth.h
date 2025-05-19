#ifndef BLUETOOTH_H
#define BLUETOOTH_H
#include "main.h"

#define SERVICE_UUID "dc3048cc-4347-4256-8a06-6f0af67f2132"
#define CHARACTERISTIC_UUID "099a8591-df27-4f7d-8634-233c5b5b5075"
#define ENCODER_CHARACTERISTIC_UUID "08a90be8-81a3-4527-911d-38162f772296"

#define SAMPLES_PER_PACKET 5
struct EncoderSample {
    uint16_t idx;
    uint16_t vel_q;
};

void initBLE();
#endif