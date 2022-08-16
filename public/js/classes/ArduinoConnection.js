const defaultFilters = [
  { usbVendorId: 9025, usbProductId: 32823 } //arduino micro, see chrome://device-log/
];

class BaseSerial {

  port;
  reader;

  constructor({ baudRate = 9600, filters = defaultFilters, log = false } = {}) {
    this.baudRate = baudRate;
    this.filters = filters;
    this.isLogging = log;
  }

  onMessage(callback) { this.callback = callback; }

  async connect() {
    const ports = await navigator.serial.getPorts({ filters: this.filters });
    if (ports.length > 0) {
      this.port = ports[0];
    }
    try {
      if (!this.port) {
        this.port = await navigator.serial.requestPort({ filters: this.filters });
      }

      await this.port.open({ baudRate: this.baudRate });
      return true
    } catch (e) {
      console.log(e)
      return false;
    }
  }

  log(...args) {
    this.isLogging && console.log('Serial:', ...args);
  }
}

class SerialBinary extends BaseSerial {

  async connect() {
    await super.connect();

    this.keepReading = true;
    this.closedPromise = this.readLoop();
  }

  async disconnect() {
    this.keepReading = false;
    await this.reader.cancel();
    await super.closedPromise;
  }

  async readLoop() {
    while (this.port.readable && this.keepReading) {
      this.reader = this.port.readable.getReader();
      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await this.reader.read();
          if (done) {
            break;
          }
          if (value) {
            this.callback(value);
          }
        }
      } catch (error) {
        // TODO: Handle non-fatal read error.
        console.log("non fatal error", error)
      } finally {
        // Allow the serial port to be closed later.
        this.reader.releaseLock();
      }
    }

    await this.port.close();
    this.port = null;
  }

  async write(line) {
    const writer = this.port.writable.getWriter();
    this.log('[SEND TO DEVICE]', line);
    await writer.write(line);
    writer.releaseLock();
  }

}

class SerialText extends BaseSerial {

  reader
  inputDone;
  outputDone;
  inputStream;
  outputStream;

  connect = async () => {
    await super.connect();

    let decoder = new window.TextDecoderStream();
    this.inputDone = this.port.readable.pipeTo(decoder.writable);
    this.inputStream = decoder.readable;
    this.reader = this.inputStream.getReader();

    const encoder = new window.TextEncoderStream();
    this.outputDone = encoder.readable.pipeTo(this.port.writable);
    this.outputStream = encoder.writable;
    this.writer = this.outputStream.getWriter();

    this.readLoop();
  }

  disconnect = async () => {
    this.reader.cancel();
    await this.inputDone.catch(() => { });
    this.reader = null;
    this.inputDone = null;

    this.writer.close();
    await this.outputDone;
    this.outputStream = null;
    this.outputDone = null;

    await this.port.close();
    this.port = null;
  }

  readLoop = async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await this.reader.read();
      if (done) {
        // Allow the serial port to be closed later.
        this.reader.releaseLock();
        break;
      }
      // value is a string.
      this.callback(value);
    }
  }

  write = line => {
    this.log('[SEND TO DEVICE]', line);
    this.writer.write(line);
  }

}

class ArduinoConnection {
  constructor() {
    this.messageQueue = Promise.resolve();
    this.onopen = () => {};
    this.onmessage = () => {};
  }

  connect() {
    this.serial = new SerialBinary({ log: true });
    this.serial.onMessage(this.onMessage);
    this.serial.connect().then(() => {
      this.onopen();
    });
  }
}

export { ArduinoConnection };