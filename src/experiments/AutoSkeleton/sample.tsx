import { Badge } from "../../components/Badge";
import type { BadgeTone } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import { Input } from "../../components/Input";

/** Sample content for the stories and the How it works page: ordinary components, nothing skeleton-specific */

export interface Application {
  initials: string;
  role: string;
  company: string;
  applied: string;
  status: "Applied" | "Interview" | "Offer" | "Rejected";
}

export const applications: Application[] = [
  { initials: "NW", role: "Senior frontend engineer", company: "Northwind", applied: "3 November", status: "Interview" },
  { initials: "LH", role: "Design systems engineer", company: "Lighthouse Labs", applied: "28 October", status: "Offer" },
  { initials: "OB", role: "Staff engineer, web platform", company: "Orchard Bank", applied: "21 October", status: "Applied" },
];

/** What the list shows while it loads: never seen, only measured, so it just needs typical lengths */
export const placeholderApplications: Application[] = Array.from({ length: 3 }, () => ({
  initials: "AA",
  role: "Placeholder role title",
  company: "Company name",
  applied: "1 January",
  status: "Applied",
}));

const tones: Record<Application["status"], BadgeTone> = {
  Applied: "neutral",
  Interview: "warning",
  Offer: "success",
  Rejected: "danger",
};

const card = {
  background: "var(--surface)",
  border: "var(--border-thin) solid var(--border)",
  borderRadius: "var(--radius-lg)",
};

/** A list of job applications, each a card with an avatar, two lines of text, a status, and a button */
export function ApplicationList({ applications }: { applications: Application[] }) {
  return (
    <ul className="grid gap-3">
      {applications.map((application, index) => (
        <li key={index} className="flex items-center gap-3 p-4" style={card}>
          <span
            className="text-label inline-grid size-10 shrink-0 place-items-center"
            style={{ background: "var(--track)", borderRadius: "var(--radius-full)" }}
          >
            {application.initials}
          </span>
          <div className="grid min-w-0 flex-1 gap-1">
            <h3 className="text-body-strong">{application.role}</h3>
            <p className="text-small" style={{ color: "var(--ink-muted)" }}>
              {application.company}, applied on <strong>{application.applied}</strong>
            </p>
          </div>
          <Badge tone={tones[application.status]}>{application.status}</Badge>
          <Button variant="secondary" size="sm">
            View
          </Button>
        </li>
      ))}
    </ul>
  );
}

export interface Profile {
  name: string;
  email: string;
  about: string;
}

export const profile: Profile = {
  name: "Ada Okafor",
  email: "ada@example.com",
  about: "Frontend engineer who likes design systems, accessible forms, and well-named tokens.",
};

export const placeholderProfile: Profile = {
  name: "Placeholder",
  email: "placeholder",
  about: "A placeholder paragraph about as long as a typical one, so the skeleton has two lines here.",
};

/** A profile form in a card: a paragraph, two text fields, a checkbox, and a button */
export function ProfileForm({ profile }: { profile: Profile }) {
  return (
    <form className="grid gap-4 p-6" style={card} onSubmit={(event) => event.preventDefault()}>
      <h2 className="text-heading-sm">Your profile</h2>
      <p className="text-body">{profile.about}</p>
      <Input label="Full name" defaultValue={profile.name} />
      <Input label="Email" type="email" defaultValue={profile.email} />
      <Checkbox defaultChecked>Email me when an application changes</Checkbox>
      <div>
        <Button>Save changes</Button>
      </div>
    </form>
  );
}
