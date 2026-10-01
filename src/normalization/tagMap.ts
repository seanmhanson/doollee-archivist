export type TagCategory = "genre" | "format" | "audience" | "representation";

export type TagDefinition = {
  canonical: string;
  category: TagCategory;
  // lowercase, exact-match phrases (includes known typos) recognized as this tag
  variants: string[];
};

// First-draft seed list derived from analysis/frequencies-genres.csv head terms.
// Coverage is refined empirically (see classifyGenreString's validation pass),
// not hand-completed here.
export const TAG_DEFINITIONS: TagDefinition[] = [
  // genre
  { canonical: "comedy", category: "genre", variants: ["comedy", "comedies", "comedic"] },
  { canonical: "drama", category: "genre", variants: ["drama", "dramas", "drana"] },
  {
    canonical: "musical",
    category: "genre",
    variants: ["musical", "musicals", "musicl", "music theatre", "music-theatre", "musiktheater"],
  },
  { canonical: "tragedy", category: "genre", variants: ["tragedy", "tragedies"] },
  {
    canonical: "tragicomedy",
    category: "genre",
    variants: ["tragicomedy", "tragi-comedy", "tragi comedy", "tragic comedy", "tragic-comedy", "tragi-com"],
  },
  { canonical: "dramedy", category: "genre", variants: ["dramedy", "dramady"] },
  { canonical: "farce", category: "genre", variants: ["farce", "farces", "farcical"] },
  { canonical: "melodrama", category: "genre", variants: ["melodrama", "melodramas", "melodramatic"] },
  { canonical: "satire", category: "genre", variants: ["satire", "satires", "satirical"] },
  { canonical: "mystery", category: "genre", variants: ["mystery", "mysteries"] },
  { canonical: "thriller", category: "genre", variants: ["thriller", "thrillers"] },
  { canonical: "horror", category: "genre", variants: ["horror"] },
  { canonical: "romance", category: "genre", variants: ["romance", "romantic"] },
  { canonical: "fantasy", category: "genre", variants: ["fantasy"] },
  {
    canonical: "science-fiction",
    category: "genre",
    variants: ["science fiction", "sci-fi", "scifi", "sci fi", "science-fiction"],
  },
  {
    canonical: "docudrama",
    category: "genre",
    variants: ["docudrama", "docu-drama", "docu drama", "documentary drama", "documentary"],
  },
  { canonical: "opera", category: "genre", variants: ["opera"] },
  { canonical: "operetta", category: "genre", variants: ["operetta"] },
  { canonical: "pantomime", category: "genre", variants: ["pantomime", "panto"] },
  { canonical: "revue", category: "genre", variants: ["revue"] },
  { canonical: "cabaret", category: "genre", variants: ["cabaret"] },
  {
    canonical: "biographical",
    category: "genre",
    variants: ["biographical", "biography", "biographic", "historical character", "historical characters"],
  },
  { canonical: "absurdist", category: "genre", variants: ["absurdist", "absurd", "theatre of the absurd"] },
  { canonical: "morality-play", category: "genre", variants: ["morality play", "morality"] },
  { canonical: "verse-drama", category: "genre", variants: ["verse play", "verse drama", "poetic drama"] },

  // format
  {
    canonical: "one-act",
    category: "format",
    variants: ["one act", "one-act", "1 act", "1-act", "one acts", "1 acts"],
  },
  { canonical: "full-length", category: "format", variants: ["full length", "full-length", "fulllength"] },
  { canonical: "short-play", category: "format", variants: ["short play", "short plays"] },
  {
    canonical: "ten-minute-play",
    category: "format",
    variants: ["ten minute play", "ten min", "10 min play", "10-minute play", "ten-minute play"],
  },
  {
    canonical: "monologue",
    category: "format",
    variants: ["monologue", "monologue play", "monolgue", "monolgue play"],
  },
  {
    canonical: "solo-show",
    category: "format",
    variants: ["solo show", "one man show", "one woman show", "one-man show", "one-woman show", "solo performance"],
  },
  {
    canonical: "adaptation",
    category: "format",
    variants: ["adaptation", "adaptaion", "adapatation", "adatation", "adaption"],
  },
  { canonical: "translation", category: "format", variants: ["translation", "tranlation", "tranaslation"] },
  { canonical: "radio-play", category: "format", variants: ["radio play"] },
  { canonical: "television-play", category: "format", variants: ["tv play", "television play", "teleplay"] },
  { canonical: "screenplay", category: "format", variants: ["screenplay"] },
  { canonical: "staged-reading", category: "format", variants: ["staged reading", "rehearsed reading", "reading"] },
  { canonical: "devised-piece", category: "format", variants: ["devised piece", "devised"] },
  { canonical: "site-specific", category: "format", variants: ["site specific", "site-specific"] },

  // audience (kept distinct per project decision, not collapsed into one tag)
  { canonical: "young-audiences", category: "audience", variants: ["tya", "youth audience", "youth audiences"] },
  {
    canonical: "childrens",
    category: "audience",
    variants: ["childrens", "children's", "childrens play", "chilidrens", "chrildren's"],
  },
  { canonical: "teens", category: "audience", variants: ["teenage", "teen", "teenagers", "young adult"] },

  // representation
  { canonical: "gay", category: "representation", variants: ["gay"] },
  { canonical: "lesbian", category: "representation", variants: ["lesbian"] },
  { canonical: "transgender", category: "representation", variants: ["transgender"] },
  { canonical: "aids", category: "representation", variants: ["aids"] },
];
