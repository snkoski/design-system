// Search, filter, and grouping for the standalone reading list page (docs/reading-list.html).
// build-reading-list.mjs inlines this file. The Storybook page does the same in React (src/foundations/ReadingList.tsx).
(() => {
  const data = JSON.parse(document.getElementById("rl-data").textContent);
  const results = document.getElementById("rl-results");
  const count = document.getElementById("rl-count");
  const form = document.querySelector(".rl-filters");
  const query = document.getElementById("rl-query");
  const systemBoxes = [...form.querySelectorAll('input[name="system"]')];
  const allBox = document.getElementById("rl-systems-all");
  const systemsValue = document.getElementById("rl-systems-value");
  const topicSelect = document.getElementById("rl-topic");

  const systems = new Map(data.systems.map((s) => [s.id, s]));
  const topics = new Map(data.topics.map((t) => [t.id, t]));
  const topicsIn = (group) => data.topics.filter((t) => t.group === group.id);
  const systemTopics = data.groups.filter((g) => g.kind === "systems").flatMap(topicsIn);

  // Everything a search can match: the title, note, system, and topic names
  const haystack = new Map(
    data.links.map((link) => [
      link,
      [link.title, link.note, systems.get(link.system)?.name, ...link.topics.map((t) => topics.get(t).name)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    ]),
  );

  const el = (tag, props = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === "class") node.className = value;
      else node.setAttribute(key, value);
    }
    for (const child of children.flat()) if (child != null && child !== false) node.append(child);
    return node;
  };
  const linkItem = (link, showSystem) =>
    el(
      "li",
      { class: "rl-link" },
      el("a", { href: link.url }, link.title),
      showSystem && link.system ? el("span", { class: "rl-link__system" }, systems.get(link.system).name) : null,
      link.note ? el("p", { class: "rl-link__note" }, link.note) : null,
    );
  const card = (title, links, showSystem = false) =>
    el("div", { class: "rl-card" }, title ? el("h4", {}, title) : null, el("ul", {}, links.map((l) => linkItem(l, showSystem))));

  function render() {
    const words = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const chosen = systemBoxes.filter((box) => box.checked).map((box) => box.value);
    const allChosen = chosen.length === systemBoxes.length;
    // "All systems" is ticked, unticked, or mixed, like any select-all box
    allBox.checked = allChosen;
    allBox.indeterminate = chosen.length > 0 && !allChosen;
    systemsValue.textContent = allChosen
      ? "All"
      : chosen.length === 1
        ? systems.get(chosen[0]).name
        : `${chosen.length} of ${systemBoxes.length}`;
    const topic = topicSelect.value;
    const view = form.elements.view.value;
    const shown = data.links.filter(
      (link) =>
        (allChosen || chosen.includes(link.system)) &&
        (!topic || link.topics.includes(topic)) &&
        words.every((word) => haystack.get(link).includes(word)),
    );
    const has = (filter) => shown.filter(filter);
    // A link can cover several topics; with a topic chosen, show only that one
    const shownTopic = (t) => !topic || t.id === topic;
    const sections = [];

    if (view === "topic") {
      for (const group of data.groups) {
        const blocks = [];
        for (const t of topicsIn(group).filter(shownTopic)) {
          const links = has((l) => l.topics.includes(t.id));
          if (!links.length) continue;
          const body =
            group.kind === "reading"
              ? [card(null, links)]
              : data.systems
                  .map((s) => [s, links.filter((l) => l.system === s.id)])
                  .filter(([, ls]) => ls.length)
                  .map(([s, ls]) => card(s.name, ls));
          blocks.push(el("section", { class: "rl-topic" }, el("h3", {}, t.name), t.intro ? el("p", { class: "rl-intro" }, t.intro) : null, el("div", { class: "rl-cards" }, body)));
        }
        if (blocks.length) sections.push(el("section", { class: "rl-group" }, el("h2", {}, group.name), group.intro ? el("p", { class: "rl-intro" }, group.intro) : null, blocks));
      }
    } else {
      for (const s of data.systems) {
        const links = has((l) => l.system === s.id);
        if (!links.length) continue;
        const cards = systemTopics
          .filter(shownTopic)
          .map((t) => [t, links.filter((l) => l.topics.includes(t.id))])
          .filter(([, ls]) => ls.length)
          .map(([t, ls]) => card(t.name, ls));
        sections.push(
          el("section", { class: "rl-group" }, el("h2", {}, el("a", { href: s.url }, s.name)), el("div", { class: "rl-cards" }, cards)),
        );
      }
      const other = has((l) => !l.system);
      if (other.length) {
        const cards = data.topics
          .filter(shownTopic)
          .map((t) => [t, other.filter((l) => l.topics.includes(t.id))])
          .filter(([, ls]) => ls.length)
          .map(([t, ls]) => card(t.name, ls));
        sections.push(el("section", { class: "rl-group" }, el("h2", {}, "Articles and standards"), el("div", { class: "rl-cards" }, cards)));
      }
    }

    results.replaceChildren(...sections);
    if (!sections.length) results.append(el("p", { class: "rl-empty" }, chosen.length ? "No links match. Try fewer words, or set Systems and Topic back to all." : "Tick at least one system to see its links."));
    count.textContent =
      shown.length === data.links.length ? `Showing all ${data.links.length} links.` : `Showing ${shown.length} of ${data.links.length} links.`;
  }

  form.addEventListener("input", (event) => {
    // Ticking "All systems" ticks or unticks every system before the list redraws
    if (event.target === allBox) for (const box of systemBoxes) box.checked = allBox.checked;
    render();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    results.focus();
  });

  // Themes: Auto follows the system setting; the others set data-theme on <html>
  const themeButtons = document.querySelectorAll("[data-theme-choice]");
  for (const button of themeButtons) {
    button.addEventListener("click", () => {
      const choice = button.dataset.themeChoice;
      if (choice === "auto") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.dataset.theme = choice;
      for (const b of themeButtons) b.setAttribute("aria-pressed", String(b === button));
    });
  }

  render();
})();
