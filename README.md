# ina226

[![NPM version](https://img.shields.io/npm/v/ina226.svg)](https://www.npmjs.com/package/ina226)
[![Downloads](https://img.shields.io/npm/dm/ina226.svg)](https://www.npmjs.com/package/ina226)

[![NPM](https://nodei.co/npm/ina226.png?downloads=true)](https://nodei.co/npm/ina226/)

Node.js module to read values from the INA226 bi-directional current and power monitor.

For more information about the INA226 please consult the [data sheet from Texas Instruments](http://www.ti.com/lit/ds/symlink/ina226.pdf).

## Features

* Read shunt and bus voltages.
* Calculate current and power.
* Read the value from a register.
* Write a value to a register.

## Installation

Make sure you are using Node.js v8.x or higher. Current Node.js version is recommended.

```sh
npm install ina226
```

This module is written in TypeScript and typings are included.

## Example

Note that you need to construct the [i2c-bus](https://npmjs.org/package/i2c-bus) object and pass it in to the INA226 class.

The example blow can be found in the [examples directory](https://github.com/crycode-de/node-ina226/tree/main/examples) of this package together with a TypeScript example.

```js
// Require the ina226 module
const {
  CONFIG_AVERAGING,
  CONFIG_CONVERSION_TIME,
  CONFIG_MODE,
  CONFIGURATION_REGISTER,
  INA226,
} = require('../'); // = require('ina226');

// Require the i2c-bus module and open the bus
const i2cBus = require('i2c-bus').openSync(1);

// Define the address of the INA226 and the shunt resistance value
const addr = 0x40;
const rShunt = 0.1;

/**
 * Main function to demonstrate the INA226 usage in an async context.
 */
async function main () {
  // Init a new INA226
  const ina = new INA226(i2cBus, addr, rShunt);

  // Write to the Configuration Register (0x4527 in this example)
  const configValue =
    (0b0100 << 12) // Bits 15 - 12, Reset 0 and rest is unused constant
    | (CONFIG_AVERAGING.AVG16 << 9) // Bits 11 - 9, Averaging
    | (CONFIG_CONVERSION_TIME.CT_1_1ms << 6) // Bits 8 - 6, Bus Voltage Conversion Time
    | (CONFIG_CONVERSION_TIME.CT_1_1ms << 3) // Bits 5 - 3, Shunt Voltage Conversion Time
    | (CONFIG_MODE.SHUNT_AND_BUS_VOLTAGE_CONTINUOUS << 0); // Bits 2 - 0, Operating Mode
  await ina.writeRegister(CONFIGURATION_REGISTER, configValue);
  console.log('Configuration written');

  // Read the actual bus voltage
  const busVoltage = await ina.readBusVoltage();
  console.log(`Bus Voltage: ${busVoltage.toFixed(2)}V`);

  // Read the actual shunt voltage
  const shuntVoltage = await ina.readShuntVoltage();
  console.log(`Shunt Voltage: ${shuntVoltage.toFixed(5)}V`);

  // Read the actual shunt voltage and calculate the current
  await ina.readShuntVoltage();
  const current = ina.calcCurrent();
  console.log(`Current: ${current.toFixed(2)}A`);

  // Read the actual shunt and bus voltages and calculate the power
  await ina.readShuntVoltage();
  await ina.readBusVoltage();
  const power = ina.calcPower();
  console.log(`Power: ${power.toFixed(2)}W`);
}

// Call the main function
void main();
```

## API

### new INA226(i2cBus, address, rShunt)

```ts
constructor(i2cBus:I2cBus, address:number, rShunt:number=0.1)
```

Constructor for a new INA226 instance.

* `i2cBus` - Instance of an opened i2c-bus.
* `address` - The address of the INA226 IC.
* `rShunt` - The shunt resistance value. Defaults to 0.1 Ohm.

Note that you need to construct the [i2c-bus](https://npmjs.org/package/i2c-bus) object and pass it in to the module.

### writeRegister(register, value)

```ts
writeRegister(register:number, value:number): Promise<{}>
```

Writes a value to a specific register.
Returns a Promise which will be resolves if the value is written, or rejected in case of an error.

* `register` - The register address.
* `value` - The value. Should be 16bit integer.

### readRegister(register)

```ts
readRegister(register:number): Promise<number>
```

Reads a value from a specific register.
Returns a Promise which will be resolved with the read value, or rejected in case of an error.

* `register` - The register address.

### readBusVoltage()

```ts
readBusVoltage(): Promise<number>
```

Reads the actual bus voltage.
Returns a Promise which will be resolved with the bus voltage, or rejected in case of an error.

### readShuntVoltage()

```ts
readShuntVoltage(): Promise<number>
```

Reads the actual shunt voltage.
Returns a Promise which will be resolved with the shunt voltage, or rejected in case of an error.

### calcCurrent(shuntVoltage)

```ts
calcCurrent(shuntVoltage?:number): number
```

Calculates the current in Ampere based on the shunt voltage an the shunt resistance value.

* `shuntVoltage` - *Optional.* The shunt voltage which is used for the calculation. Defaults to the last read shunt voltage.

### calcPower(busVoltage, shuntVoltage)

```ts
calcPower(busVoltage?:number, shuntVoltage?:number): number
```

Calculates the power in Watt based on the bus voltage, the shunt voltage and the shunt resistance value.

* `busVoltage` - *Optional.* The bus voltage which is used for the calculation. Defaults to the last read bus voltage.
* `shuntVoltage` - *Optional.* The shunt voltage which is used for the calculation. Defaults to the last read shunt voltage.

### Exported constants

The register addresses are exported as constants.

| Constant | Value |
|---|---|
| CONFIGURATION_REGISTER | 0x00 |
| SHUNT_VOLTAGE_REGISTER | 0x01 |
| BUS_VOLTAGE_REGISTER | 0x02 |
| POWER_REGISTER | 0x03 |
| CURRENT_REGISTER | 0x04 |
| CALIBRATION_REGISTER | 0x05 |
| MASK_ENABLE_REGISTER | 0x06 |
| ALERT_LIMIT_REGISTER | 0x07 |
| MANUFACTOR_ID_REGISTER | 0xFE |
| DIE_ID_REGISTER | 0xFF |

Also the enums `CONFIG_AVERAGING`, `CONFIG_CONVERSION_TIME` and  `CONFIG_MODE` are exported to allow easier calculations of the configuration register value. See the examples for details on how to use them.

## License

Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)

Copyright (c) 2017-2025 Peter Müller <peter@crycode.de> [https://crycode.de/](https://crycode.de/)
