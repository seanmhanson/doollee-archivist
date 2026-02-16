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
 * including optiosn for sorting by field vs count, and sort order
 */
function getSingleFrequencyPipeline({
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
function getSamplePipeline({ sampleSize = 10, randomSample = false }: SamplePipelineOptions) {
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
function getPartsFrequencyPipeline() {
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
function getDateFormatPipeline(field: string) {
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

    // run separate subpipelines on the categorized data and output frquency tables for each
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
function getFieldPresencePipeline(fields: string[]) {
  // Sanitize field names for output (replace dots with underscores)
  const sanitizeFieldName = (field: string) => field.replace(/\./g, "_");

  // Create projection object that converts each field to 1 if present, 0 if absent
  const projectionFields = fields.reduce(
    (acc, field) => {
      const sanitized = sanitizeFieldName(field);
      acc[sanitized] = { $cond: [{ $ifNull: [`$${field}`, false] }, 1, 0] };
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

export {
  getSingleFrequencyPipeline,
  getSamplePipeline,
  getPartsFrequencyPipeline,
  getDateFormatPipeline,
  getFieldPresencePipeline,
};
