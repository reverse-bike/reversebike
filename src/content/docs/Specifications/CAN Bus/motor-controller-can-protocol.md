---
title: Motor Controller CAN Bus Protocol
---

This document describes the CAN bus protocol used by the S73Rx e-bike motor controller firmware. Data was gathered from a static analysis of the motor controller firmware dump version `230/310 US`.

## Overview

| Property | Value |
|----------|-------|
| Bus Speed | 250 kbps |
| Base Peripheral | CAN0 (0x40006400) |
| Message Format | Standard 11-bit ID |
| Max Data Length | 8 bytes |
| NVIC Priority | 0x14 (20), Subpriority 4 |

## CAN Hardware Configuration

### GPIO Pins (GPIOA)
| Pin | Function | Mode |
|-----|----------|------|
| PA11 | CAN_RX | Input, Pull-up |
| PA12 | CAN_TX | Alternate Function, Push-Pull |

### Bit Timing (250 kbps)
| Parameter | Value |
|-----------|-------|
| Prescaler | 12 |
| SJW | 1 TQ |
| BS1 | 7 TQ |
| BS2 | 2 TQ |
| Total | 10 TQ @ 72MHz = 250kbps |

### Filter Configuration
| Parameter | Value |
|-----------|-------|
| Filter Bank | 6 |
| Mode | Mask |
| Scale | 32-bit |
| ID Filter | 0x0000 |
| ID Mask | 0x0000 (accept all) |
| FIFO | 0 |

---

## Message Timing

The CAN TX handler (`CAN_PeriodicTX_Handler` @ 0x8007AFC) runs on a 10ms tick with a counter cycling 0-59:

| Counter Value | Message(s) Sent | Effective Rate |
|---------------|-----------------|----------------|
| Every tick | 0x203 (Power) | 10ms (100 Hz) |
| Even ticks (LSB=0) | 0x201 (Speed), 0x64A (Status) | 20ms (50 Hz) |
| 7 | 0x266 (Heartbeat) | 600ms (~1.7 Hz) |
| 22 | 0x202 (Temp/Params) | 600ms |
| 42 | 0x202 (Temp/Params) | 600ms |

**Note**: 0x222 (Motor Telemetry) is sent on-demand in response to 0x300 RX messages.

---

## Transmit Messages (Motor Controller -> Display/BMS)

### 0x200 - Throttle Echo
Echoes received throttle and cadence data back to the bus.

**DLC**: 8 bytes
**Rate**: On-demand
**Function**: `CAN_SendMsg0x200` @ 0x8007B98

| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 0 | throttle | uint8 | Echo of `g_throttle_value` |
| 1 | mode_byte | uint8 | Echo of `g_can_403_byte` |
| 2-5 | cadence | uint32_le | Echo of `g_pedal_cadence` |
| 6-7 | sequence | uint16 | Rotating sequence from lookup table |

---

### 0x201 - Speed Telemetry
Current speed and motor status flags.

**DLC**: 5 bytes
**Rate**: 50 Hz (20ms)
**Function**: `CAN_TX_0x201_Speed` @ 0x8007C04

| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 0-1 | speed | uint16_le | `g_speed_value * 10` (0.1 unit resolution) |
| 2-3 | reserved | uint16 | Always 0 |
| 4 | status | uint8 | Status bitfield (see below) |

**Status Byte (byte 4) Bitfield**:
| Bit | Mask | Field | Description |
|-----|------|-------|-------------|
| 0 | 0x01 | light_mode_6 | Set if `g_can_rx_tail_byte == 6` |
| 1 | 0x02 | motor_enabled | Set if `g_status_flags & 0x08` |
| 2 | 0x04 | brake_active | Set if `g_brake_active != 0` |
| 5-7 | 0xE0 | motor_mode | `g_motor_mode << 5` |

---

### 0x202 - Temperature and Parameters
Motor temperature and EEPROM calibration parameters.

**DLC**: 8 bytes
**Rate**: ~3.3 Hz (every 200ms at counter 22 and 42)
**Function**: `CAN_TX_0x202_TempParams` @ 0x8007CA4

| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 0 | fixed | uint8 | Always 0x22 |
| 1 | temperature | uint8 | `temp_celsius + 40` (0 if temp < -40) |
| 2-3 | param_d7 | uint16_le | Wheel speed factor from EEPROM |
| 4-7 | param_d8 | uint32_le | Distance factor from EEPROM |

**Temperature Encoding**: Offset by +40 to allow negative temperatures.
- 0x00 = -40°C or below
- 0x28 = 0°C
- 0x50 = 40°C
- 0x6E = 70°C

---

### 0x203 - Power Telemetry
Motor RPM and calculated power consumption.

**DLC**: 8 bytes
**Rate**: 100 Hz (10ms)
**Function**: `CAN_TX_0x203_Power` @ 0x8007CF0

| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 0-1 | rpm | uint16_le | `g_motor_rpm * 40` |
| 2-5 | power | uint32_le | `voltage * |current| / 1000 * 40` (mW * 40) |
| 6-7 | misc | uint16_le | Data from 0x200001A2 (low nibble only for byte 7) |

**Scaling**:
- RPM: Divide received value by 40 to get actual RPM
- Power: Divide received value by 40 to get milliwatts

---

### 0x204 - Temperature and Mode
Alternate temperature message with motor mode.

**DLC**: 8 bytes
**Rate**: On-demand
**Function**: `CAN_SendMsg0x204` @ 0x8007D68

| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 0 | temperature | uint8 | `temp_celsius + 40` (0 if temp < -40) |
| 1 | reserved | uint8 | Always 0 |
| 2 | motor_mode | uint8 | Current motor operating mode |
| 3-7 | reserved | - | All zeros |

---

### 0x210/0x211/0x212 - Serial Number Response
Response to serial number/device ID requests. Controller echoes the same ID.

**DLC**: 8 bytes (0x210, 0x211) or 4 bytes (0x212)
**Rate**: On RX of same ID
**Function**: `CAN_MessageDispatcher` @ 0x8009178

#### 0x210 Response
| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 0-5 | serial | char[6] | Serial number characters 0-5 |
| 6-7 | odo_hex | char[2] | Odometer 10000km digit as hex ASCII |

#### 0x211 Response
| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 0-1 | odo_100km | char[2] | 100km digit as hex ASCII |
| 2-3 | odo_10m | char[2] | 10m digit as hex ASCII |
| 4-7 | odo_combined | char[4] | Combined odometer as hex ASCII |

#### 0x212 Response
| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 0 | device_id | uint8 | Device identifier |
| 1 | device_info_1 | uint8 | Device info byte 1 |
| 2 | device_info_2 | uint8 | Device info byte 2 |
| 3 | device_info_3 | uint8 | Device info byte 3 |

---

### 0x222 - Motor Telemetry (Multi-Mode)
Variable-format telemetry message with mode selected by caller argument.

**DLC**: 8 bytes
**Rate**: On-demand (triggered by 0x300 RX)
**Function**: `CAN_TX_0x222_MotorTelemetry` @ 0x800795C

#### Mode 0 - Current/Target Limits
| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 0-1 | current_limit | uint16_le | `current_limit * 8 * 0x93 / 10 / 100` |
| 2-3 | target_speed | uint16_le | `target_speed * 8 * 0x93 / 10 / 100` |
| 4-5 | wheel_circ | int16_le | Wheel circumference (negative if < 0) |
| 6 | config | uint8 | Configuration byte |
| 7 | data_byte | uint8 | Data byte from 0x20000000 |

#### Mode 1 - Speed Setpoints
| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 0-1 | speed_setpoint | uint16_le | Scaled speed setpoint |
| 2-3 | max_speed | uint16_le | Scaled maximum speed |
| 4-5 | wheel_circ | int16_le | Wheel circumference |
| 6 | config | uint8 | Configuration byte |
| 7 | data_byte | uint8 | Data byte |

#### Mode 2 - Motor Output
| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 0-1 | data_3a | uint16_le | Data from 0x2000003A |
| 2-3 | wheel_circ | uint16_le | Wheel circumference |
| 4-5 | motor_output | uint16_le | `|g_motor_output_negative|` |
| 6 | temperature | uint8 | `temp + 40` (0 if < -40) |
| 7 | data_byte | uint8 | Data byte |

#### Mode 3 - Raw Data Copy
| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 0-7 | raw_data | uint8[8] | Direct copy from 0x20000190-0x20000197 |

#### Mode 4 - Current Limits with Battery Voltage
| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 0-1 | current_limit | uint16_le | Scaled current limit |
| 2-3 | target_speed | uint16_le | Scaled target speed |
| 4-5 | wheel_circ | int16_le | Wheel circumference |
| 6 | battery_v | uint8 | `g_battery_voltage / 1000` (volts) |
| 7 | data_byte | uint8 | Data byte |

#### Mode 7 - Filtered Speed
| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 0-1 | speed_filtered | int16_le | Filtered speed value |
| 2-3 | wheel_circ | uint16_le | Wheel circumference |
| 4-5 | reserved | uint16 | Always 0 |
| 6 | reserved | uint8 | Always 0 |
| 7 | control_flag | uint8 | `g_control_flags & 1` |

---

### 0x265 - Error/Diagnostic Data
Error codes and diagnostic information.

**DLC**: 8 bytes
**Rate**: On-demand
**Function**: `CAN_SendMsg0x265` @ 0x8007DB4

| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 0 | reserved | uint8 | Always 0 |
| 1-4 | error_data | uint8[4] | Data from 0x20000148-0x2000014B |
| 5 | fixed | uint8 | Always 0x13 |
| 6-7 | reserved | uint16 | Always 0 |

---

### 0x266 - Heartbeat/Init Message
Periodic heartbeat with firmware identification.

**DLC**: 8 bytes
**Rate**: ~1.7 Hz (every 600ms, counter = 7)
**Function**: `CAN_TX_0x266_Init` @ 0x8007DEC

| Byte | Field | Type | Value | Description |
|------|-------|------|-------|-------------|
| 0 | reserved | uint8 | 0x00 | |
| 1 | region_code | uint8 | 0x03 (US) / 0x04 (EU) | Firmware region |
| 2 | fixed | uint8 | 0x0A | |
| 3 | reserved | uint8 | 0x00 | |
| 4 | reserved | uint8 | 0x00 | |
| 5 | fixed | uint8 | 0x20 | |
| 6 | fixed | uint8 | 0x10 | |
| 7 | fixed | uint8 | 0x22 | |

**Region Codes**:
- 0x03 = US firmware (S310US)
- 0x04 = EU firmware (S410EU)

---

### 0x5AA - Diagnostic Response
Response to diagnostic requests (0x610/0x62A/0x702).

**DLC**: 8 bytes
**Rate**: On RX of diagnostic request
**Function**: `CAN_MessageDispatcher` @ 0x8009178

| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 0 | dlc | uint8 | Always 8 |
| 1-2 | service_resp | uint16_le | `service_id + 0x40` (positive response) |
| 3 | address | uint8 | Echo of request address |
| 4 | sequence | uint8 | Echo of request sequence number |
| 5-8 | data | uint8[4] | Response data |

**Response Format by Service**:
| Service | Response Data |
|---------|---------------|
| 0x87 | Model number (0x136 = 310, 0x19A = 410), 0x68 |
| 0x88 | Odometer value (32-bit) |
| 0x90 | Device ID bytes (4 bytes) |
| 0xD6 | Echo of request data |
| 0xD7 | EEPROM param_d7 (wheel speed factor) |
| 0xD8 | EEPROM param_d8 (distance factor) |

---

### 0x64A - Status Message
System status flags and magic identifier.

**DLC**: 8 bytes
**Rate**: 50 Hz (20ms, even counter values)
**Function**: `CAN_TX_0x64A_Status` @ 0x8007B68

| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 0-3 | status_flags | uint32_le | `g_status_flags` bitmask |
| 4-7 | magic | uint32_le | Fixed value 0x002B4163 |

**Status Flags Bitmask** (`g_status_flags`):
| Bit | Mask | Flag | Description |
|-----|------|------|-------------|
| 3 | 0x0008 | MOTOR_ENABLED | Motor is enabled |
| 13 | 0x2000 | WALK_MODE | Walk assist mode active |

---

## Receive Messages (Display/BMS -> Motor Controller)

### 0x210/0x211/0x212 - Serial Number Requests
RTR-style requests for device identification.

**DLC**: Variable
**Function**: `CAN_MessageDispatcher` @ 0x8009178

