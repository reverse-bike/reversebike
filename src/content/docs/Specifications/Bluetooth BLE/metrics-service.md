---
title: Metrics Service
original_url: https://www.reverse.bike/specifications/bluetooth-ble/metrics-service
header: _images/7410d34f5886f37c917f30f80b870ee60ec6feca162a11d5b28bd790ca2227b9.png
---

[Characteristics](#characteristics)

[Usecase](#usecase)

[Known register & notification IDs](#known-register--notification-ids)

[Known register-only IDs](#known-register-only-ids)

[Known writable IDs](#known-writable-ids)

Service UUID: 00001554-1212-efde-1523-785feabcd123

## Characteristics

| Name | UUID | Description | Read | Write | Notify | Indicate |
| --- | --- | --- | --- | --- | --- | --- |
| UUID\_CHARACTERISTIC\_REGISTER\_ID | 00001564-1212-efde-1523-785feabcd123 | Register a notification id for reading | Y | Y | N | N |
| UUID\_CHARACTERISTIC\_REGISTER | 0000155f-1212-efde-1523-785feabcd123 | Read last registered notification | Y | Y | N | N |
| UUID\_CHARACTERISTIC\_REGISTER\_NOTIFIER | 0000155e-1212-efde-1523-785feabcd123 | Subscribe to all notifications | Y | N | Y | N |

## Usecase

The metrics service is used to retrieve data about the bike and be notified when the data changes.

Subscribe to ```UUID_CHARACTERISTIC_REGISTER_NOTIFIER``` to receive notifications when values change.

Write a 2-byte identifier to ```UUID_CHARACTERISTIC_REGISTER_ID``` and then read ```UUID_CHARACTERISTIC_REGISTER``` to get the data at any time.

Values can be changed by writing to ```UUID_CHARACTERISTIC_REGISTER```.

## Known register & notification IDs

| Name | ID 0 | ID 1 | Data 2 | Data 3 | Data 4 | Data 5 | Data 6 | Data 7 | Data 8 | Data 9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MOTION | 0x02 | 0x01 | **WSPEED** | **WSPEED** | 0x00 | 0x00 | 0x00 | 0x00 | 0x00 | 0x00 |
| TOTAL | 0x02 | 0x02 | 0x00 | 0x4E (1) | 0x00 | 0x00 | **TOTAL** | **TOTAL** | 0x00 | 0x00 |
| RIDE | 0x02 | 0x03 | Unknown (2) | **CADENCE** | Unknown | Unknown | Unknown | 0x00 | **RANGE** | 0x00 |
| SETTINGS | 0x03 | 0x00 | **ASSIST** | **WALK** | **LIGHT** | **MODE** | 0x00 | 0x00 | 0x00 | 0x00 |
| POWER | 0x04 | 0x01 | Unknown | 0x00 | 0x00 | **CAMP** | **CAMP** | 0x00 | 0x00 | 0x00 |
| MYSTERY | 0x00 | 0x00 | **LIGHT** | **ASSIST** | **MODE** | 0x00 | 0x00 | 0x00 | 0x00 | 0x00 |

* WSPEED : UInt16, wheel speed (km/h) ~= ```WSPEED / 100```
* CADENCE : UInt8, pedal RPM ~=  ```5 \* PSPEED```
* TOTAL : UInt16, total (km) ~= ```TOTAL / 10```
* ASSIST : pedal assist level (0-4)
* WALK : walk (push along) assist (0/90?)
* LIGHT : headlight on (1/0)
* MODE : riding power mode (0-7)
* RANGE : remaining range from battery in km
* CAMP : UInt16, charging current (A) ~= ```CAMP / 1000```

(1) Flickers between 0x4E and 0x4D when motor is running

 (2) Seems related to pedalling torque

## Known register-only IDs

These were found by brute-force registering ids (0x00 0x00 to 0x09 0x09).

Only the following ones returned a corresponding register.

| Name | ID 0 | ID 1 | Data 2 | Data 3 | Data 4 | Data 5 | Data 6 | Data 7 | Data 8 | Data 9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Unknown | 0x00 | 0x01 | 0x00 | 0x00 | 0x00 | 0x00 | 0x00 | 0x00 | 0x00 | 0x00 |
|  | ... | ... |  |  |  |  |  |  |  |  |
| Unknown | 0x00 | 0x06 | 0x00 | 0x00 | 0x00 | 0x00 | 0x00 | 0x00 | 0x00 | 0x00 |

## Known writable IDs

New writable IDs were found brute-force writing ```UUID_CHARACTERISTIC_REGISTER``` with IDs (0x00 0x00 to 0x00 0xFF) and all data bytes at 0x00. Listed IDs produce a 3-0 notification when written:

| Name | ID 0 | ID 1 | Data 2 | Data 3 | Data 4 | Data 5 | Data 6 | Data 7 | Data 8 | Data 9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SETTINGS WRITE | 0x00 | 0xD1 | **LIGHT** | **ASSIST** | **MODE** | ignored | ignored | ignored | ignored | ignored |
| Unknown | 0x00 | 0x13 | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown |
| Unknown | 0x00 | 0x26 | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown |
| Unknown | 0x00 | 0x3A | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown |
| Unknown | 0x00 | 0x4C | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown |
| Unknown | 0x00 | 0x5F | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown |
| Unknown | 0x00 | 0x73 | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown |
| Unknown | 0x00 | 0x86 | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown |
| Unknown | 0x00 | 0x99 | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown |
| Unknown | 0x00 | 0xAC | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown |
| Unknown | 0x00 | 0xBF | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown |
| Unknown | 0x00 | 0xE4 | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown |
| Unknown | 0x00 | 0xF7 | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown |
