import { expect, it } from "vite-plus/test";
import { TransportError } from "../core/errors";
import { fakeBus } from "./fake-bus";
import { Sensor } from "../core/commands/identity";
import { isAwake, readIdentity } from "../core/commands/identity";

it("reads wired identity", async () => {
  const { bus, reads } = fakeBus(() => [1, 6, 0, Sensor.PAW3950, 3]);
  expect(await readIdentity(bus)).toEqual({
    model: 6,
    sensor: Sensor.PAW3950,
    link: { kind: "wired" },
    colour: 3,
  });
  expect(reads).toEqual([{ op: 0x0f, args: [] }]);
});

it("reads dongle identity with shifted link byte", async () => {
  const { bus } = fakeBus(() => [1, 2, 0x02, 0, Sensor.PAW3395], true);
  expect(await readIdentity(bus)).toEqual({
    model: 2,
    sensor: Sensor.PAW3395,
    link: { kind: "dongle", receiver8k: true },
    colour: undefined,
  });
});

it("shifts the wired body when the link byte is 2", async () => {
  const { bus } = fakeBus(() => [1, 2, 0x02, 0xfa, Sensor.PAW3395]);
  expect(await readIdentity(bus)).toEqual({
    model: 2,
    sensor: Sensor.PAW3395,
    link: { kind: "wired" },
    colour: undefined,
  });
});

it("reads dongle identity with an unshifted link byte", async () => {
  const { bus } = fakeBus(() => [1, 9, 0x01, 0, Sensor.PAW3950], true);
  expect(await readIdentity(bus)).toEqual({
    model: 9,
    sensor: Sensor.PAW3950,
    link: { kind: "dongle", receiver8k: false },
    colour: undefined,
  });
});

it("rejects bad marker and unknown sensor", async () => {
  await expect(readIdentity(fakeBus(() => [0]).bus)).rejects.toThrow(TransportError);
  await expect(readIdentity(fakeBus(() => [1, 2, 0, 0x55]).bus)).rejects.toThrow(TransportError);
});

it("reads presence", async () => {
  const { bus, reads } = fakeBus(() => [0, 0, 0, 0, 0, 1]);
  expect(await isAwake(bus)).toBe(true);
  expect(reads).toEqual([{ op: 0x0e, args: [1] }]);
});