**Condition**: `byte[1] == 0` (DLC field check)

Controller responds with same message ID containing serial/odometer data.

---

### 0x300 - Motor Control Command (Primary)
Main control message from display unit.

**DLC**: 12 bytes
**Function**: `CAN_MessageDispatcher` @ 0x8009178

| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 0-1 | - | - | (Message ID in buffer) |
| 2 | motor_mode | uint8 | 0-3 = normal modes, 4+ = special modes |
| 3 | enable_flags | uint8 | bit0 = motor_enable |
| 4 | assist_level | uint8 | 0-100% power assist (capped at 100) |
| 5 | speed_limit | uint8 | Speed limit value (masked 0x7F). Special: 0xA5 = set keepalive |
| 6 | - | - | Unused |
| 7 | cruise_control | uint8 | 0xA5 = enable, 0x5A = disable |
| 8-10 | - | - | Unused |
| 11 | light_mode | uint8 | Light mode (masked 0x0F) |

**Processing**:
- Resets `g_state_counter` to 0
- If `byte[5] == 0xA5`: sets keepalive timer to 60 (0x3C)
- If `byte[3] & 0x01`: sets STATUS_FLAG_ENABLED (0x0008)
- If `motor_mode < 4`: sets STATUS_FLAG_WALK_MODE (0x2000)
- If `assist_level > 100`: caps to 100

---

### 0x400 - Timeout Control
Manages communication timeout counter.

**DLC**: 12 bytes
**Function**: `CAN_MessageDispatcher` @ 0x8009178

| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 3 | timeout_dir_a | uint8 | MSB (bit 7) set = increment |
| 7 | timeout_dir_b | uint8 | MSB (bit 7) set = increment |

**Logic**:
```
if (byte[3] & 0x80) || (byte[7] & 0x80):
    g_can_timeout_counter = min(g_can_timeout_counter + 1, 20)
    g_can_timeout_flag = 1
else:
    if g_can_timeout_counter > 0:
        g_can_timeout_counter--
    if g_can_timeout_counter == 0:
        g_can_timeout_flag = 0
```

---

### 0x401 - Battery Data
Battery voltage and current from BMS.

**DLC**: 12 bytes
**Function**: `CAN_MessageDispatcher` @ 0x8009178

| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 4-7 | voltage | uint32_le | Battery voltage (raw units) |
| 8-11 | current | int32_le | Battery current (signed, raw units) |

---

### 0x402 - Throttle and Cadence
Throttle input and pedal cadence data.

**DLC**: 12 bytes
**Function**: `CAN_MessageDispatcher` @ 0x8009178

| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 2 | throttle | uint8 | Throttle position (0-255) |
| 8-11 | cadence | uint32_le | Pedal cadence value |

---

### 0x403 - Mode Byte
Simple mode selector storage.

**DLC**: 12 bytes
**Function**: `CAN_MessageDispatcher` @ 0x8009178

| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 2 | mode_byte | uint8 | Stored to `g_can_403_byte`, echoed in 0x200 TX |

---

### 0x404 - Torque Sensor Configuration
Torque sensor calibration data.

**DLC**: 12 bytes
**Function**: `CAN_MessageDispatcher` @ 0x8009178

| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 2-3 | sensor | uint16_le | Torque sensor raw value |
| 4-5 | offset | uint16_le | Torque sensor offset |
| 6-7 | gain | uint16_le | Torque sensor gain |

Sets `g_can_404_received = 1` to indicate valid torque data received.

---

### 0x610/0x62A/0x702 - Diagnostic Requests (UDS-like)
Diagnostic service requests similar to UDS protocol.

**DLC**: 12 bytes
**Function**: `CAN_MessageDispatcher` @ 0x8009178

| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 2 | sub_function | uint8 | 0x2B = write, 0x40 = read |
| 3 | address | uint8 | Sub-address (0x1F or 0x69) |
| 4 | - | - | Unused |
| 5 | service_id | uint8 | Service type (see below) |
| 6 | - | - | Unused |
| 7 | sequence | uint8 | Request sequence number |
| 8-11 | data | uint32_le | Write data (for write requests) |

**Service IDs**:

