/*
 * Node.js module ina226
 *
 * Copyright (c) 2017 Peter Müller <peter@crycode.de> (https://crycode.de/)
 *
 * Node.js module to read values from the INA226 bi-directional current and power monitor.
 */
/// <reference types="node" />

import * as Promise from 'bluebird';
import {I2cBus} from 'i2c-bus';

/**
 * Address of the Configuration Register.
 */
export const CONFIGURATION_REGISTER = 0x00;

/**
 * Address of the Shunt Voltage Register.
 */
export const SHUNT_VOLTAGE_REGISTER = 0x01;

/**
 * Address of the Bus Voltage Register.
 */
export const BUS_VOLTAGE_REGISTER = 0x02;

/**
 * Address of the Power Register.
 */
export const POWER_REGISTER = 0x03;

/**
 * Address of the Current Register.
 */
export const CURRENT_REGISTER = 0x04;

/**
 * Address of the Calibration Register.
 */
export const CALIBRATION_REGISTER = 0x05;

/**
 * Address of the Mask/Enable Register.
 */
export const MASK_ENABLE_REGISTER = 0x06;

/**
 * Address of the Alert Limit Register.
 */
export const ALERT_LIMIT_REGISTER = 0x07;

/**
 * Address of the Manufactor ID Register.
 */
export const MANUFACTOR_ID_REGISTER = 0xFE;

/**
 * Address of the Die ID Register.
 */
export const DIE_ID_REGISTER = 0xFF;

const SHUNT_VOLTAGE_LSB = 0.0000025; // 2.5µV
const BUS_VOLTAGE_LSB = 0.00125; // 1.25mV

/**
 * Class for the power monitor INA226.
 * @param  {I2cBus}     i2cBus  Instance of an opened i2c-bus.
 * @param  {number}     address The address of the INA226 IC.
 * @param  {number=0.1} rShunt  The shunt resistance value. Defaults to 0.1 Ohm.
 */
export class INA226 {

  /**
   * Instance of the used i2c-bus object.
   * @type {I2cBus}
   */
  private _i2cBus:I2cBus;

  /**
   * The address of the INA226 IC.
   * @type {number}
   */
  private _address:number;

  /**
   * The shunt resistance value in Ohm.
   * @type {number}
   */
  private _rShunt:number;

  /**
   * Last read bus voltage.
   * @type {number}
   */
  private _busVoltage:number = 0;

  /**
   * Last read shunt voltage.
   * @type {number}
   */
  private _shuntVoltage:number = 0;

  /**
   * Constructor for the power monitor INA226.
   * @param  {I2cBus} i2cBus  Instance of an opened i2c-bus.
   * @param  {number} address The address of the INA226 IC.
   * @param  {number} rShunt  The shunt resistance value. Defaults to 0.1 Ohm.
   */
  constructor(i2cBus:I2cBus, address:number, rShunt:number=0.1){
    this._i2cBus = i2cBus;
    this._address = address;
    this._rShunt = rShunt;
  }

  /**
   * Writes a value to a specific register.
   * Returns a Promise which will be resolves if the value is written, or rejected in case of an error.
   * @param  {number}  register The register address.
   * @param  {number}  value    The value. Should be 16bit integer.
   * @return {Promise}
   */
  public writeRegister(register:number, value:number):Promise<{}>{
    let buf = Buffer.alloc(2);
    buf[0] = (value >> 8) & 0xff;
    buf[1] = value & 0xff;

    return new Promise<number>((resolve:()=>void, reject:(err:Error)=>void)=>{
      this._i2cBus.writeI2cBlock(this._address, register, 2, buf, (err:any, bytesWritten:number, buffer:Buffer)=>{
        if(err){
          reject(err);
        }else{
          resolve();
        }
      });
    });
  }

  /**
   * Reads a value from a specific register.
   * Returns a Promise which will be resolved with the read value, or rejected in case of an error.
   * @param  {number}          register The register address.
   * @return {Promise<number>}
   */
  public readRegister(register:number):Promise<number>{
    let buf = Buffer.alloc(2);

    return new Promise<number>((resolve:(bytesWritten:number)=>void, reject:(err:Error)=>void)=>{
      this._i2cBus.readI2cBlock(this._address, register, 2, buf, (err:any, bytesRead:number, buffer:Buffer)=>{
        if(err){
          reject(err);
        }else{
          let value = buffer[0]*256 + buf[1];
          resolve(value);
        }
      });
    });
  }

  /**
   * Reads the actual bus voltage.
   * Returns a Promise which will be resolved with the bus voltage, or rejected in case of an error.
   * @return {Promise<number>}
   */
  public readBusVoltage():Promise<number>{
    return this.readRegister(BUS_VOLTAGE_REGISTER)
      .then<number>((busVoltage:number)=>{
        this._busVoltage = busVoltage * BUS_VOLTAGE_LSB;
        return this._busVoltage;
      });
  }

  /**
   * Reads the actual shunt voltage.
   * Returns a Promise which will be resolved with the shunt voltage, or rejected in case of an error.
   * @return {Promise<number>}
   */
  public readShuntVoltage():Promise<number>{
    return this.readRegister(SHUNT_VOLTAGE_REGISTER)
      .then<number>((shuntVoltage:number)=>{
        // Negative numbers are represented in two's complement format.
        // Generate the two's complement of a negative number by complementing
        // the absolute value binary number and adding 1.
        // An MSB = '1' denotes a negative number.
        // (datasheet page 24)
        if(shuntVoltage & 0x8000){
          shuntVoltage = ~shuntVoltage; // invert bits
          shuntVoltage += 1; // add 1
          shuntVoltage *= -1; // negate
        }
        this._shuntVoltage = shuntVoltage * SHUNT_VOLTAGE_LSB;
        return this._shuntVoltage;
      });
  }

  /**
   * Calculates the current based on the shunt voltage an the shunt resistance value.
   * @param  {number} shuntVoltage Optional. The shunt voltage which is used for the calculation. Defaults to the last read shunt voltage.
   * @return {number} The calculated current in Ampere.
   */
  public calcCurrent(shuntVoltage:number = this._shuntVoltage):number{
    return shuntVoltage / this._rShunt;
  }

  /**
   * Calculates the power based on the bus voltage, the shunt voltage and the shunt resistance value.
   * @param  {number} busVoltage   Optional. The bus voltage which is used for the calculation. Defaults to the last read bus voltage.
   * @param  {number} shuntVoltage Optional. The shunt voltage which is used for the calculation. Defaults to the last read shunt voltage.
   * @return {number} The calculated power in Watt.
   */
  public calcPower(busVoltage:number = this._busVoltage, shuntVoltage:number = this._shuntVoltage):number{
    return busVoltage * shuntVoltage / this._rShunt;
  }
}
