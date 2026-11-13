// The date-fns locales DatePicker reads and shows dates with, so an app never installs date-fns itself:
//   import { enGB } from "design-system/date-locales";
// An app's bundler keeps only the locales it imports.
export * from "date-fns/locale";
