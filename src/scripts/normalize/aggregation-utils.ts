type SingleFrequencyPipelineOptions = {
  fieldName: string;
  sortByField?: boolean;
  sortDescending?: boolean;
};

type SamplePipelineOptions = {
  sampleSize?: number;
  randomSample?: boolean;
};

/**
 * Generate a MongoDB aggregation pipeline that outputs a frequency table for a single field,
 * including options for sorting by field vs count, and sort order
 */
export function getSingleFrequencyPipeline({
  fieldName,
  sortByField = false,
  sortDescending = true,
}: SingleFrequencyPipelineOptions) {
  const groupField = `$${fieldName}`;
  const sortOrder = sortDescending ? -1 : 1;
  const sortField = sortByField ? fieldName : "count";
  const sortStage = { [sortField]: sortOrder };

  return [
    { $match: { [fieldName]: { $exists: true, $nin: ["", null] } } },
    { $group: { _id: groupField, count: { $sum: 1 } } },
    { $sort: sortStage },
    { $project: { _id: 0, [fieldName]: "$_id", count: 1 } },
  ];
}

/**
 * Generate a simple MongoDB aggregation pipeline that takes a sample of documents, either
 * by taking the top documents by id or by taking a random sample. Note: This method does not validate
 * the requirements for using $sample for random sampling; this should be done in advance by the caller.
 */
export function getSamplePipeline({ sampleSize = 10, randomSample = false }: SamplePipelineOptions) {
  if (randomSample) {
    return [{ $sample: { size: sampleSize } }];
  }
  return [{ $sort: { _id: 1 } }, { $limit: sampleSize }];
}

/**
 * This generates a MongoDB aggregation pipeline that specifically creates frequency tables for
 * male, female, and other parts for a given play. If the play has corresponding text fields for
 * these parts, the pipeline will also count the frequency of their content. Frequencies are
 * sorted into male, female, other, and total counts.
 */
export function getPartsFrequencyPipeline() {
  const labels = [
    {
      header: "male",
      primaryField: "maleParts",
      textField: "$partsTextMale",
    },
    {
      header: "female",
      primaryField: "femaleParts",
      textField: "$partsTextFemale",
    },
    {
      header: "other",
      primaryField: "otherParts",
      textField: "$partsTextOther",
    },
  ];

  const input = labels.map(({ header: type, textField: text }) => {
    return { type, text };
  });

  const groupings = labels.reduce(
    (acc, { header, primaryField: key }) => {
      const condition = { $eq: ["$parts.type", header] };
      acc[key] = { $sum: { $cond: [condition, 1, 0] } };
      return acc;
    },
    {} as Record<string, unknown>,
  );

  const projections = labels.reduce(
    (acc, { primaryField: key }) => {
      acc[key] = 1;
      return acc;
    },
    {} as Record<string, unknown>,
  );

  return [
    // Reshape each document into an array of {type, text} objects
    {
      $project: {
        parts: {
          $filter: {
            input,
            as: "part",
            cond: {
              $and: [{ $ne: ["$$part.text", null] }, { $ne: ["$$part.text", ""] }],
            },
          },
        },
      },
    },

    // Flatten the array
    { $unwind: "$parts" },

    // Group by text, counting total and per-type occurrences
    { $group: { _id: "$parts.text", frequency: { $sum: 1 }, ...groupings } },

    // Sort by total frequency descending
    { $sort: { frequency: -1 } },

    // Clean up the output
    { $project: { _id: 0, text: "$_id", frequency: 1, ...projections } },
  ];
}

/**
 * Generate a MongoDB aggregation pipeline that reads a date field and categories the format into:
 * - Four-digit year (e.g. "1999")
 * - Day Month Year with abbreviated month (e.g. "5 Jan 1999")
 * - Day Month Year with full month (e.g. "5 January 1999")
 * - Other (any format that doesn't match the above)
 * The output is a frequency table for each category, sorted by frequency descending.
 */
