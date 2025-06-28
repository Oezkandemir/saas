// WebSocket polyfill for React Native
// This file replaces the 'ws' package with React Native's built-in WebSocket

class ReactNativeWebSocket extends WebSocket {
  constructor(url, protocols, options) {
    super(url, protocols);
    
    // Map additional ws-specific properties/methods
    this.readyState = this.readyState;
    this.url = url;
    this.protocol = '';
    this.extensions = '';
  }

  // Add ws-specific methods that might be expected
  ping(data, mask, callback) {
    if (callback) callback();
  }

  pong(data, mask, callback) {
    if (callback) callback();
  }

  terminate() {
    this.close();
  }
}

// Export as default and named export to match ws package
module.exports = ReactNativeWebSocket;
module.exports.default = ReactNativeWebSocket;
module.exports.WebSocket = ReactNativeWebSocket;

// Also export as ES6 default
export default ReactNativeWebSocket; 