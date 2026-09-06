---
title: Generic Access Service
original_url: https://www.reverse.bike/specifications/bluetooth-ble/generic-access-service
header: _images/7410d34f5886f37c917f30f80b870ee60ec6feca162a11d5b28bd790ca2227b9.png
---

Service UUID: 00001800-0000-1000-8000-00805f9b34fb

## Characteristics

| Name | UUID | Description | Read | Write | Notify | Indicate |
| --- | --- | --- | --- | --- | --- | --- |
| UUID\_GENERIC\_ACCESS\_NAME\_CHARACTERISTIC | 00002a00-0000-1000-8000-00805f9b34fb | Gets device name [string] | Y | N | N | N |
| UUID\_GENERIC\_ACCESS\_APPEARANCE\_CHARACTERISTIC | 00002a01-0000-1000-8000-00805f9b34fb | A generic category: "Cycling" | Y | N | N | N |
| UUID\_GENERIC\_ACCESS\_PPCP\_CHARACTERISTIC | 00002a04-0000-1000-8000-00805f9b34fb | Peripheral Preferred Connection Parameters | Y | N | N | N |
| UUID\_GENERIC\_ACCESS\_CAR\_CHARACTERISTIC | 00002aa6-0000-1000-8000-00805f9b34fb | Central Address Resolution: "Supported" | Y | N | N | N |

## Usecase

The generic access service is used to retrieve basic BLE device information.