export function getDateFormatPipeline(field: string) {
  const dayRegex = `[0-3]?[0-9]`;
  const yearRegex = `[1-2][0-9]{3}`;
  const abbreviatedMonths = `Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec`;
  const fullMonths = `January|February|March|April|May|June|July|August|September|October|November|December`;

  const fourDigitYear = `^${yearRegex}$`;
  const dayMonthAbbrevYear = `^${dayRegex} (${abbreviatedMonths}) ${yearRegex}$`;
  const dayMonthFullYear = `^${dayRegex} (${fullMonths}) ${yearRegex}$`;

  const initialMatchStage = { $match: { [field]: { $exists: true, $ne: "" } } };
  const fourDigitYearCase = { $regexMatch: { input: `$${field}`, regex: fourDigitYear } };
  const dayMonthAbbrevYearCase = { $regexMatch: { input: `$${field}`, regex: dayMonthAbbrevYear, options: "i" } };
  const dayMonthFullYearCase = { $regexMatch: { input: `$${field}`, regex: dayMonthFullYear, options: "i" } };

  const getFacetPipeline = (category: string) => [
    { $match: { _dateCategory: category } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, value: "$_id", frequency: "$count" } },
  ];

  return [
    // Match documents with the field present and non-empty
    initialMatchStage,

    // Categorize these into groups based off of distinct formats, to help avoid
    // processing the same documents more than once when running separate pipelines
    {
      $addFields: {
        _dateCategory: {
          $switch: {
            branches: [
              { case: fourDigitYearCase, then: "fourDigitYear" },
              { case: dayMonthAbbrevYearCase, then: "dayMonthAbbrevYear" },
              { case: dayMonthFullYearCase, then: "dayMonthFullYear" },
            ],
            default: "other",
          },
        },
      },
    },

    // run separate sub-pipelines on the categorized data and output frequency tables for each
    {
      $facet: {
        fourDigitYear: getFacetPipeline("fourDigitYear"),
        dayMonthAbbrevYear: getFacetPipeline("dayMonthAbbrevYear"),
        dayMonthFullYear: getFacetPipeline("dayMonthFullYear"),
        other: getFacetPipeline("other"),
      },
    },
  ];
}

/**
 * Generate a MongoDB aggregation pipeline that counts how many documents have each
 * specified field present vs absent, returning a single count for each field.
 */
export function getFieldPresencePipeline(fields: string[]) {
  // Sanitize field names for output (replace dots with underscores)
  const sanitizeFieldName = (field: string) => field.replace(/\./g, "_");

  // Create projection object that converts each field to 1 if present (and non-null), 0 if absent/null
  const projectionFields = fields.reduce(
    (acc, field) => {
      const sanitized = sanitizeFieldName(field);
      acc[sanitized] = { $cond: [{ $ne: [`$${field}`, null] }, 1, 0] };
      return acc;
    },
    {} as Record<string, unknown>,
  );

  // Create group accumulator for each field
  const groupAccumulators = fields.reduce(
    (acc, field) => {
      const sanitized = sanitizeFieldName(field);
      acc[`${sanitized}_present`] = { $sum: `$${sanitized}` };
      return acc;
    },
    {} as Record<string, unknown>,
  );

  return [
    { $project: projectionFields },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        ...groupAccumulators,
      },
    },
    { $project: { _id: 0 } },
  ];
}

/**
 * Generate a MongoDB aggregation pipeline that projects publication and production data fields,
 * matching only documents where publishing or production info is present.
 */
export function getProdPubDataPipeline() {
  const matchFields = ["rawFields.publishingInfo", "rawFields.productionInfo"];
  const projectionFields = [
    "publisher",
    "publicationYear",
    "isbn",
    "productionLocation",
    "productionYear",
    ...matchFields,
  ];

  const matchOptions = matchFields.map((field) => ({ [field]: { $exists: true, $ne: null } }));
  const matchStage = { $match: { $or: matchOptions } };

  const projectOptions = projectionFields.reduce(
    (acc, field) => {
      acc[field] = 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const projectStage = { $project: projectOptions };

  return [matchStage, projectStage];
}

/**
 * Generate a MongoDB aggregation pipeline that splits compound genre strings on the ". - - "
 * delimiter, clusters terms by case-normalized value, and returns per-term variant lists and counts.
 * Also produces a facet counting documents with compound (multi-term) vs single-term genres.
 */
export function getGenreTermsPipeline() {
  const GENRE_DELIMITER = ". - - ";

  return [
    { $match: { genres: { $exists: true, $nin: ["", null] } } },
    {
      $addFields: {
        _genreTerms: {
          $map: {
            input: { $split: ["$genres", GENRE_DELIMITER] },
            as: "t",
            in: { $trim: { input: "$$t" } },
          },
        },
      },
    },
    {
      $facet: {
        terms: [
          { $unwind: "$_genreTerms" },
          {
            $group: {
              _id: { $toLower: "$_genreTerms" },
              variants: { $addToSet: "$_genreTerms" },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $project: { _id: 0, term: "$_id", variants: 1, count: 1 } },
        ],
        compoundStats: [
          {
            $group: {
              _id: null,
              compound: { $sum: { $cond: [{ $gt: [{ $size: "$_genreTerms" }, 1] }, 1, 0] } },
              single: { $sum: { $cond: [{ $eq: [{ $size: "$_genreTerms" }, 1] }, 1, 0] } },
            },
          },
          { $project: { _id: 0, compound: 1, single: 1 } },
        ],
      },
    },
  ];
}

/**
 * Generate a MongoDB aggregation pipeline that analyses the rawFields.publishingInfo field,
 * producing two facets: format-category frequency and inferred publisher name frequency.
 */
export function getPublishingInfoFormatsPipeline() {
  const CONTAINED_IN_REGEX = "Contained in:";
  const URL_REGEX = "https?://";
  const TRAILING_DASH_REGEX = " -$";
  const YEAR_REGEX = "[0-9]{4}";
  const ISBN_REGEX = "97[89][0-9]{10}";

  return [
    { $match: { "rawFields.publishingInfo": { $exists: true, $nin: ["", null] } } },
    {
      $facet: {
        formatCategories: [
          {
            $addFields: {
              _formatCategory: {
                $switch: {
                  branches: [
                    {
                      case: { $regexMatch: { input: "$rawFields.publishingInfo", regex: CONTAINED_IN_REGEX } },
                      then: "Contained in:",
                    },
                    {
                      case: { $regexMatch: { input: "$rawFields.publishingInfo", regex: URL_REGEX } },
                      then: "URL present",
                    },
                    {
                      case: { $regexMatch: { input: "$rawFields.publishingInfo", regex: TRAILING_DASH_REGEX } },
                      then: "ends with -",
                    },
                    {
                      case: { $regexMatch: { input: "$rawFields.publishingInfo", regex: ISBN_REGEX } },
                      then: "ISBN-like string",
                    },
                    {
                      case: { $regexMatch: { input: "$rawFields.publishingInfo", regex: YEAR_REGEX } },
                      then: "four-digit year embedded",
                    },
                  ],
                  default: "other",
                },
              },
            },
          },
          { $group: { _id: "$_formatCategory", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $project: { _id: 0, format: "$_id", count: 1 } },
        ],
        publisherNames: [
          {
            $addFields: {
              _publisherMatch: {
                $regexFind: { input: "$rawFields.publishingInfo", regex: "^.+?(?=,\\s|\\s-\\s|\\s\\(|$)" },
              },
            },
          },
          {
            $addFields: {
              _publisherName: {
                $trim: { input: { $ifNull: ["$_publisherMatch.match", "$rawFields.publishingInfo"] } },
              },
            },
          },
          { $group: { _id: "$_publisherName", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $project: { _id: 0, publisher: "$_id", count: 1 } },
        ],
      },
    },
  ];
}

/**
 * Generate a MongoDB aggregation pipeline that finds repeated values for a given text field,
 * returning values with count > 1 sorted by frequency, with each value truncated to 200 characters.
 */
export function getBoilerplateFrequencyPipeline(fieldName: string) {
  return [
    { $match: { [fieldName]: { $exists: true, $nin: ["", null] } } },
    { $group: { _id: `$${fieldName}`, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, value: { $substrCP: ["$_id", 0, 200] }, count: 1 } },
  ];
}

/**
 * Generate a MongoDB aggregation pipeline that counts plays where authorId is missing or null.
 */
export function getPlaysWithoutAuthorPipeline() {
  return [{ $match: { authorId: null } }, { $count: "count" }];
}

/**
 * Generate a MongoDB aggregation pipeline that finds authors whose doolleePlayIds count
 * differs from their playIds count, returning up to 20 samples with mismatch details.
 */
export function getAuthorsWithPlayCountMismatchPipeline() {
  return [
    {
      $match: {
        $expr: {
          $ne: [{ $size: { $ifNull: ["$doolleePlayIds", []] } }, { $size: { $ifNull: ["$playIds", []] } }],
        },
      },
    },
    {
      $project: {
        _id: 0,
        displayName: 1,
        doolleeCount: { $size: { $ifNull: ["$doolleePlayIds", []] } },
        playCount: { $size: { $ifNull: ["$playIds", []] } },
      },
    },
    { $limit: 20 },
  ];
}
