import { useId, useMemo, useState } from "react";
import list from "../../docs/reading-list.json";
import { Checkbox } from "../components/Checkbox";
import { CheckboxGroup } from "../components/CheckboxGroup";
import { Input } from "../components/Input";
import { Segment, SegmentedControl } from "../components/SegmentedControl";
import "./reading-list.css";

/* The reading list as a page you can search and filter, from docs/reading-list.json. The standalone page
   (docs/reading-list.html, scripts/reading-list-page.js) does the same without React; keep the two in step. */

type Group = { id: string; name: string; kind: string; intro?: string };
type Topic = { id: string; name: string; group: string; intro?: string };
type System = { id: string; name: string; url: string };
type Link = { title: string; url: string; topics: string[]; system?: string; note?: string };

const groups: Group[] = list.groups;
const topics: Topic[] = list.topics;
const systems: System[] = list.systems;
const links: Link[] = list.links;

const allSystemIds = systems.map((s) => s.id);
const systemById = new Map(systems.map((s) => [s.id, s]));
const topicById = new Map(topics.map((t) => [t.id, t]));
const topicsIn = (group: Group) => topics.filter((t) => t.group === group.id);
const systemTopics = groups.filter((g) => g.kind === "systems").flatMap(topicsIn);

/** Everything a search can match: the title, note, system, and topic names. */
const haystack = new Map(
  links.map((link) => [
    link,
    [link.title, link.note, link.system && systemById.get(link.system)?.name, ...link.topics.map((t) => topicById.get(t)?.name)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  ]),
);

function LinkCard({ title, items }: { title?: string; items: Link[] }) {
  return (
    <div className="rl-card">
      {title && <h4>{title}</h4>}
      <ul>
        {items.map((link) => (
          <li key={link.url + link.title} className="rl-link">
            <a href={link.url}>{link.title}</a>
            {link.note && <p className="rl-link__note">{link.note}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReadingList() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"topic" | "system">("topic");
  const [chosenSystems, setChosenSystems] = useState<string[]>(allSystemIds);
  const [topic, setTopic] = useState("");
  const topicId = useId();

  const allChosen = chosenSystems.length === allSystemIds.length;
  const systemsSummary = allChosen
    ? "All"
    : chosenSystems.length === 1
      ? systemById.get(chosenSystems[0]!)!.name
      : `${chosenSystems.length} of ${allSystemIds.length}`;

  const shown = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return links.filter(
      (link) =>
        (allChosen || chosenSystems.includes(link.system ?? "")) &&
        (!topic || link.topics.includes(topic)) &&
        words.every((word) => haystack.get(link)!.includes(word)),
    );
  }, [query, allChosen, chosenSystems, topic]);

  // A link can cover several topics; with a topic chosen, show only that one
  const shownTopic = (t: Topic) => !topic || t.id === topic;

  const sections =
    view === "topic"
      ? groups.flatMap((group) => {
          const blocks = topicsIn(group).filter(shownTopic).flatMap((t) => {
            const inTopic = shown.filter((l) => l.topics.includes(t.id));
            if (!inTopic.length) return [];
            const cards =
              group.kind === "reading"
                ? [<LinkCard key="all" items={inTopic} />]
                : systems.flatMap((s) => {
                    const items = inTopic.filter((l) => l.system === s.id);
                    return items.length ? [<LinkCard key={s.id} title={s.name} items={items} />] : [];
                  });
            return [
              <section key={t.id} className="rl-topic">
                <h3>{t.name}</h3>
                {t.intro && <p className="rl-intro">{t.intro}</p>}
                <div className="rl-cards">{cards}</div>
              </section>,
            ];
          });
          if (!blocks.length) return [];
          return [
            <section key={group.id} className="rl-group">
              <h2>{group.name}</h2>
              {group.intro && <p className="rl-intro">{group.intro}</p>}
              {blocks}
            </section>,
          ];
        })
      : [
          ...systems.flatMap((s) => {
            const inSystem = shown.filter((l) => l.system === s.id);
            if (!inSystem.length) return [];
            return [
              <section key={s.id} className="rl-group">
                <h2>
                  <a href={s.url}>{s.name}</a>
                </h2>
                <div className="rl-cards">
                  {systemTopics.filter(shownTopic).flatMap((t) => {
                    const items = inSystem.filter((l) => l.topics.includes(t.id));
                    return items.length ? [<LinkCard key={t.id} title={t.name} items={items} />] : [];
                  })}
                </div>
              </section>,
            ];
          }),
          ...(() => {
            const other = shown.filter((l) => !l.system);
            if (!other.length) return [];
            return [
              <section key="other" className="rl-group">
                <h2>Articles and standards</h2>
                <div className="rl-cards">
                  {topics.filter(shownTopic).flatMap((t) => {
                    const items = other.filter((l) => l.topics.includes(t.id));
                    return items.length ? [<LinkCard key={t.id} title={t.name} items={items} />] : [];
                  })}
                </div>
              </section>,
            ];
          })(),
        ];

  return (
    <div className="rl">
      <form className="rl-filters" role="search" aria-label="Filter the reading list" onSubmit={(event) => event.preventDefault()}>
        <Input label="Search" type="search" autoComplete="off" placeholder="Checkbox, tokens, or Atlassian" value={query} onChange={(event) => setQuery(event.target.value)} />
        <SegmentedControl label="Group by" value={view} onValueChange={(value) => setView(value as "topic" | "system")}>
          <Segment value="topic">Topic</Segment>
          <Segment value="system">System</Segment>
        </SegmentedControl>
        <div className="rl-field">
          <label htmlFor={topicId}>Topic</label>
          <select id={topicId} value={topic} onChange={(event) => setTopic(event.target.value)}>
            <option value="">All topics</option>
            {groups.map((g) => (
              <optgroup key={g.id} label={g.name}>
                {topicsIn(g).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <details className="rl-systems">
          <summary>
            <span className="rl-systems__label">Systems</span> <span className="rl-systems__value">{systemsSummary}</span>
          </summary>
          <CheckboxGroup
            className="rl-systems__options"
            aria-label="Systems to show"
            value={chosenSystems}
            onValueChange={setChosenSystems}
            allValues={allSystemIds}
          >
            <Checkbox parent>All systems</Checkbox>
            {systems.map((s) => (
              <Checkbox key={s.id} value={s.id}>
                {s.name}
              </Checkbox>
            ))}
          </CheckboxGroup>
        </details>
      </form>
      <p className="rl-count" role="status">
        {shown.length === links.length ? `Showing all ${links.length} links.` : `Showing ${shown.length} of ${links.length} links.`}
      </p>
      <div className="rl-results">
        {sections.length ? sections : <p className="rl-empty">
            {chosenSystems.length ? "No links match. Try fewer words, or set Systems and Topic back to all." : "Tick at least one system to see its links."}
          </p>}
      </div>
    </div>
  );
}
