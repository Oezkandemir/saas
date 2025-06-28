// Minimal polyfills for React Native - only using built-in functionality

// URL polyfill - essential for Expo Router and Supabase
import 'react-native-url-polyfill/auto';

// Basic polyfills for compatibility
if (!global.queueMicrotask) {
  global.queueMicrotask = (callback) => {
    Promise.resolve().then(callback).catch(error => {
      console.error('queueMicrotask error:', error);
    });
  };
}

// Animation frame polyfills
if (!global.requestAnimationFrame) {
  global.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 16);
  };
}

if (!global.cancelAnimationFrame) {
  global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
  };
}

// Essential Buffer polyfill
if (!global.Buffer) {
  const { Buffer } = require('buffer');
  global.Buffer = Buffer;
}

// Process polyfill
if (!global.process) {
  global.process = require('process');
}

// Global reference fix
global.global = global;

// Base64 polyfills
if (typeof global.btoa === 'undefined') {
  global.btoa = (str) => {
    try {
      return Buffer.from(str, 'binary').toString('base64');
    } catch (error) {
      console.error('btoa error:', error);
      return '';
    }
  };
}

if (typeof global.atob === 'undefined') {
  global.atob = (str) => {
    try {
      return Buffer.from(str, 'base64').toString('binary');
    } catch (error) {
      console.error('atob error:', error);
      return '';
    }
  };
}

// Better error handling for navigation-related errors
const originalConsoleError = console.error;
console.error = (...args) => {
  const errorMessage = args.join(' ');
  if (errorMessage.includes('useRef') && errorMessage.includes('null')) {
    console.warn('Navigation context error detected - this should be handled by error boundary');
  }
  originalConsoleError.apply(console, args);
};

console.log('Minimal polyfills loaded successfully');

// Export for potential direct usage
export {}; 