import { NUMBER_OR_WORD, SEP, parseAmount } from "./numberWords";

export type Duration = [hours: number, minutes: number, seconds: number];
export type DurationRange = [min: Duration, max: Duration];
export type ExtractedDuration = {
  durationRange?: DurationRange;
  duration?: Duration;
  prunedString: string;
};

type UnitKind = "h" | "m" | "s";
type TryResult = { match: RegExpMatchArray; duration?: Duration; durationRange?: DurationRange } | null;

// require the unit not be a prefix of a longer word (e.g. reject "h" inside "historical")
const UNIT_BOUNDARY = `(?!\\w)`;
const HOUR_RE = `h(?:ours?|rs?)?${UNIT_BOUNDARY}`;
// no boundary check: tolerates typo-glued trailing words ("mindrama", "minshort"),
// and typos "mmin"/"mijn", as well as min/mins/minute/minutes
const MINUTE_RE = `m{1,2}i{1,2}j?n(?:ute)?s?`;
const SECOND_RE = `sec(?:ond)?s?`;
const UNIT_ALT = `(?:${HOUR_RE}|${MINUTE_RE}|${SECOND_RE})`;
const RANGE_SEP = `\\s*(?:to|-|or|\\/)\\s*`;

const classifyUnit = (unit: string): UnitKind => {
  if (new RegExp(`^${HOUR_RE}$`, "i").test(unit)) return "h";
  if (new RegExp(`^${SECOND_RE}$`, "i").test(unit)) return "s";
  return "m";
};

const buildDuration = (amount: number, unitKind: UnitKind): Duration =>
  unitKind === "h" ? [amount, 0, 0] : unitKind === "s" ? [0, 0, amount] : [0, amount, 0];

const totalSeconds = ([hours, minutes, seconds]: Duration): number => hours * 3600 + minutes * 60 + seconds;

const cleanupPrunedString = (text: string): string =>
  text
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s.,-]+|[\s.,-]+$/g, "")
    .trim();

// two adjacent 2-digit runs glued together, e.g. "5070 min" meaning "50-70 min"
const trySplitDigitRange = (text: string): TryResult => {
  const match = /\b(\d{2})(\d{2})\s*min(?!\w)/i.exec(text);
  if (!match) return null;
  const a = parseInt(match[1], 10);
  const b = parseInt(match[2], 10);
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  return { match, durationRange: [buildDuration(lo, "m"), buildDuration(hi, "m")] };
};

const RANGE_REGEX = new RegExp(
  `(${NUMBER_OR_WORD})${SEP}(${UNIT_ALT})?${RANGE_SEP}(${NUMBER_OR_WORD})${SEP}(${UNIT_ALT})`,
  "i",
);
const tryExplicitRange = (text: string): TryResult => {
  const match = RANGE_REGEX.exec(text);
  if (!match) return null;
  const [, amountAText, unitAText, amountBText, unitBText] = match;
  const unitKindB = classifyUnit(unitBText);
  const unitKindA = unitAText ? classifyUnit(unitAText) : unitKindB;
  const durationA = buildDuration(parseAmount(amountAText), unitKindA);
  const durationB = buildDuration(parseAmount(amountBText), unitKindB);
  const [lo, hi] = totalSeconds(durationA) <= totalSeconds(durationB) ? [durationA, durationB] : [durationB, durationA];
  return { match, durationRange: [lo, hi] };
};

// compact "0h 30m" / "1h 0m" notation; bare "m" here isn't covered by MINUTE_RE
const tryCompactHourMinute = (text: string): TryResult => {
  const match = /(\d+)\s*h(?!\w)\s*(\d+)\s*m(?!\w)/i.exec(text);
  if (!match) return null;
  return { match, duration: [parseInt(match[1], 10), parseInt(match[2], 10), 0] };
};

