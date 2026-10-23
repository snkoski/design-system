import { describe, expect, it } from "vitest";
import { PLANETS } from "./bodies";
import { centuriesSince2000, orbitPath, positionAt, solveKepler } from "./kepler";
import { scaleDistance } from "./scale";

const planet = (name: string) => PLANETS.find((body) => body.name === name)!.orbit;
const distance = ({ x, y, z }: { x: number; y: number; z: number }) => Math.hypot(x, y, z);
/** Heliocentric longitude, in degrees from 0 to 360 */
const longitude = ({ x, y }: { x: number; y: number }) => ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

describe("solveKepler", () => {
  it("solves M = E - e sin E, for round and long, thin orbits", () => {
    for (const e of [0, 0.0167, 0.249, 0.6, 0.967]) {
      for (const M of [-3, -1, 0, 0.1, 1, 2.5, 3.1]) {
        const E = solveKepler(M, e);
        expect(E - e * Math.sin(E)).toBeCloseTo(M, 10);
      }
    }
  });
});

describe("centuriesSince2000", () => {
  it("counts from noon on 1 January 2000", () => {
    expect(centuriesSince2000(Date.UTC(2000, 0, 1, 12))).toBe(0);
    expect(centuriesSince2000(Date.UTC(2000, 0, 1, 12) + 36_525 * 86_400_000)).toBeCloseTo(1);
  });
});

describe("positionAt", () => {
  it("puts Earth about 100.4° round at J2000", () => {
    expect(longitude(positionAt(planet("Earth"), Date.UTC(2000, 0, 1, 12)))).toBeCloseTo(100.4, 0);
  });

  it("brings Earth nearest the Sun in early January and furthest in early July", () => {
    expect(distance(positionAt(planet("Earth"), Date.UTC(2026, 0, 3)))).toBeCloseTo(0.9833, 3);
    expect(distance(positionAt(planet("Earth"), Date.UTC(2026, 6, 6)))).toBeCloseTo(1.0166, 3);
  });

  it("lines Earth and Mars up at Mars's opposition, 16 January 2025", () => {
    const date = Date.UTC(2025, 0, 16);
    const apart = Math.abs(longitude(positionAt(planet("Earth"), date)) - longitude(positionAt(planet("Mars"), date)));
    expect(apart).toBeLessThan(1);
  });

  it("puts Venus on the opposite side of the Sun from Earth at its superior conjunction, 4 June 2024", () => {
    const date = Date.UTC(2024, 5, 4);
    const apart = Math.abs(longitude(positionAt(planet("Earth"), date)) - longitude(positionAt(planet("Venus"), date)));
    expect(apart).toBeCloseTo(180, -0.5); // within a degree or two
  });

  it("brings Pluto to perihelion on 5 September 1989, closer to the Sun than Neptune", () => {
    const date = Date.UTC(1989, 8, 5);
    const pluto = distance(positionAt(planet("Pluto"), date));
    expect(pluto).toBeCloseTo(29.66, 1);
    expect(pluto).toBeLessThan(distance(positionAt(planet("Neptune"), date)));
    // A year either side, it's further out
    expect(distance(positionAt(planet("Pluto"), Date.UTC(1988, 8, 5)))).toBeGreaterThan(pluto);
    expect(distance(positionAt(planet("Pluto"), Date.UTC(1990, 8, 5)))).toBeGreaterThan(pluto);
  });

  it("has Pluto further out than Neptune again by 2000", () => {
    const date = Date.UTC(2000, 0, 1);
    expect(distance(positionAt(planet("Pluto"), date))).toBeGreaterThan(distance(positionAt(planet("Neptune"), date)));
  });

  it("goes round counterclockwise, seen from the north, and back where it started a year later", () => {
    const start = Date.UTC(2026, 0, 1);
    const later = longitude(positionAt(planet("Earth"), start + 30 * 86_400_000));
    expect((later - longitude(positionAt(planet("Earth"), start)) + 360) % 360).toBeCloseTo(30, -1);
    const [a, b] = [positionAt(planet("Earth"), start), positionAt(planet("Earth"), start + 365.256 * 86_400_000)];
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(0.001);
  });

  it("keeps Pluto's orbit tilted 17° out of Earth's, and Earth's flat", () => {
    const tilt = (name: string) => Math.max(...orbitPath(planet(name), Date.UTC(2026, 0, 1)).map((p) => (Math.asin(p.z / distance(p)) * 180) / Math.PI));
    expect(tilt("Pluto")).toBeCloseTo(17.1, 0);
    expect(tilt("Earth")).toBeCloseTo(0, 1);
  });
});

describe("orbitPath", () => {
  it("goes all the way round, between perihelion and aphelion", () => {
    const points = orbitPath(planet("Pluto"), Date.UTC(2026, 0, 1), 360);
    expect(points).toHaveLength(360);
    const distances = points.map(distance);
    expect(Math.min(...distances)).toBeCloseTo(29.66, 1);
    expect(Math.max(...distances)).toBeCloseTo(49.3, 0);
  });
});

describe("scaleDistance", () => {
  const rings = [1, 2, 5, 10];
  const scales = ["linear", "sqrt", "log", "even"] as const;

  it("goes from 0 at the Sun to 1 at the outermost, always further out for further away", () => {
    for (const kind of scales) {
      const scale = scaleDistance(kind, rings, 12);
      expect(scale(0)).toBe(0);
      expect(scale(12)).toBeCloseTo(1);
      const steps = [0.5, 1, 1.5, 2, 4, 5, 9, 10, 11, 12].map(scale);
      steps.slice(1).forEach((value, index) => expect(value).toBeGreaterThan(steps[index]!));
    }
  });

  it("is in proportion when linear, and by the square root when sqrt", () => {
    expect(scaleDistance("linear", rings, 12)(3)).toBeCloseTo(0.25);
    expect(scaleDistance("sqrt", rings, 16)(4)).toBeCloseTo(0.5);
  });

  it("spaces the rings evenly when even, in proportion between them, and on past the last", () => {
    const scale = scaleDistance("even", rings, 12.5); // half the last gap (5) past the last ring: step 4.5
    expect(rings.map(scale).map((value) => value * 4.5)).toEqual([1, 2, 3, 4].map((value) => expect.closeTo(value)));
    expect(scale(3.5) * 4.5).toBeCloseTo(2.5); // halfway between the rings at 2 and 5
    expect(scale(0.5) * 4.5).toBeCloseTo(0.5);
  });

  it("gives each ring more room than linear does, close in, when log", () => {
    const [log, linear] = [scaleDistance("log", rings, 12), scaleDistance("linear", rings, 12)];
    expect(log(1)).toBeGreaterThan(linear(1) * 2);
  });
});