| Service | Address | Sub-Function | Description |
|---------|---------|--------------|-------------|
| 0x87 | 0x1F | 0x40 (read) | Read model number (returns 0x136/0x19A, 0x68) |
| 0x88 | 0x1F | 0x40 (read) | Read odometer |
| 0x88 | 0x1F | 0x2B (write) | Write odometer (seq=1), saves to Flash |
| 0x90 | 0x1F | 0x40 (read) | Read device ID (4 bytes) |
| 0x90 | 0x1F | 0x2B (write) | Write device ID, saves to I2C EEPROM @ 0xFC |
| 0xD6 | 0x69 | 0x2B (write) | Parameter echo |
| 0xD7 | 0x69 | 0x40 (read) | Read wheel speed factor |
| 0xD7 | 0x69 | 0x2B (write) | Write wheel speed factor (EEPROM: 0x7F, 0xA7, 0xCF) |
| 0xD8 | 0x69 | 0x40 (read) | Read distance factor |
| 0xD8 | 0x69 | 0x2B (write) | Write distance factor (EEPROM: 0x78, 0xA0, 0xC8) |

**Response**: Sent on ID 0x5AA with service_id + 0x40 for positive response.

**EEPROM Triple Redundancy**: Write operations store data at 3 different EEPROM addresses for redundancy.

---

### 0x67F - System Reset (Bootloader Entry)
Magic sequence to trigger system reset/bootloader entry.

**DLC**: 12 bytes
**Function**: `CAN_MessageDispatcher` @ 0x8009178

| Byte | Field | Type | Required Value |
|------|-------|------|----------------|
| 2-3 | magic_word | uint16_le | 0x55AA |
| 4 | magic_byte_1 | uint8 | 0x2A |
| 5 | magic_byte_2 | uint8 | 0x2A |

**Safety Check**: Only executes if:
- `g_speed_value < 5` AND
- `g_motor_rpm < 5`

If conditions met, calls `System_Reset()` which does not return.

---

### 0x777 - Wheel Configuration
Wheel circumference and configuration byte.

**DLC**: 12 bytes
**Function**: `CAN_MessageDispatcher` @ 0x8009178

| Byte | Field | Type | Description |
|------|-------|------|-------------|
| 2-3 | circumference | uint16_le | Wheel circumference in mm |
| 4 | config_byte | uint8 | Configuration flags |

Updates:
- `g_wheel_circumference` (16-bit)
- `g_wheel_circumference_32` (32-bit)
- `g_config_byte`

---

## CAN Peripheral Registers

Base address: 0x40006400 (CAN0)

| Offset | Register | Description |
|--------|----------|-------------|
| +0x000 | CAN_CTL | Control register |
| +0x004 | CAN_STAT | Status register |
| +0x008 | CAN_TSTAT | Transmit status |
| +0x00C | CAN_RFIFO0 | RX FIFO 0 status |
| +0x010 | CAN_RFIFO1 | RX FIFO 1 status |
| +0x180 | CAN_TMI0 | TX Mailbox 0 Identifier |
| +0x184 | CAN_TMP0 | TX Mailbox 0 Properties |
| +0x188 | CAN_TMDATA0_0 | TX Mailbox 0 Data Low |
| +0x18C | CAN_TMDATA0_1 | TX Mailbox 0 Data High |
| +0x1B0 | CAN_RFIFOMI0 | RX FIFO 0 Identifier |
| +0x1B4 | CAN_RFIFOMP0 | RX FIFO 0 Properties |
| +0x1B8 | CAN_RFIFOMDATA0_0 | RX FIFO 0 Data Low |
| +0x1BC | CAN_RFIFOMDATA0_1 | RX FIFO 0 Data High |

---

## Related Functions

