/*
* Node.js module ina226
*
* Copyright (c) 2017-2025 Peter Müller <peter@crycode.de> (https://crycode.de/)
*
* Node.js module to read values from the INA226 bi-directional current and power monitor.
*
* Example
*/
/* eslint-disable @typescript-eslint/no-require-imports */

// Require the ina226 module
// const INA226 = require('ina226').INA226;
const INA226 = require('../').INA226;

// const CONFIGURATION_REGISTER = require('ina226').CONFIGURATION_REGISTER;
const CONFIGURATION_REGISTER = require('../').CONFIGURATION_REGISTER;

// Require the i2c-bus module and open the bus
const i2cBus = require('i2c-bus').openSync(1);

// Define the address of the INA226 and the shunt resistance value
const addr = 0x40;
const rShunt = 0.1;

// Init a new INA226
const ina = new INA226(i2cBus, addr, rShunt);

// Write to the Configuration Register
// 0x4427 means 16 averages, 1.1ms conversion time, shunt and bus continuous
ina.writeRegister(CONFIGURATION_REGISTER, 0x4427)
.then(function(){
  console.log('Configuration written');
});

// Read the actual bus voltage
ina.readBusVoltage()
.then(function(busVoltage){
  console.log('Bus Voltage: ' + busVoltage.toFixed(2) + 'V');
});

// Read the actual shunt voltage
ina.readShuntVoltage()
.then(function(shuntVoltage){
  console.log('Shunt Voltage: ' + shuntVoltage.toFixed(5) + 'V');
});

// Read the actual shunt voltage and calculate the current
ina.readShuntVoltage()
.then(function(){
  const current = ina.calcCurrent();
  console.log('Current: ' + current.toFixed(2) + 'A');
})

// Then read the actual bus voltage and calculate the power
.then(ina.readBusVoltage.bind(ina))
.then(function(){
  const power = ina.calcPower();
  console.log('Power: ' + power.toFixed(2) + 'W');
});
