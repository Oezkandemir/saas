declare module "phoenix" {
  export class Socket {
    constructor(endPoint: string, opts?: any);
    connect(): void;
    disconnect(callback?: () => void, code?: number, reason?: string): void;
    channel(topic: string, params?: any): Channel;
    log(kind: string, msg: string, data?: any): void;
    onOpen(callback: () => void): void;
    onClose(callback: () => void): void;
    onError(callback: (error: any) => void): void;
    onMessage(callback: (message: any) => void): void;
    connectionState(): string;
    isConnected(): boolean;
  }

  export class Channel {
    constructor(topic: string, params?: any, socket?: Socket);
    join(timeout?: number): Push;
    leave(timeout?: number): Push;
    onClose(callback: () => void): void;
    onError(callback: (reason?: any) => void): void;
    on(event: string, callback: (response?: any) => void): void;
    off(event: string): void;
    push(event: string, payload?: any, timeout?: number): Push;
  }

  export class Push {
    constructor(
      channel: Channel,
      event: string,
      payload?: any,
      timeout?: number,
    );
    send(): void;
    receive(status: string, callback: (response?: any) => void): Push;
  }

  export class Presence {
    static syncState(
      currentState: any,
      newState: any,
      onJoin?: Function,
      onLeave?: Function,
    ): any;
    static syncDiff(
      currentState: any,
      diff: any,
      onJoin?: Function,
      onLeave?: Function,
    ): any;
    static list(presences: any, chooser?: Function): any[];
    static map(presences: any, chooser?: Function): any;
  }
}
