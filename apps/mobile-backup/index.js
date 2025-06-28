// Global polyfills for React Native
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import process from 'process';
global.process = process;

// Additional global polyfills
global.global = global;
if (typeof global.btoa === 'undefined') {
  global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
}
if (typeof global.atob === 'undefined') {
  global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
}

// Import polyfills
import './polyfills';

import 'expo-router/entry';
