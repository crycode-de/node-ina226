/*
* Node.js module ina226
*
* Copyright (c) 2017-2025 Peter Müller <peter@crycode.de> (https://crycode.de/)
*
* Node.js module to read values from the INA226 bi-directional current and power monitor.
*
* Example
*/

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
