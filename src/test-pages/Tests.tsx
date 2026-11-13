import { useState, type ReactNode } from "react";
import { Markdown, Source } from "@storybook/addon-docs/blocks";
import {
  countTests,
  filesIn,
  storyCount,
  storyTests,
  testSources,
  unitTests,
  type TestGroup,
  type UnitTest,
} from "@/test-pages/parse";
import "@/test-pages/tests.css";

interface TestsProps {
  /** The component's folder, from src, such as "components/Button" */
  folder: string;
}

const fileName = (path: string) => path.slice(path.lastIndexOf("/") + 1);

/** "1 test", "2 tests", "1 story", "2 stories" */
const count = (number: number, word: string, plural = `${word}s`) => `${number} ${number === 1 ? word : plural}`;

/**
 * One line that opens to show its code. The code is only highlighted once it's opened, since a page can list a hundred
 * tests.
 */
function Row({ summary, children, code }: { summary: ReactNode; children?: ReactNode; code: string }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="tests__row" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="tests__summary">
        <span className="tests__text">{summary}</span>
      </summary>
      <div className="tests__body">
        {children}
        {open && <Source code={code} language="tsx" format={false} />}
      </div>
    </details>
  );
}

function UnitTestRow({ test }: { test: UnitTest }) {
  return (
    <Row
      code={test.code}
      summary={
        <>
          <span className="tests__name">{test.name.replace(/%[sdijo]/g, "…")}</span>
          {test.each && <span className="tests__note">once for each of {test.each}</span>}
          {test.types && <span className="tests__note">checked by pnpm typecheck</span>}
        </>
      }
    />
  );
}

function Group({ group, level }: { group: TestGroup; level: number }) {
  const Heading = level === 0 ? "h4" : "h5";
  return (
    <>
      {group.name && (
        <Heading className="tests__group sb-unstyled">
          {group.name.charAt(0).toUpperCase() + group.name.slice(1)}
        </Heading>
      )}
      {group.tests.length > 0 && (
        <div className="tests__list">
          {group.tests.map((test, index) => (
            <UnitTestRow key={index} test={test} />
          ))}
        </div>
      )}
      {group.groups.map((inner, index) => (
        // A file's single outer describe("Button") is the file itself, so its blocks start at the top level
        <Group key={index} group={inner} level={level + (group.name ? 1 : 0)} />
      ))}
    </>
  );
}

/** A file's tests, without the one describe block around them all that only repeats the component's name */
function unwrap(group: TestGroup) {
  return group.tests.length === 0 && group.groups.length === 1 ? { ...group.groups[0]!, name: "" } : group;
}

/**
 * Every test of one component, read from its test and story files when the page loads, so the list can't go out of
 * date. Each line is a test's name, and opens to show its code. For "Tests" pages.
 */
export function Tests({ folder }: TestsProps) {
  const { unit, stories } = filesIn(folder);
  const groups = unit.map((path) => ({ path, group: unwrap(unitTests(testSources[path]!)) }));
  const played = stories.map((path) => ({ path, tests: storyTests(testSources[path]!) }));
  const unitTotal = groups.reduce((sum, { group }) => sum + countTests(group), 0);
  const storyTotal = stories.reduce((sum, path) => sum + storyCount(testSources[path]!), 0);
  const playTotal = played.reduce((sum, { tests }) => sum + tests.length, 0);

  return (
    // Storybook's docs page stays white whatever the system's color scheme, so the tokens inside are pinned to the
    // light theme. Without it, a system in dark mode gets dark mode's near-white text on that white page.
    <div className="tests" data-theme="light">
      <p>
        These are read from the test files when the page loads, so they're always the tests that run. Open a line to
        see its code. <code>pnpm test</code> runs them all, and so does every push and pull request.
      </p>
      <ul className="tests__totals">
        <li>{count(unitTotal, "unit test")}</li>
        <li>{count(storyTotal, "story", "stories")} checked in the browser, {playTotal} of them with their own checks</li>
      </ul>

      <h2>Unit tests</h2>
      <p>
        Unit tests check behavior: props becoming attributes, ARIA state, the keyboard, callbacks, refs, and forms. They
        run in Vitest with Testing Library, in jsdom, a browser simulated in Node with no layout or real CSS. Tests marked
        "checked by pnpm typecheck" check types with <code>expectTypeOf</code>, so the compiler runs them rather than
        Vitest.
      </p>
      {groups.map(({ path, group }) => (
        <section key={path} className="tests__file">
          <h3>
            <code>{fileName(path)}</code> ({count(countTests(group), "test")})
          </h3>
          <Group group={group} level={0} />
        </section>
      ))}

      <h2>Storybook tests</h2>
      <p>
        Storybook's Vitest addon runs every story as a test in Chromium, with the real CSS. Each story has to render
        with no errors and pass axe, an automated accessibility checker, with no violations. Stories with a{" "}
        <code>play</code> function also run their own checks, listed here: things that need a real browser, such as
        sizes, hit areas, and computed styles.
      </p>
      {played.map(({ path, tests }) => (
        <section key={path} className="tests__file">
          <h3>
            <code>{fileName(path)}</code> ({count(storyCount(testSources[path]!), "story", "stories")},{" "}
            {tests.length} with a play function)
          </h3>
          {tests.length > 0 && (
            <div className="tests__list">
              {tests.map((story) => (
                <Row key={story.name} code={story.code} summary={<span className="tests__name">{story.name}</span>}>
                  {story.description && (
                    <div className="tests__description">
                      <Markdown>{story.description}</Markdown>
                    </div>
                  )}
                </Row>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
