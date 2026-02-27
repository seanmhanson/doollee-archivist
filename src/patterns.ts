const DATE_COMPONENTS = {
  YEAR: "(?:(?:18|19)\\d{2}|20[0|1|2]\\d{1})",
  SHORT_MONTH: "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)",
  MONTH: "(?:January|February|March|April|May|June|July|August|September|October|November|December)",
  DAY: "(?:0?[1-9]{1}|[1-2]\\d{1}|3[0|1]{1})",
};

const COMBINED_MONTHS = `(?:${DATE_COMPONENTS.SHORT_MONTH}|${DATE_COMPONENTS.MONTH})`;

const DATE_PATTERNS = {
  YEAR: new RegExp(`^${DATE_COMPONENTS.YEAR}$`, "i"),
  SHORT_MONTH_YEAR: new RegExp(`^${DATE_COMPONENTS.SHORT_MONTH} ?${DATE_COMPONENTS.YEAR}$`, "i"),
  MONTH_YEAR: new RegExp(`^${COMBINED_MONTHS} ?${DATE_COMPONENTS.YEAR}$`, "i"),
  DAY_MONTH_YEAR: new RegExp(`^${DATE_COMPONENTS.DAY} ?${COMBINED_MONTHS} ?${DATE_COMPONENTS.YEAR}$`, "i"),
};

export { DATE_PATTERNS };
