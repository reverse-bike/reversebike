---
title: Device Info Service
original_url: https://www.reverse.bike/specifications/bluetooth-ble/device-info-service
header: _images/7410d34f5886f37c917f30f80b870ee60ec6feca162a11d5b28bd790ca2227b9.png
---

Service UUID: 0000180a-0000-1000-8000-00805f9b34fb

## Characteristics

| Name | UUID | Description | Read | Write | Notify | Indicate |
| --- | --- | --- | --- | --- | --- | --- |
| UUID\_DEVICE\_INFO\_MANUFACTURER\_CHARACTERISTIC | 00002a29-0000-1000-8000-00805f9b34fb | Gets device manufacturer name [string] | Y | N | N | N |
| UUID\_DEVICE\_INFO\_HARDWARE\_CHARACTERISTIC | 00002a27-0000-1000-8000-00805f9b34fb | Hardware Revision [string] | Y | N | N | N |
| UUID\_DEVICE\_INFO\_FIRMWARE\_CHARACTERISTIC | 00002a26-0000-1000-8000-00805f9b34fb | Firmware Revision [string] | Y | N | N | N |
| UUID\_DEVICE\_INFO\_SOFTWARE\_CHARACTERISTIC | 00002a28-0000-1000-8000-00805f9b34fb | Software Revision [string] | Y | N | N | N |

## Usecase

The device info service provides information about the manufacturer and revisions.
