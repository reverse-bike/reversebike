---
title: Security Service
original_url: https://www.reverse.bike/specifications/bluetooth-ble/security-service
header: _images/7410d34f5886f37c917f30f80b870ee60ec6feca162a11d5b28bd790ca2227b9.png
---

[Characteristics](#characteristics)

[Usecase](#usecase)

Service UUID: 00002554-1212-efde-1523-785feabcd123

## Characteristics

| Name | UUID | Description | Read | Write | Notify | Indicate |
| --- | --- | --- | --- | --- | --- | --- |
| UUID\_SECURITY\_PRIVATE\_KEY\_CHARACTERISTIC | 00002555-1212-efde-1523-785feabcd123 | Private key | N | Y | N | N |
| UUID\_SECURITY\_PUBLIC\_KEY\_CHARACTERISTIC | 00002556-1212-efde-1523-785feabcd123 | Public key [20 bytes] | Y | N | N | N |
| UUID\_SECURITY\_HASH\_CHARACTERISTIC | 00002557-1212-efde-1523-785feabcd123 | Security hash | N | Y | N | N |
| UUID\_SECURITY\_AUTH\_CHARACTERISTIC | 00002558-1212-efde-1523-785feabcd123 | Auth | Y | N | N | N |

## Usecase

Device authenticity?
