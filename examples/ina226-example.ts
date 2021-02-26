/*
 * Node.js module ina226
 *
 * Copyright (c) 2017-2021 Peter Müller <peter@crycode.de> (https://crycode.de/)
 *
 * Node.js module to read values from the INA226 bi-directional current and power monitor.
 *
 * Example
 */

// Import the ina226 module
//import {INA226, CONFIGURATION_REGISTER} from 'ina226';
import {INA226, CONFIGURATION_REGISTER} from '../';

// Import the i2c-bus module and open the bus
import {I2CBus, openSync as I2cBusOpenSync} from 'i2c-bus';
const i2cBus:I2CBus = I2cBusOpenSync(1);


// Define the address of the INA226 and the shunt resistance value
const addr:number = 0x40;
const rShunt:number = 0.1;

// Init a new INA226
const ina = new INA226(i2cBus, addr, rShunt);

// Write to the Configuration Register
// 0x4427 means 16 averages, 1.1ms conversion time, shunt and bus continuous
ina.writeRegister(CONFIGURATION_REGISTER, 0x4427)
.then(()=>{
  console.log('Configuration written');
});

// Read the actual bus voltage
ina.readBusVoltage()
.then((busVoltage:number)=>{
  console.log(`Bus Voltage: ${busVoltage.toFixed(2)}V`);
});

// Read the actual shunt voltage
ina.readShuntVoltage()
.then(function(shuntVoltage:number){
  console.log(`Shunt Voltage: ${shuntVoltage.toFixed(5)}V`);
});

// Read the actual shunt voltage and calculate the current
ina.readShuntVoltage()
.then(()=>{
  let current = ina.calcCurrent();
  console.log(`Current: ${current.toFixed(2)}A`);
})

// Then read the actual bus voltage and calculate the power
.then(ina.readBusVoltage.bind(ina))
.then(()=>{
  let power = ina.calcPower();
  console.log(`'Power: ${power.toFixed(2)}W`);
});