| Address | Function | Description |
|---------|----------|-------------|
| 0x080043C4 | `CAN_Init` | Initialize CAN peripheral with filters |
| 0x08004544 | `CAN_ResetClock` | Reset CAN peripheral clock |
| 0x08004570 | `CAN_FilterInit` | Configure CAN acceptance filters |
| 0x0800463C | `CAN_SetInterruptBits` | Enable CAN interrupts |
| 0x08004734 | `CAN_Receive` | Read message from RX FIFO |
| 0x080047C4 | `CAN_InitStruct` | Initialize TX message struct |
| 0x080047E4 | `CAN_Transmit` | Send message to TX mailbox |
| 0x0800795C | `CAN_TX_0x222_MotorTelemetry` | Send motor telemetry |
| 0x08007AFC | `CAN_PeriodicTX_Handler` | Periodic TX scheduler (10ms) |
| 0x08007B68 | `CAN_TX_0x64A_Status` | Send status message |
| 0x08007B98 | `CAN_SendMsg0x200` | Send throttle echo |
| 0x08007C04 | `CAN_TX_0x201_Speed` | Send speed telemetry |
| 0x08007CA4 | `CAN_TX_0x202_TempParams` | Send temp/params |
| 0x08007CF0 | `CAN_TX_0x203_Power` | Send power telemetry |
| 0x08007D68 | `CAN_SendMsg0x204` | Send temperature/mode |
| 0x08007DB4 | `CAN_SendMsg0x265` | Send error data |
| 0x08007DEC | `CAN_TX_0x266_Init` | Send heartbeat |
| 0x08009088 | `CAN0_RX0_IRQHandler` | CAN receive interrupt |
| 0x08009110 | `CAN_SendMessage` | High-level send wrapper |
| 0x08009168 | `CAN_ProcessRxMessage` | Check and dispatch RX message |
| 0x08009178 | `CAN_MessageDispatcher` | Main message handler (switch) |

---

## Message ID Summary

### Transmit (Controller -> Bus)
| ID | Name | Rate | DLC | Description |
|----|------|------|-----|-------------|
| 0x200 | Throttle Echo | On-demand | 8 | Echo throttle/cadence data |
| 0x201 | Speed | 50 Hz | 5 | Speed and status |
| 0x202 | Temp/Params | ~3 Hz | 8 | Temperature and EEPROM params |
| 0x203 | Power | 100 Hz | 8 | RPM and power consumption |
| 0x204 | Temp/Mode | On-demand | 8 | Temperature and motor mode |
| 0x210 | Serial Resp | On-request | 8 | Serial number chars 0-5 |
| 0x211 | Odo Resp | On-request | 8 | Odometer digits |
| 0x212 | Device ID | On-request | 4 | Device ID bytes |
| 0x222 | Motor Telem | On-demand | 8 | Multi-mode telemetry |
| 0x265 | Error Data | On-demand | 8 | Error/diagnostic info |
| 0x266 | Heartbeat | ~1.7 Hz | 8 | Init/heartbeat message |
| 0x5AA | Diag Resp | On-request | 8 | UDS-like response |
| 0x64A | Status | 50 Hz | 8 | Status flags |

### Receive (Bus -> Controller)
| ID | Name | Description |
|----|------|-------------|
| 0x210 | Serial Req | Request serial number |
| 0x211 | Odo Req | Request odometer |
| 0x212 | Device Req | Request device ID |
| 0x300 | Motor Cmd | Motor control command |
| 0x400 | Timeout | Timeout counter control |
| 0x401 | Battery | Battery voltage/current |
| 0x402 | Throttle | Throttle and cadence |
| 0x403 | Mode | Mode byte storage |
| 0x404 | Torque | Torque sensor config |
| 0x610 | Diag Req | Diagnostic request |
| 0x62A | Diag Req | Diagnostic request (alt) |
| 0x67F | Reset | System reset trigger |
| 0x702 | Diag Req | Diagnostic request (alt) |
| 0x777 | Wheel Config | Wheel circumference |

---

## Internal RX Buffer Layout

The CAN RX buffer (`g_can_rx_buffer` @ 0x200004A8) stores received messages:

| Offset | Field | Size | Description |
|--------|-------|------|-------------|
| +0x00 | msg_id | 2 | Message ID |
| +0x02 | byte[2] | 1 | Data byte 2 |
| +0x03 | byte[3] | 1 | Data byte 3 |
| +0x04 | byte[4] | 2 | Data bytes 4-5 |
| +0x06 | byte[6] | 1 | Data byte 6 |
| +0x07 | byte[7] | 1 | Data byte 7 |
| +0x08 | byte[8] | 4 | Data bytes 8-11 |
| +0x0B | byte[11] | 1 | Data byte 11 (tail) |

**Note**: Buffer layout matches the dispatcher's access patterns.
