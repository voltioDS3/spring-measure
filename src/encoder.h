#ifndef ENCODER_H
#define ENCODER_H
#include "main.h"
#include "driver/timer.h"

#define TIMER_DIVIDER         80          // 80 MHz / 80 = 1 MHz (1 tick = 1 µs)
#define TIMER_INTERVAL_US     200000      // 200 ms = 200,000 µs
#define TIMER_GROUP           TIMER_GROUP_0
#define TIMER_INDEX           TIMER_0

#define ENCODER_PIN 19
#define ENCODER_N 18
#define ANGLE_PER_TRIGGER ENCODER_N/360
#define ENCODER_R 0.047
void INT0_ISR(void);
void initEncoder();
void IRAM_ATTR timerInterrupt();
float getLinearVelocity();
#endif