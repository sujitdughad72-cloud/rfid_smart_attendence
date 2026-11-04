export function getESP32ArduinoCode(databaseUrl: string = 'https://smart-rfid-attendance-default-rtdb.firebaseio.com', apiKey: string = 'AIzaSyExampleKey_ReplaceWithYours'): string {
  return `/*
 * ==================================================================================
 * SMART RFID ATTENDANCE SYSTEM - ESP32 + RC522 + FIREBASE REALTIME DATABASE
 * ==================================================================================
 * Hardware:
 *   - ESP32 Development Board (30 or 38 pins)
 *   - MFRC522 RFID Reader (SPI Mode)
 *   - Active Buzzer (Pin 4) & Status LED (Pin 2)
 *
 * RC522 SPI Pinout for ESP32:
 *   RC522 Pin  ->  ESP32 Pin
 *   -----------------------
 *   SDA (SS)   ->  GPIO 5
 *   SCK        ->  GPIO 18
 *   MOSI       ->  GPIO 23
 *   MISO       ->  GPIO 19
 *   IRQ        ->  Not Connected
 *   GND        ->  GND
 *   RST        ->  GPIO 22
 *   3.3V       ->  3.3V (WARNING: DO NOT CONNECT TO 5V)
 * ==================================================================================
 */

#include <WiFi.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Firebase_ESP_Client.h>
#include <time.h>

// Provide the RTDB payload printing helper and helpers
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// 1. WiFi Credentials
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// 2. Firebase Realtime Database Credentials
#define API_KEY "${apiKey}"
#define DATABASE_URL "${databaseUrl}"

// 3. Hardware Pin Definitions
#define SS_PIN  5
#define RST_PIN 22
#define BUZZER_PIN 4
#define LED_PIN 2

// 4. NTP Server Settings for accurate timestamping
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 19800;    // IST (UTC + 5:30) - adjust to your timezone
const int   daylightOffset_sec = 0;

MFRC522 mfrc522(SS_PIN, RST_PIN);
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Registered Card Directory (Can also be queried dynamically from Firebase)
struct StudentCard {
  const char* uid;
  const char* name;
};

StudentCard registeredCards[] = {
  {"16042907", "Raj"},
  {"13F97330", "Sai"},
  {"3ED4D106", "Pranav"}
};
const int TOTAL_REGISTERED = 3;

String lastScannedUID = "";
unsigned long lastScanTime = 0;
const unsigned long DEBOUNCE_DELAY = 4000; // 4 seconds delay between same card taps

String getFormattedTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return String(millis());
  }
  char timeStringBuff[50];
  strftime(timeStringBuff, sizeof(timeStringBuff), "%Y-%m-%dT%H:%M:%S", &timeinfo);
  return String(timeStringBuff);
}

void triggerFeedback(bool isSuccess) {
  if (isSuccess) {
    digitalWrite(LED_PIN, HIGH);
    tone(BUZZER_PIN, 2400, 120);
    delay(120);
    digitalWrite(LED_PIN, LOW);
  } else {
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_PIN, HIGH);
      tone(BUZZER_PIN, 500, 100);
      delay(120);
      digitalWrite(LED_PIN, LOW);
      delay(80);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  // Initialize SPI & RC522
  SPI.begin();
  mfrc522.PCD_Init();
  delay(10);
  mfrc522.PCD_DumpVersionToSerial();

  // Connect to WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected! IP: " + WiFi.localIP().toString());

  // Initialize NTP time
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  // Configure Firebase Client
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // Sign up as anonymous user or legacy token
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase Auth Successful");
  } else {
    Serial.printf("Firebase Sign up error: %s\\n", config.signer.signupError.message.c_str());
  }

  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println(">> SMART RFID SYSTEM READY. Scan RFID card...");
  triggerFeedback(true);
}

void loop() {
  // Check for new card
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  // Read UID bytes into Hex String
  String cardUID = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) cardUID += "0";
    cardUID += String(mfrc522.uid.uidByte[i], HEX);
  }
  cardUID.toUpperCase();

  Serial.println("\\n[RFID DETECTED] UID: " + cardUID);

  // Debounce check
  if (cardUID == lastScannedUID && (millis() - lastScanTime < DEBOUNCE_DELAY)) {
    Serial.println(">> Duplicate scan ignored (Debounce active)");
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    return;
  }

  lastScannedUID = cardUID;
  lastScanTime = millis();

  // Match registered student
  String studentName = "Unknown Student";
  bool isKnown = false;
  for (int i = 0; i < TOTAL_REGISTERED; i++) {
    if (cardUID == registeredCards[i].uid) {
      studentName = registeredCards[i].name;
      isKnown = true;
      break;
    }
  }

  Serial.println("Student: " + studentName);
  triggerFeedback(isKnown);

  // Send to Firebase Realtime Database
  if (Firebase.ready()) {
    FirebaseJson json;
    json.set("UID", cardUID);
    json.set("Student Name", studentName);
    json.set("Status", "Present");
    json.set("Timestamp", getFormattedTimestamp());
    json.set("deviceId", "ESP32_RC522_GATE_01");
    json.set("verifiedVia", "RFID_RC522");

    Serial.println("Pushing record to Firebase RTDB (/attendance)...");
    if (Firebase.RTDB.pushJSON(&fbdo, "/attendance", &json)) {
      Serial.println(">> Attendance successfully recorded! Firebase Path: " + fbdo.dataPath());
    } else {
      Serial.println(">> Firebase push failed: " + fbdo.errorReason());
    }
  }

  // Halt card communication
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}
`;
}
