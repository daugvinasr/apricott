import { Frame, hex } from "./bytes";
import type { Bus } from "./commands/shared";
import { TransportError } from "./errors";

export const VENDOR_ID_PIXART = 0x093a;
export const PRODUCT_ID_WIRED = 0x622c;
export const PRODUCT_ID_DONGLE = 0x522c;

export const VENDOR_USAGE_PAGE = 0xff05;
export const VENDOR_FEATURE_USAGE = 0x04;

export const DEVICE_FILTERS: HIDDeviceFilter[] = [
  { vendorId: VENDOR_ID_PIXART, productId: PRODUCT_ID_WIRED },
  { vendorId: VENDOR_ID_PIXART, productId: PRODUCT_ID_DONGLE },
];

// WebHID encodes an item usage as usagePage * 0x10000 + usage.
// (Not `<< 16`: 0xff05 << 16 overflows a signed 32-bit int and goes negative.)
const TARGET = VENDOR_USAGE_PAGE * 0x10000 + VENDOR_FEATURE_USAGE;

const READ_FLAG = 0x80;
const WRITE_GAP_MS = 500;
const READ_GAP_MS = 30;
const BLOCK_HEADER_GAP_MS = 40;
const BLOCK_DATA_GAP_MS = 60;
const BLOCK_READ_GAP_MS = 120;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface VendorReports {
  reportId: number;
  payloadLength: number;
  outputLength: number;
}

function findVendorReports(device: HIDDevice): VendorReports | null {
  const vendor = device.collections.filter((c) => c.usagePage === VENDOR_USAGE_PAGE);
  const report = vendor
    .flatMap((c) => c.featureReports ?? [])
    .find((r) => r.items?.some((i) => i.usages?.includes(TARGET)));

  const reportId = report?.reportId;
  const payloadLength = report?.items?.[0]?.reportCount;

  if (reportId === undefined || payloadLength === undefined) {
    return null;
  }

  const output = vendor.flatMap((c) => c.outputReports ?? []).find((r) => r.reportId === reportId);
  const outputLength = output?.items?.[0]?.reportCount;

  if (outputLength === undefined) {
    return null;
  }

  return { reportId, payloadLength, outputLength };
}

export class Transport implements Bus {
  readonly device: HIDDevice;
  readonly reportId: number;
  readonly payloadLength: number;
  readonly outputLength: number;
  readonly wireless: boolean; // using wireless dongle

  private inputListener: ((data: Uint8Array) => void) | null = null;

  private constructor(device: HIDDevice, info: VendorReports) {
    this.device = device;
    this.reportId = info.reportId;
    this.payloadLength = info.payloadLength;
    this.outputLength = info.outputLength;
    this.wireless = device.productId === PRODUCT_ID_DONGLE;

    device.oninputreport = (e) => {
      if (e.reportId === this.reportId) {
        this.inputListener?.(new Uint8Array(e.data.buffer, e.data.byteOffset, e.data.byteLength));
      }
    };
  }

  static async open(devices: HIDDevice[]): Promise<Transport> {
    for (const device of devices) {
      const info = findVendorReports(device);

      if (!info) {
        continue;
      }

      if (!device.opened) {
        await device.open();
      }

      return new Transport(device, info);
    }

    throw new TransportError(
      `No device with the vendor feature and output reports (${hex(VENDOR_USAGE_PAGE)}/${hex(VENDOR_FEATURE_USAGE)})`,
    );
  }

  private queue: Promise<unknown> = Promise.resolve();

  private enqueue<T>(op: () => Promise<T>): Promise<T> {
    const run = this.queue.then(op, op);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private buildPayload(op: number, args: number[]): Uint8Array<ArrayBuffer> {
    if (args.length > this.payloadLength - 1) {
      throw new TransportError(`Too many args for ${hex(op)}: ${args.length}`);
    }

    const payload = new Uint8Array(this.payloadLength);

    payload[0] = op;
    payload.set(args, 1);

    return payload;
  }

  async close(): Promise<void> {
    this.device.oninputreport = null;
    this.inputListener = null;
    if (this.device.opened) {
      await this.device.close();
    }
  }

  onInputReport(listener: ((data: Uint8Array) => void) | null): void {
    this.inputListener = listener;
  }

  async write(op: number, args: number[] = []): Promise<void> {
    const payload = this.buildPayload(op, args);
    return this.enqueue(async () => {
      await this.device.sendFeatureReport(this.reportId, payload);
      await sleep(WRITE_GAP_MS);
    });
  }

  private async receive(readOp: number): Promise<Frame> {
    const view = await this.device.receiveFeatureReport(this.reportId);

    // receiveFeatureReport includes the leading report-ID byte, strip it
    const rdata = new Uint8Array(view.buffer, view.byteOffset + 1, view.byteLength - 1).slice();

    if (rdata.length !== this.payloadLength) {
      throw new TransportError(
        `Short frame for ${hex(readOp)}: got ${rdata.length} bytes, expected ${this.payloadLength}`,
      );
    }

    return new Frame(rdata);
  }

  private exchange(op: number, args: number[], gapMs: number): Promise<Frame> {
    const readOp = op | READ_FLAG;
    const payload = this.buildPayload(readOp, args);

    return this.enqueue(async () => {
      await this.device.sendFeatureReport(this.reportId, payload);
      await sleep(gapMs);
      return this.receive(readOp);
    });
  }

  async read(op: number, args: number[] = []): Promise<Frame> {
    return (await this.exchange(op, args, READ_GAP_MS)).expect(op | READ_FLAG, "Op echo");
  }

  readBlock(op: number, args: number[]): Promise<Frame> {
    return this.exchange(op, args, BLOCK_READ_GAP_MS);
  }

  async writeBlock(op: number, args: number[], data: Uint8Array): Promise<void> {
    const header = this.buildPayload(op, args);

    if (data.length > this.outputLength) {
      throw new TransportError(
        `Block for ${hex(op)} is ${data.length} bytes, max ${this.outputLength}`,
      );
    }

    const report = new Uint8Array(this.outputLength);
    report.set(data);

    return this.enqueue(async () => {
      await this.device.sendFeatureReport(this.reportId, header);
      await sleep(BLOCK_HEADER_GAP_MS);
      await this.device.sendReport(this.reportId, report);
      await sleep(BLOCK_DATA_GAP_MS);
    });
  }
}
