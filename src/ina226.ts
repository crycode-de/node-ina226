/*
 * Node.js module ina226
 *
 * Copyright (c) 2017-2025 Peter Müller <peter@crycode.de> (https://crycode.de/)
 *
 * Node.js module to read values from the INA226 bi-directional current and power monitor.
 */

import { I2CBus } from 'i2c-bus';

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

/**
 * Averaging modes for the INA226 to be used in the {@link CONFIGURATION_REGISTER}.
 */
export enum CONFIG_AVERAGING {
  AVG1 = 0,
  AVG4 = 1,
  AVG16 = 2,
  AVG64 = 3,
  AVG128 = 4,
  AVG256 = 5,
  AVG512 = 6,
  AVG1024 = 7,
}

/**
 * Conversion times for the INA226 to be used in the {@link CONFIGURATION_REGISTER}.
 */
export enum CONFIG_CONVERSION_TIME {
  CT_140us = 0,
  CT_204us = 1,
  CT_332us = 2,
  CT_588us = 3,
  CT_1_1ms = 4,
  CT_2_116ms = 5,
  CT_4_156ms = 6,
  CT_8_244ms = 7,
}

/**
 * Operating modes for the INA226 to be used in the {@link CONFIGURATION_REGISTER}.
 */
export enum CONFIG_MODE {
  POWER_DOWN_OR_SHUTDOWN_1 = 0b000,
  SHUNT_VOLTAGE_TRIGGERED = 0b001,
  BUS_VOLTAGE_TRIGGERED = 0b010,
  SHUNT_AND_BUS_VOLTAGE_TRIGGERED = 0b011,
  POWER_DOWN_OR_SHUTDOWN_2 = 0b100,
  SHUNT_VOLTAGE_CONTINUOUS = 0b101,
  BUS_VOLTAGE_CONTINUOUS = 0b110,
  SHUNT_AND_BUS_VOLTAGE_CONTINUOUS = 0b111,
}

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
  private _i2cBus: I2CBus;

  /**
   * The address of the INA226 IC.
   * @type {number}
   */
  private _address: number;

  /**
   * The shunt resistance value in Ohm.
   * @type {number}
   */
  private _rShunt: number;

  /**
   * Last read bus voltage.
   * @type {number}
   */
  private _busVoltage: number = 0;

  /**
   * Last read shunt voltage.
   * @type {number}
   */
  private _shuntVoltage: number = 0;

  /**
   * Constructor for the power monitor INA226.
   * @param  {I2cBus} i2cBus  Instance of an opened i2c-bus.
   * @param  {number} address The address of the INA226 IC.
   * @param  {number} rShunt  The shunt resistance value. Defaults to 0.1 Ohm.
   */
  constructor (i2cBus: I2CBus, address: number, rShunt: number = 0.1) {
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
  public writeRegister (register: number, value: number): Promise<void> {
    const buf = Buffer.alloc(2);
    buf[0] = (value >> 8) & 0xff;
    buf[1] = value & 0xff;

    return new Promise<void>((resolve: () => void, reject: (err: Error) => void) => {
      this._i2cBus.writeI2cBlock(this._address, register, 2, buf, (err: Error, _bytesWritten: number, _buffer: Buffer) => {
        if (err) {
          reject(err);
        } else {
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
  public readRegister (register: number): Promise<number> {
    const buf = Buffer.alloc(2);

    return new Promise<number>((resolve: (bytesWritten: number) => void, reject: (err: Error) => void) => {
      this._i2cBus.readI2cBlock(this._address, register, 2, buf, (err: Error, _bytesRead: number, buffer: Buffer) => {
        if (err) {
          reject(err);
        } else {
          const value = buffer[0] * 256 + buf[1];
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
  public readBusVoltage (): Promise<number> {
    return this.readRegister(BUS_VOLTAGE_REGISTER)
      .then<number>((busVoltage: number) => {
        this._busVoltage = busVoltage * BUS_VOLTAGE_LSB;
        return this._busVoltage;
      });
  }

  /**
   * Reads the actual shunt voltage.
   * Returns a Promise which will be resolved with the shunt voltage, or rejected in case of an error.
   * @return {Promise<number>}
   */
  public readShuntVoltage (): Promise<number> {
    return this.readRegister(SHUNT_VOLTAGE_REGISTER)
      .then<number>((shuntVoltage: number) => {
        // Negative numbers are represented in two's complement format.
        // Generate the two's complement of a negative number by complementing
        // the absolute value binary number and adding 1.
        // An MSB = '1' denotes a negative number.
        // (datasheet page 24)
        if (shuntVoltage & 0x8000) {
          shuntVoltage -= 1; // subtract 1
          shuntVoltage ^= 0xFFFF; // invert bits
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
  public calcCurrent (shuntVoltage: number = this._shuntVoltage): number {
    return shuntVoltage / this._rShunt;
  }

  /**
   * Calculates the power based on the bus voltage, the shunt voltage and the shunt resistance value.
   * @param  {number} busVoltage   Optional. The bus voltage which is used for the calculation. Defaults to the last read bus voltage.
   * @param  {number} shuntVoltage Optional. The shunt voltage which is used for the calculation. Defaults to the last read shunt voltage.
   * @return {number} The calculated power in Watt.
   */
  public calcPower (busVoltage: number = this._busVoltage, shuntVoltage: number = this._shuntVoltage): number {
    return busVoltage * shuntVoltage / this._rShunt;
  }
}
