#include "encoder.h"
int encoder_count = 0;
volatile unsigned long last_time = 0;
volatile float angular_velocity = 0;
hw_timer_t *timer = NULL;
void initEncoder(){
    pinMode(ENCODER_PIN,INPUT);
    attachInterrupt(digitalPinToInterrupt(ENCODER_PIN), INT0_ISR, RISING);
    timer = timerBegin(TIMER_INDEX, TIMER_DIVIDER, true);
    timerAttachInterrupt(timer, &timerInterrupt, true);
    timerAlarmWrite(timer,TIMER_INTERVAL_US, true);
    timerAlarmEnable(timer);
}

void INT0_ISR(void){
    unsigned long  current_time = micros();
    unsigned long dt = current_time - last_time;
    last_time = current_time;
    if(dt > 0){
        angular_velocity = (2*PI /ENCODER_N)/(dt/1e6);
    }
    encoder_count ++;

}

void IRAM_ATTR timerInterrupt(){

    if (micros() -last_time > TIMER_INTERVAL_US){
        angular_velocity = 0;
    }
}


float getLinearVelocity(){
    return angular_velocity*ENCODER_R;
}

float getLinearDistance(){
    return encoder_count * (2*PI/ENCODER_N) * ENCODER_R;
}