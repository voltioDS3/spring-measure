#include "encoder.h"
int encoder_count = 0;

void initEncoder(){
    pinMode(ENCODER_PIN,INPUT);
    attachInterrupt(digitalPinToInterrupt(ENCODER_PIN), INT0_ISR, RISING);
}

void INT0_ISR(void){
    encoder_count ++;
    #ifdef DEBUG
        Serial.println("interrupt");
    #endif
}