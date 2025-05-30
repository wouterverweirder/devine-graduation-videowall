'use strict';

// see https://technet.microsoft.com/de-de/library/bb491003.aspx for details
// right now, only local shutdown / reboot / logoff is implemented.
// we need the ability to spawn processes
import { spawn } from 'child_process';
// shutdown command to be executed
const shutdownCmd = 'shutdown';

/**
 *  Logs off the current user
 *
 * @param {Number} timeout Sets the timer for system logoff in seconds
 * @param {Boolean} force Forces running applications to close
 * @param {String} message Specifies a message to be displayed in the Message area of the System Shutdown window. You can use a maximum of 127 characters
 * @returns {ChildProcess}
 */
export function logoff(timeout:number, force:boolean, message:string) {
  // check if force flag is provided
  force = !!force;
  // build argumnets
  const args = ['-l'];
  if (timeout) {
    args.push('-t');
    args.push(timeout.toString());
  }
  if (force) {
    args.push('-f');
  }
  if (message) {
    args.push('-m');
    args.push(`"${message}"`);
  }
  // execute the shutdown command
  return spawn(shutdownCmd, args);
};

/**
 * Shuts down the local computer
 *
 * @param {Number} timeout Sets the timer for system shutdown in seconds
 * @param {Boolean} force Forces running applications to close
 * @param {String} message Specifies a message to be displayed in the Message area of the System Shutdown window. You can use a maximum of 127 characters
 * @returns {ChildProcess}
 */
export function shutdown(timeout:number, force:boolean, message:string) {
  // check if force flag is provided
  force = !!force;
  // build argumnets
  const args = ['-s'];
  if (timeout) {
    args.push('-t');
    args.push(timeout.toString());
  }
  if (force) {
    args.push('-f');
  }
  if (message) {
    args.push('-m');
    args.push(`"${message}"`);
  }
  // execute the shutdown command
  return spawn(shutdownCmd, args);
};

/**
 * Reboots after shutdown
 *
 * @param {Number} timeout Sets the timer for system shutdown in seconds
 * @param {Boolean} force Forces running applications to close
 * @param {String} message Specifies a message to be displayed in the Message area of the System Shutdown window. You can use a maximum of 127 characters
 * @returns {ChildProcess}
 */
export function reboot(timeout:number, force:boolean, message:string) {
  // check if force flag is provided
  force = !!force;
  // build argumnets
  const args = ['-r'];
  if (timeout) {
    args.push('-t');
    args.push(timeout.toString());
  }
  if (force) {
    args.push('-f');
  }
  if (message) {
    args.push('-m');
    args.push(`"${message}"`);
  }
  // execute the shutdown command
  return spawn(shutdownCmd, args);
};

/**
 * Aborts shutdown
 *
 * @returns {ChildProcess}
 */
export function abort() {
  return spawn(shutdownCmd, ['-a']);
};