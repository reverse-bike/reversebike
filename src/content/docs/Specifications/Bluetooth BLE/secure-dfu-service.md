---
title: Secure DFU Service
original_url: https://www.reverse.bike/specifications/bluetooth-ble/secure-dfu-service
header: _images/7410d34f5886f37c917f30f80b870ee60ec6feca162a11d5b28bd790ca2227b9.png
---

[Characteristics](#characteristics)

[Usecase](#usecase)

Service UUID: 0000fe59-0000-1000-8000-00805f9b34fb

## Characteristics

| Name | UUID | Description | Read | Write | Notify | Indicate |
| --- | --- | --- | --- | --- | --- | --- |
| UUID\_SECURE\_DFU\_BUTTONLESS\_DFU\_CHARACTERISTIC | 8ec90003-f315-4f60-9fb8-838830daea50 | Buttonless DFU (1) | N | Y | N | Y |

(1) DFU Control Point characteristic or Buttonless DFU, see: https://nordicsemiconductor.github.io/Nordic-Thingy52-FW/documentation/firmware_architecture.html#arch_battery

## Usecase

Service used for firmware updates? Also mentioned as: "Custom UUID of Nordic Semiconductor ASA" and "Secure DFU service"
