---
title: Specifications
sidebar:
  label: Overview
  order: 0
original_url: https://www.reverse.bike/specifications
header: _images/1b447656108a16e1bb78d3b73731dcb6974e0231fe829677d6a92e753773ed59.jpg
---

### Ride Modes

Both EU and US modes work on all bikes.

| ID | NAME | EU/US | Max assist | Max power | Throttle | Description |
| --- | --- | --- | --- | --- | --- | --- |
| 0x00 | CLASS1 | US | 32.2km/h | 750W | NO |  |
| 0x01 | CLASS2 | US | 32.2km/h | 750W | YES |  |
| 0x02 | CLASS3 | US | 45km/h | 750W | NO |  |
| 0x03 | OFF\_ROAD | US | MAX | MAX | YES |  |
| 0x04 | EPAC | EU | 25km/h | 250W | NO | EU default |
| 0x05 | 250W | EU | 35km/h | 250W | NO |  |
| 0x06 | 850W | EU | 45km/h | 850W | NO |  |
| 0x07 | OFF\_ROAD | EU | MAX | MAX | YES |  |
| 0x08+ | - | - | 0km/h | 0W | NO | Unimplemented |

### PAS / Pedal Assist Levels

| ID | NAME | Assist level | Description |
| --- | --- | --- | --- |
| 0x00 | PAS0 | 0% |  |
| 0x01 | PAS1 | 25% |  |
| 0x02 | PAS2 | 50% |  |
| 0x03 | PAS3 | 75% |  |
| 0x04 | PAS4 | 100% |  |
| 0x05+ | - | 0% | Unimplemented |

### Time out

The bike will turn off after ~16 minutes of inactivity.

Counted as activity:

* Throttle input (if enabled)

Not counted as activity:

* Light toggle
* PAS level change
* Wheel spin (1s @ 1km/h)
* Pedal spin (no PAS, < 20km/h)
