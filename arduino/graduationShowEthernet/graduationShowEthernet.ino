#include <SPI.h>
#include <Ethernet.h>

const int lightsPin = 9;

const int pedalButtonPin = 7;
int pedalButtonState;
int lastPedalButtonState = LOW;
unsigned long lastPedalDebounceTime = 0;

const int powerButtonPin = 8;
int powerButtonState;
int lastPowerButtonState = LOW;
unsigned long lastPowerDebounceTime = 0;

unsigned long debounceDelay = 50;

static byte g_abyMyMacAddress[] = {0xA8,0x61,0x0A,0xAE,0x6F,0x0D};
static IPAddress g_MyIPAddress(192,168,15,44);
static byte g_TargetMacAddress[] = {0x30,0x24,0xA9,0x88,0x29,0xEE};

EthernetUDP powerUdp;
EthernetUDP communicationUdp;
int incomingByte = 0;

void setup() {
  Ethernet.begin(g_abyMyMacAddress, g_MyIPAddress);
  powerUdp.begin(8888);
  communicationUdp.begin(8889);
  
  Serial.begin(9600);
  Serial.println("listening for button input");
  pinMode(pedalButtonPin, INPUT);
  pinMode(powerButtonPin, INPUT);
  pinMode(lightsPin, OUTPUT);
}

void loop() {
  while (Serial.available() > 0) {
    incomingByte = Serial.read();
    if (incomingByte == 97) {
      digitalWrite(lightsPin, HIGH);
    } else if (incomingByte == 98) {
      digitalWrite(lightsPin, LOW);
    }
  }
  // buttons
  int reading;
  reading = digitalRead(powerButtonPin);
  bool powerButtonWasPushed = false;

  if (reading != lastPowerButtonState) {
    lastPowerDebounceTime = millis();
  }

  if ((millis() - lastPowerDebounceTime) > debounceDelay) {
    if (reading != powerButtonState) {
      powerButtonState = reading;
      if (powerButtonState == HIGH) {
        powerButtonWasPushed = true;
      }
    }
  }

  // save the reading. Next time through the loop, it'll be the lastPowerButtonState:
  lastPowerButtonState = reading;

  reading = digitalRead(pedalButtonPin);
  bool pedalButtonWasPushed = false;

  if (reading != lastPedalButtonState) {
    lastPedalDebounceTime = millis();
  }

  if ((millis() - lastPedalDebounceTime) > debounceDelay) {
    if (reading != pedalButtonState) {
      pedalButtonState = reading;
      if (pedalButtonState == HIGH) {
        pedalButtonWasPushed = true;
      }
    }
  }

  // save the reading. Next time through the loop, it'll be the lastPedalButtonState:
  lastPedalButtonState = reading;

  if (powerButtonWasPushed) {
    Serial.println("power button");
    SendWOLMagicPacket(g_TargetMacAddress);
  }

  if (pedalButtonWasPushed) {
    Serial.println("pedal button");
    SendPedalMessage(g_TargetMacAddress);
  }
}

void SendPedalMessage(byte * pMacAddress)
{
  byte abyTargetIPAddress[] = { 255, 255, 255, 255 };
  const int nWOLPort = 7;

  byte packet[] = { 1 };

  communicationUdp.beginPacket(abyTargetIPAddress, nWOLPort);
  communicationUdp.write(packet, sizeof packet);
  communicationUdp.endPacket();
}

void SendWOLMagicPacket(byte * pMacAddress)
{
  byte abyTargetIPAddress[] = { 255, 255, 255, 255 }; // don't seem to need a real ip address.
  const int nWOLPort = 7;

  byte magicPacket[102];
  int i,c1,j=0;
             
  for(i = 0; i < 6; i++,j++){
      magicPacket[j] = 0xFF;
  }
  for(i = 0; i < 16; i++){
      for( c1 = 0; c1 < 6; c1++,j++)
        magicPacket[j] = pMacAddress[c1];
  }
  
  powerUdp.beginPacket(abyTargetIPAddress, nWOLPort);
  powerUdp.write(magicPacket, sizeof magicPacket);
  powerUdp.endPacket();
}
