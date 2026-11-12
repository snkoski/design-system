import { describe, expect, it } from "vitest";
import { MOONS, PLANETS } from "@/experiments/SolarSystem/bodies";
import { positionAt } from "@/experiments/SolarSystem/kepler";
import { MIN_PERIOD, moonAngle, moonLongitude, shownPeriod } from "@/experiments/SolarSystem/moons";

const DAY = 86_400_000;
const moon = (name: string) => MOONS.find((other) => other.name === name)!;
const earth = PLANETS.find((planet) => planet.name === "Earth")!.orbit;
/** Which way the Sun is from Earth, in degrees */
function sunFromEarth(date: number) {
  const { x, y } = positionAt(earth, date);
  return ((Math.atan2(-y, -x) * 180) / Math.PI + 360) % 360;
}
/** The smallest angle between two directions, in degrees */
const apart = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe("moonLongitude", () => {
  it("puts the Moon in front of the Sun at the total solar eclipse of 8 April 2024", () => {
    const eclipse = Date.UTC(2024, 3, 8, 18, 18);
    expect(apart(moonLongitude(eclipse), sunFromEarth(eclipse))).toBeLessThan(1);
  });

  it("puts the Moon opposite the Sun at the full moon of 25 January 2024", () => {
    const full = Date.UTC(2024, 0, 25, 17, 54);
    expect(apart(moonLongitude(full), sunFromEarth(full))).toBeGreaterThan(179);
  });

  it("goes round once in a sidereal month, 27.32 days", () => {
    const start = Date.UTC(2026, 0, 1);
    expect(apart(moonLongitude(start), moonLongitude(start + 27.3217 * DAY))).toBeLessThan(5); // its speed varies on the way
    expect(apart(moonLongitude(start), moonLongitude(start + 13.66 * DAY))).toBeGreaterThan(150);
  });
});

describe("shownPeriod", () => {
  it("keeps the real period when a planet's moons are slow enough to watch", () => {
    expect(shownPeriod(moon("Moon"), MOONS)).toBe(27.322);
  });

  it("slows each planet's fastest moon to MIN_PERIOD, and the rest by the square root", () => {
    expect(shownPeriod(moon("Phobos"), MOONS)).toBeCloseTo(MIN_PERIOD);
    expect(shownPeriod(moon("Io"), MOONS)).toBeCloseTo(MIN_PERIOD);
    expect(shownPeriod(moon("Callisto"), MOONS)).toBeCloseTo(MIN_PERIOD * Math.sqrt(16.69044 / 1.762732));
  });

  it("never shows a moon faster than MIN_PERIOD, and keeps inner moons faster than outer", () => {
    for (const planet of new Set(MOONS.map((other) => other.planet))) {
      const moons = MOONS.filter((other) => other.planet === planet).sort((a, b) => a.distance - b.distance);
      const periods = moons.map((other) => shownPeriod(other, MOONS));
      periods.forEach((period) => expect(period).toBeGreaterThanOrEqual(MIN_PERIOD - 1e-9));
      periods.slice(1).forEach((period, index) => expect(period, planet).toBeGreaterThan(periods[index]!));
    }
  });
});

describe("moonAngle", () => {
  it("is the real Moon's longitude for Earth's Moon", () => {
    const date = Date.UTC(2026, 9, 23);
    expect(moonAngle(moon("Moon"), MOONS, date)).toBe(moonLongitude(date));
  });

  it("turns a slowed moon once in its shown period, counterclockwise", () => {
    const start = Date.UTC(2026, 0, 1);
    const io = moon("Io");
    expect(apart(moonAngle(io, MOONS, start), moonAngle(io, MOONS, start + MIN_PERIOD * DAY))).toBeCloseTo(0, 6);
    const quarter = (moonAngle(io, MOONS, start + (MIN_PERIOD / 4) * DAY) - moonAngle(io, MOONS, start) + 360) % 360;
    expect(quarter).toBeCloseTo(90);
  });

  it("turns Triton the other way", () => {
    const start = Date.UTC(2026, 0, 1);
    const triton = moon("Triton");
    const quarter = (moonAngle(triton, MOONS, start + (MIN_PERIOD / 4) * DAY) - moonAngle(triton, MOONS, start) + 360) % 360;
    expect(quarter).toBeCloseTo(270);
  });

  it("starts each moon of a planet somewhere different", () => {
    const date = Date.UTC(2000, 0, 1, 12);
    const jupiter = MOONS.filter((other) => other.planet === "Jupiter").map((other) => moonAngle(other, MOONS, date));
    jupiter.forEach((angle, index) => jupiter.slice(index + 1).forEach((other) => expect(apart(angle, other)).toBeGreaterThan(20)));
  });
});
