import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { formatDate, SolarSystem } from "@/experiments/SolarSystem/SolarSystem";
import type { SolarSystemProps } from "@/experiments/SolarSystem/SolarSystem";

const DAY = 86_400_000;
const PLUTO_CLOSEST = Date.UTC(1989, 8, 5);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"] });
  vi.setSystemTime(Date.UTC(2026, 9, 23, 12));
});
afterEach(() => {
  vi.useRealTimers();
});

const planet = (container: HTMLElement, name: string) => container.querySelector(`g[data-planet=${name}]`)!;
/** Where a planet is drawn, from its group's translate() */
function placeOf(container: HTMLElement, name: string) {
  const [x, y] = planet(container, name).getAttribute("transform")!.match(/-?[\d.]+/g)!.map(Number);
  return { x: x!, y: y! };
}
const fromSun = (container: HTMLElement, name: string) => Math.hypot(placeOf(container, name).x, placeOf(container, name).y);
const shownDate = () => screen.getByRole("figure").querySelector("time")!;
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));
/** How many days on from `start` the date shown is */
const daysSince = (start: number) => (Date.parse(shownDate().dateTime) - start) / DAY;

describe("SolarSystem", () => {
  describe("rendering", () => {
    it("is one named picture of a hamburger and nine hot dogs, each named", () => {
      const { container } = render(<SolarSystem />);
      const picture = screen.getByRole("img");
      expect(picture).toHaveAccessibleName(/hamburger for the Sun and hot dogs for the planets: Mercury, Venus, Earth, .*Neptune, Pluto/);
      expect(container.querySelector("[data-body=Sun]")).toHaveTextContent("🍔");
      const names = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
      names.forEach((name) => {
        expect(planet(container, name)).toHaveTextContent(`🌭${name}`);
        expect(planet(container, name).querySelector("title")).toHaveTextContent(name);
      });
    });

    it("draws bigger planets bigger, but squeezed", () => {
      const { container } = render(<SolarSystem />);
      const size = (name: string) => Number(planet(container, name).querySelector(".solar-system__body")!.getAttribute("font-size"));
      expect(size("Jupiter")).toBeGreaterThan(size("Earth"));
      expect(size("Earth")).toBeGreaterThan(size("Pluto"));
      expect(size("Jupiter") / size("Pluto")).toBeLessThan(5); // 59 times as wide, really
    });

    it("draws each orbit, and leaves them out with orbits={false}", () => {
      const { container, rerender } = render(<SolarSystem />);
      const paths = container.querySelectorAll(".solar-system__orbits path");
      expect(paths).toHaveLength(9);
      paths.forEach((path) => expect(path.getAttribute("d")).toMatch(/^M-?[\d.]+ -?[\d.]+L.*Z$/));
      rerender(<SolarSystem orbits={false} />);
      expect(container.querySelector(".solar-system")).toBeInTheDocument();
      expect(container.querySelector(".solar-system__orbits")).not.toBeInTheDocument();
    });

    it("leaves the names out with labels={false}, but keeps them as titles", () => {
      const { container } = render(<SolarSystem labels={false} />);
      expect(planet(container, "Earth").querySelector("title")).toHaveTextContent("Earth");
      expect(container.querySelector(".solar-system__label")).not.toBeInTheDocument();
    });

    it("passes other props through, merges className, and forwards the ref", () => {
      const ref = createRef<HTMLElement>();
      render(<SolarSystem ref={ref} className="w-full" title="Lunch" />);
      const figure = screen.getByRole("figure");
      expect(figure).toHaveClass("solar-system", "w-full");
      expect(figure).toHaveAttribute("title", "Lunch");
      expect(ref.current).toBe(figure);
    });
  });

  describe("the date", () => {
    it("starts on today by default", () => {
      render(<SolarSystem paused />);
      expect(shownDate()).toHaveTextContent(formatDate(Date.UTC(2026, 9, 23, 12)));
      expect(shownDate()).toHaveAttribute("datetime", "2026-10-23");
    });

    it("starts on the date it's given, with everything where it was", () => {
      const { container } = render(<SolarSystem date={new Date(PLUTO_CLOSEST)} paused scale="even" />);
      expect(shownDate()).toHaveAttribute("datetime", "1989-09-05");
      expect(shownDate()).toHaveTextContent(formatDate(PLUTO_CLOSEST));
      expect(fromSun(container, "Pluto")).toBeLessThan(fromSun(container, "Neptune")); // Pluto was inside Neptune
    });

    it("keeps room for a date in any month, hidden, so the button beside it doesn't move", () => {
      render(<SolarSystem paused />);
      const room = [...screen.getByRole("figure").querySelectorAll(".solar-system__date-room")];
      expect(room).toHaveLength(12);
      expect(room.map((date) => date.textContent)).toContain(formatDate(Date.UTC(2000, 8, 28)));
      room.forEach((date) => expect(date).toHaveAttribute("aria-hidden", "true"));
      expect(shownDate().parentElement).toBe(room[0]!.parentElement); // in the same place as the date
    });

    it("jumps to a new date", () => {
      const { container, rerender } = render(<SolarSystem date={PLUTO_CLOSEST} paused />);
      rerender(<SolarSystem date={Date.UTC(2010, 0, 1)} paused />);
      expect(shownDate()).toHaveAttribute("datetime", "2010-01-01");
      expect(fromSun(container, "Pluto")).toBeGreaterThan(fromSun(container, "Neptune"));
    });
  });

  describe("moving", () => {
    it("goes on by speed days a second, counterclockwise", () => {
      const { container } = render(<SolarSystem date={Date.UTC(2026, 0, 1)} speed={30} />);
      const angle = () => Math.atan2(-placeOf(container, "Earth").y, placeOf(container, "Earth").x); // north up
      const before = angle();
      wait(1000);
      expect(daysSince(Date.UTC(2026, 0, 1))).toBeCloseTo(30, -1); // the first frame only starts the clock
      const turned = (((angle() - before) * 180) / Math.PI + 360) % 360;
      expect(turned).toBeCloseTo(30, -1); // about a degree a day
    });

    it("runs backwards with a negative speed", () => {
      render(<SolarSystem date={Date.UTC(2026, 0, 31)} speed={-30} />);
      wait(1000);
      expect(daysSince(Date.UTC(2026, 0, 31))).toBeCloseTo(-30, -1);
    });

    it("counts a late frame, such as after a hidden tab, as a quarter of a second at most", () => {
      const frames: FrameRequestCallback[] = [];
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => frames.push(callback));
      render(<SolarSystem date={Date.UTC(2026, 0, 1)} speed={40} />);
      act(() => frames.shift()!(1000)); // starts the clock
      act(() => frames.shift()!(61_000)); // a minute later
      expect(daysSince(Date.UTC(2026, 0, 1))).toBeCloseTo(10); // 40 days a second, for a quarter of a second
    });

    it("holds still when paused, until someone presses Play, and Pause stops it again", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { container } = render(<SolarSystem date={Date.UTC(2026, 0, 1)} paused />);
      const start = placeOf(container, "Earth");
      wait(1000);
      expect(placeOf(container, "Earth")).toEqual(start);
      expect(shownDate()).toHaveAttribute("datetime", "2026-01-01");
      await user.click(screen.getByRole("button", { name: "Play" }));
      wait(1000);
      expect(placeOf(container, "Earth")).not.toEqual(start);
      await user.click(screen.getByRole("button", { name: "Pause" }));
      const stopped = shownDate().dateTime;
      wait(1000);
      expect(shownDate().dateTime).toBe(stopped);
    });

    it("follows the paused prop", () => {
      const { rerender } = render(<SolarSystem date={Date.UTC(2026, 0, 1)} />);
      expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
      rerender(<SolarSystem date={Date.UTC(2026, 0, 1)} paused />);
      expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    });

    it("starts paused under reduced motion", () => {
      render(<SolarSystem date={Date.UTC(2026, 0, 1)} style={{ "--experiment-decoration": "0" } as React.CSSProperties} />);
      expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
      wait(1000);
      expect(shownDate()).toHaveAttribute("datetime", "2026-01-01");
    });

    it("stops when it's gone", () => {
      const { unmount } = render(<SolarSystem />);
      unmount();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe("distance scales", () => {
    it("keeps everything in order outwards, and in the same direction, on every scale", () => {
      const date = Date.UTC(2026, 9, 23);
      const directions: number[] = [];
      for (const scale of ["linear", "sqrt", "log", "even"] as const) {
        const { container, unmount } = render(<SolarSystem date={date} paused scale={scale} />);
        const distances = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"].map((name) => fromSun(container, name));
        distances.slice(1).forEach((value, index) => expect(value).toBeGreaterThan(distances[index]!));
        directions.push(Math.atan2(placeOf(container, "Mars").y, placeOf(container, "Mars").x));
        unmount();
      }
      directions.forEach((direction) => expect(direction).toBeCloseTo(directions[0]!));
    });

    it("spreads the inner planets out more on log than linear", () => {
      const { container, rerender } = render(<SolarSystem paused scale="linear" />);
      const linear = fromSun(container, "Mars") - fromSun(container, "Mercury");
      rerender(<SolarSystem paused scale="log" />);
      expect(fromSun(container, "Mars") - fromSun(container, "Mercury")).toBeGreaterThan(linear * 2);
    });
  });

  describe("moons", () => {
    const moonPlace = (container: HTMLElement, name: string) => {
      const [x, y] = container.querySelector(`[data-moon=${name}] > g`)!.getAttribute("transform")!.match(/-?[\d.]+/g)!.map(Number);
      return { x: x!, y: y! };
    };

    it("puts smaller hot dogs round their planets, each named", () => {
      const { container } = render(<SolarSystem paused />);
      expect(container.querySelectorAll("[data-moon]")).toHaveLength(21);
      expect(planet(container, "Earth").querySelector("[data-moon=Moon]")).toHaveTextContent("Moon🌭");
      expect(planet(container, "Jupiter").querySelectorAll("[data-moon]")).toHaveLength(4);
      expect(planet(container, "Pluto").querySelector("[data-moon=Charon] title")).toHaveTextContent("Charon");
      expect(screen.getByRole("img")).toHaveAccessibleName(/Smaller hot dogs go round them as moons/);
      const size = (selector: string) => Number(container.querySelector(selector)!.getAttribute("font-size"));
      expect(size("[data-moon=Ganymede] text")).toBeLessThan(size("g[data-planet=Jupiter] > .solar-system__body"));
    });

    it("has every round moon, Saturn's seven and Uranus's five among them", () => {
      const { container } = render(<SolarSystem paused />);
      const names = (name: string) => [...planet(container, name).querySelectorAll<SVGGElement>("[data-moon]")].map((moon) => moon.dataset.moon);
      expect(names("Saturn")).toEqual(["Mimas", "Enceladus", "Tethys", "Dione", "Rhea", "Titan", "Iapetus"]);
      expect(names("Uranus")).toEqual(["Miranda", "Ariel", "Umbriel", "Titania", "Oberon"]);
    });

    it("keeps each planet's moons in order outwards, the furthest within twice the nearest's distance", () => {
      const { container } = render(<SolarSystem paused />);
      for (const name of ["Mars", "Jupiter", "Saturn", "Uranus"]) {
        const radii = [...planet(container, name).querySelectorAll(".solar-system__moon-blur")].map((ring) => Number(ring.getAttribute("r")));
        radii.slice(1).forEach((radius, index) => expect(radius, name).toBeGreaterThan(radii[index]!));
        expect(radii.at(-1)! / radii[0]!, name).toBeLessThanOrEqual(2 + 1e-9);
      }
      // Jupiter's are close enough together to keep the cube root of their real distances
      const jupiter = [...planet(container, "Jupiter").querySelectorAll(".solar-system__moon-blur")].map((ring) => Number(ring.getAttribute("r")));
      expect(jupiter.at(-1)! / jupiter[0]!).toBeCloseTo(Math.cbrt(1_882_700 / 421_800));
    });

    it("leaves them out with moons={false}", () => {
      const { container } = render(<SolarSystem paused moons={false} />);
      expect(planet(container, "Earth")).toBeInTheDocument();
      expect(container.querySelector("[data-moon]")).not.toBeInTheDocument();
      expect(screen.getByRole("img")).not.toHaveAccessibleName(/moons/);
    });

    it("puts the Moon between Earth and the Sun at the eclipse of 8 April 2024", () => {
      const { container } = render(<SolarSystem paused date={Date.UTC(2024, 3, 8, 18, 18)} />);
      const earth = placeOf(container, "Earth");
      const moon = moonPlace(container, "Moon");
      const toSun = Math.atan2(-earth.y, -earth.x);
      const toMoon = Math.atan2(moon.y, moon.x); // the Moon's place is from Earth's middle
      expect(Math.abs((((toMoon - toSun) * 180) / Math.PI + 540) % 360 - 180)).toBeLessThan(2);
    });

    it("keeps each moon the same distance from its planet as they go round", () => {
      const { container } = render(<SolarSystem date={Date.UTC(2026, 0, 1)} />);
      const reach = () => Math.hypot(moonPlace(container, "Titan").x, moonPlace(container, "Titan").y);
      const [before, place] = [reach(), moonPlace(container, "Titan")];
      wait(500);
      expect(moonPlace(container, "Titan")).not.toEqual(place);
      expect(reach()).toBeCloseTo(before);
    });

    it("blurs moons too fast to follow, only while they're going round", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { container, rerender } = render(<SolarSystem date={Date.UTC(2026, 0, 1)} speed={30} />);
      const fast = () => container.querySelectorAll("[data-moon][data-fast]").length;
      expect(container.querySelectorAll("[data-moon]")).toHaveLength(21);
      expect(fast()).toBe(0); // a month a second: every moon is slow enough to watch
      rerender(<SolarSystem date={Date.UTC(2026, 0, 1)} speed={3650} />);
      wait(100);
      expect(fast()).toBe(21);
      await user.click(screen.getByRole("button", { name: "Pause" }));
      expect(fast()).toBe(0);
    });
  });

  describe("ruler", () => {
    const marksOf = (container: HTMLElement) =>
      [...container.querySelectorAll<HTMLElement>(".solar-system__ruler-mark")].map((mark) => ({
        distance: Number(mark.dataset.distance),
        left: parseFloat(mark.style.left), // a percentage of the picture's width
        number: mark.textContent,
      }));

    it("isn't there by default", () => {
      const { container } = render(<SolarSystem paused />);
      expect(container.querySelector(".solar-system")).toBeInTheDocument();
      expect(container.querySelector(".solar-system__ruler")).not.toBeInTheDocument();
    });

    it("marks distances from the Sun in AU, outwards from under its middle, hidden from screen readers", () => {
      const { container } = render(<SolarSystem paused ruler />);
      const ruler = container.querySelector(".solar-system__ruler")!;
      expect(ruler).toHaveAttribute("aria-hidden", "true");
      expect(ruler).toHaveTextContent("AU from the Sun");
      expect(container.querySelector<HTMLElement>(".solar-system__ruler-line")!.style.left).toBe("50%");
      const marks = marksOf(container);
      expect(marks.map((mark) => mark.distance)).toEqual([1, 2, 5, 10, 20, 30, 40, 50]);
      marks.slice(1).forEach((mark, index) => expect(mark.left).toBeGreaterThan(marks[index]!.left));
      expect(marks[0]!.left).toBeGreaterThan(50);
    });

    it("spaces its marks evenly on linear, like a map's scale bar", () => {
      const { container } = render(<SolarSystem paused ruler scale="linear" />);
      const left = Object.fromEntries(marksOf(container).map((mark) => [mark.distance, mark.left]));
      expect(left[20]! - left[10]!).toBeCloseTo(left[30]! - left[20]!);
      expect(left[50]! - left[40]!).toBeCloseTo(left[20]! - left[10]!);
    });

    it("draws an AU near the Sun longer than one far out, on the other scales", () => {
      for (const scale of ["sqrt", "log", "even"] as const) {
        const { container, unmount } = render(<SolarSystem paused ruler scale={scale} />);
        const left = Object.fromEntries(marksOf(container).map((mark) => [mark.distance, mark.left]));
        expect(left[2]! - left[1]!, scale).toBeGreaterThan((left[50]! - left[40]!) / 10); // each, per AU
        unmount();
      }
    });

    it("numbers the furthest mark, and only marks with room for their numbers", () => {
      for (const scale of ["linear", "sqrt", "log", "even"] as const) {
        const { container, unmount } = render(<SolarSystem paused ruler scale={scale} />);
        const numbered = marksOf(container).filter((mark) => mark.number);
        expect(numbered.at(-1)).toMatchObject({ distance: 50, number: "50" });
        numbered.forEach((mark) => expect(mark.number).toBe(String(mark.distance)));
        numbered.slice(1).forEach((mark, index) => expect(mark.left - numbered[index]!.left, scale).toBeGreaterThan(7)); // 0.16 of the 2.24 across
        expect(numbered.length, scale).toBeLessThan(8); // some are too close to number, on every scale
        unmount();
      }
    });

    it("moves its marks with the scale", () => {
      const { container, rerender } = render(<SolarSystem paused ruler scale="linear" />);
      const linear = marksOf(container)[0]!.left;
      rerender(<SolarSystem paused ruler scale="log" />);
      expect(marksOf(container)[0]!.left).toBeGreaterThan(linear);
    });
  });

  it("types: scale is one of four, and date a Date or a timestamp", () => {
    expectTypeOf<SolarSystemProps["scale"]>().toEqualTypeOf<"linear" | "sqrt" | "log" | "even" | undefined>();
    expectTypeOf<SolarSystemProps["date"]>().toEqualTypeOf<Date | number | undefined>();
  });
});