const HOUR_MINUTE_COMBO_REGEX = new RegExp(
  `(${NUMBER_OR_WORD})${SEP}(${HOUR_RE})\\s*(?:and)?\\s*(${NUMBER_OR_WORD})${SEP}(${MINUTE_RE})`,
  "i",
);
const tryHourMinuteCombo = (text: string): TryResult => {
  const match = HOUR_MINUTE_COMBO_REGEX.exec(text);
  if (!match) return null;
  return { match, duration: [parseAmount(match[1]), parseAmount(match[3]), 0] };
};

const tryHalfHour = (text: string): TryResult => {
  const match = /half[\s-]*hour/i.exec(text);
  if (!match) return null;
  return { match, duration: [0, 30, 0] };
};

const tryHourLong = (text: string): TryResult => {
  const match = /hour[\s-]*long/i.exec(text);
  if (!match) return null;
  return { match, duration: [1, 0, 0] };
};

// "an hour" instead of "one hour" / "a hour"
const tryAnHour = (text: string): TryResult => {
  const match = /\ban? hour\b/i.exec(text);
  if (!match) return null;
  return { match, duration: [1, 0, 0] };
};

const SINGLE_HOUR_REGEX = new RegExp(`(${NUMBER_OR_WORD})${SEP}(${HOUR_RE})`, "i");
const trySingleHour = (text: string): TryResult => {
  const match = SINGLE_HOUR_REGEX.exec(text);
  if (!match) return null;
  return { match, duration: [parseAmount(match[1]), 0, 0] };
};

const SINGLE_MINUTE_REGEX = new RegExp(`(${NUMBER_OR_WORD})${SEP}(${MINUTE_RE})`, "i");
const trySingleMinute = (text: string): TryResult => {
  const match = SINGLE_MINUTE_REGEX.exec(text);
  if (!match) return null;
  return { match, duration: [0, parseAmount(match[1]), 0] };
};

const SINGLE_SECOND_REGEX = new RegExp(`(${NUMBER_OR_WORD})${SEP}(${SECOND_RE})`, "i");
const trySingleSecond = (text: string): TryResult => {
  const match = SINGLE_SECOND_REGEX.exec(text);
  if (!match) return null;
  return { match, duration: [0, 0, parseAmount(match[1])] };
};

// last resort for isolated bare-minute entries like "8m", "10m", "20 m"
const tryBareMinute = (text: string): TryResult => {
  const match = /(\d+)\s*m(?!\w)/i.exec(text);
  if (!match) return null;
  return { match, duration: [0, parseInt(match[1], 10), 0] };
};

// observed typo: "mi" missing the trailing "n" (e.g. "45 mi one act")
const tryTypoMinuteAbbreviation = (text: string): TryResult => {
  const match = new RegExp(`(${NUMBER_OR_WORD})${SEP}mi\\b`, "i").exec(text);
  if (!match) return null;
  return { match, duration: [0, parseAmount(match[1]), 0] };
};

const DURATION_ATTEMPTS: ((text: string) => TryResult)[] = [
  trySplitDigitRange,
  tryExplicitRange,
  tryCompactHourMinute,
  tryHourMinuteCombo,
  tryHalfHour,
  tryHourLong,
  tryAnHour,
  trySingleHour,
  trySingleMinute,
  trySingleSecond,
  tryBareMinute,
  tryTypoMinuteAbbreviation,
];

export const extractDuration = (genreString: string): ExtractedDuration => {
  for (const attempt of DURATION_ATTEMPTS) {
    const result = attempt(genreString);
    if (!result) continue;

    const index = result.match.index ?? 0;
    const prunedString = cleanupPrunedString(
      genreString.slice(0, index) + genreString.slice(index + result.match[0].length),
    );

    return {
      ...(result.duration ? { duration: result.duration } : {}),
      ...(result.durationRange ? { durationRange: result.durationRange } : {}),
      prunedString,
    };
  }

  return { prunedString: genreString };
};
