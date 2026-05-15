# Workflow Best Practices
(rev. May 15 2026)

[Workflow-specific instructions](/.github/instructions/plan-execution.instructions.md) are provided for integration with GitHub Copilot, but represent only the middle steps of the development process recommended for contributors to this project, regardless of AI tooling.

## Overview of AI Integrated Workflow

The automated workflow steps include:

1. **Trigger the automated workflow** whenever Plan agent output is approved
2. **Temporarily write the Plan agent output to disk** for later
3. **Open and name a clean feature branch** from the latest commit on main
4. Hand off the session to Agent mode, **execute the plan, and commit the changes**
5. **Perform a self-review** from a low-level and high-level perspective
6. **Perform verification checks** and iterate until passing
7. **Commit any changes since self-review and open a new pull request** for the branch, setting the Plan agent document and Agent mode self-review summary as the body, then requesting a GitHub Copilot PR review

Model choice and other details aside, this workflow follows an evergreen principle of machine learning: output quality is a function of input quality, processing, and iterative feedback. The workflow's output depends specifically on **input quality** (pre-planning and planning), **review standards** (the Agent self-review and GitHub Copilot review), and **iterative improvements** (using manual review to constantly improve these areas).

## Pre-Planning (Input Quality)

### Asking vs. Planning

First, a common misstep: planning starts with an Ask agent, not a Plan agent.

Ask agents excel at ingesting a problem and use its context and other resources to define it more formally. They build up answers in response to the request, resources, and codebase, answering "what" questions by piecing fragmented concerns into a unified response.

Plan agents excel at breaking down a larger, well-defined problem into actionable steps and required decisions, answering "how" questions with a plan that decomposes the Ask agent's output into a composite of specific contextual tasks.

Let an Ask agent answer "what", and let a Plan agent answer "how". Less-defined pieces of a task are gathered by an Ask agent into a unified overview of the work, which a Plan agent then decomposes into well-defined pieces, structured for execution.

### Ask Agents and Supplemental Materials

Present Ask agents with more than a prompt and codebase. Focused supplemental material closes the gap between how a feature is conceptualized and how it actually should behave in context. Selecting that material is individual to the task, but well-defined routine tasks and diffuse early-stage considerations benefit from different approaches.

Feature development for an established project benefits from:

- sample data from sources like production, staging, or fixtures
- document schemas, type definitions, and API definitions
- edge cases, areas of concern, previous bugs, and bugfixes
- empty test files to define verification requirements that may be easily skipped
- relevant pull requests and planning documentation from prior work
- statistical analysis of existing data, from descriptive (e.g. frequency tables for spotting anomalous distributions) to inferential (e.g. identifying prior behaviors that may disproportionately impact performance)

In `doollee-archivist`, simple [frequency tables](./example-frequencies.csv) describing the occurrence of fields in written documents have proven useful for spotting discrepancies that imply the presence of a bug, a problem in the source data, or an opportunity for better normalization.

For newer engineers, more abstract feature considerations, or early-stage codebases, supplemental material might instead include:

- an overview of how another application approaches the problem relative to the desired output
- open-source projects relevant to the task including full repository links, specific files, and common dependencies
- documentation, including user and technical docs, planned API specs, README files, or examples from other dependencies (ensuring the correct versions)

Regardless of available resources, direct questioning of an Ask agent helps answer the meta-question "how can I better ask this question?" When in doubt, ask:

- is there something I might be overlooking?
- is this the best time to make this change?
- is this the best tool for this task?
- is the testing for this non-trivial?
- is this a common approach within the current ecosystem?
- what type of data would help reduce uncertainty in designing this feature?
- how could different implementation options be judged before committing to only one?

### Handing Off to the Plan Agent

Before handing off a session window to a Plan agent, an Ask agent's output should cover the feature's primary concerns: behavior, scope, specific implementation concerns, data changes, predictable error-handling, and any technical considerations that have emerged thus far. Resources from the past phase can carry over directly, or be re-introduced and referenced.

Given these, a Plan agent can surface execution concerns that would otherwise appear mid-implementation, while addressing details like:

- areas requiring more precise decision-making and best options
- distribution of workload across the codebase and division of tasks across commits
- task priorities, order of execution, and efficient approaches to parallelism
- a well-defined size and description of a changeset's impact on the application
- exact verification requirements and test coverage modifications
- follow-up and deferred tasks such as migrations or premature optimizations

One practical detail in this workflow: the Plan agent saves its output to disk, preserving it independent of context window changes. When the PR is opened, the full plan is available for inclusion in the body alongside later feedback from execution and self-review, documenting the work from plan through completion.

## Meaningful Code Review (Review Standards)

It may seem redundant to perform a self-review immediately after using the same context window and agent to execute the plan. However, these tasks are substantially different. Borrowing a favorite term from philosophy, the agent executing changes is _teleological_, directed toward a specific outcome as it reads and writes files. The same agent performing a self-review is non-teleological, reading the same files without a predetermined outcome, allowing different evaluation. Even without further guidance, a self-review is worth adding to most workflows. With additional context and a structured framework though, it becomes one of the most valuable steps of the process.

In this workflow, the agent self-review divides into two categories: **functional alignment** (evaluation of the changeset in relation to the larger codebase) and **technical alignment** (evaluation of the changeset independently).

Functional alignment includes:

- alignment with the plan's intent, including scope and behavioral drift
- unplanned changes or impacts introduced in other areas of the codebase
- preservation of existing behaviors and integration across dependencies
- deferred or incomplete areas of work

Technical alignment includes more granular concerns prime for automation and refinement:

- accuracy, including assumptions about input/output data
- error-handling
- test coverage
- time and space efficiency
- code complexity
- readability and adherence to style conventions
- approachability for a new reader

Because the self-review is partly bounded by current context, the workflow immediately requests a GitHub Copilot pull request review once the PR is opened; in this project self-reviews are run with Claude and Copilot pull request reviews with GPT. Using multiple models for reviewing covers a larger surface area of concerns, and feedback passed between models helps to clarify technical concerns, rationale, surface alternative approaches, and preserve the engineer's role in decision-making.

## Manual Review (Iterative Improvement)

Manual review of pull requests is not oversight; it is the most valuable mechanism for guiding the iterative refinement of AI processes, which reduces future risk and reduces the demands of subsequent interventions. The same bifurcated approach used during self-reviews applies here as well.

### Functional Alignment: Refining Input

Functional alignment feedback operates at a large scale, identifying discrepancies across input, discovery, planning, and the resulting functionality. It points to changes in how engineers approach feature requests and to the comprehensiveness of approved plans. Refinements target three areas:

- refinement of input (providing stronger information upfront)
- refinement of agent usage (asking specific questions during planning)
- revision of copilot-instructions (improving project information for all future tasks)

In `doollee-archivist`, the database is used primarily as an indexed and searchable data store, with old data wiped on each scrape. Copilot frequently assumed otherwise, raising concerns about migrations and existing data. Manual review surfaced the pattern, and resulted in a small revision to copilot-instructions clarifying how to evaluate database usage.

### Technical Alignment: Refining Instruction

When focused on smaller-scale concerns, manual review feedback accumulates quickly. Avalanches of nitpicks in person-to-person reviews can prove counterproductive; here, it instead provides strong input for refining Copilot's documentation on style and consistency. Addressing these upfront and early reduces volume over time, while honing documents that guide other contributors regardless of AI usage.

In `doollee-archivist`, this emerged early around test coverage for work touching both new and existing files. Copilot's initial approach modified only immediately changed functionality, treating broader integration as tech debt until complete coverage was established and standardized. Revising the instructions in response to these comments established a clear approach to expanding test coverage at an early stage. Comments on testing are now rarely superficial.

When deciding how to handle these feedback cycles, I referred to documentation for [Anthropic's Claude Code plugin for managing instruction files](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/claude-md-management), and adapted two practices for my Copilot usage: revising instructions at regular intervals to maintain parity with the current codebase, and regularly integrating knowledge from the current context window. Built into the workflow, even if manually triggered, these practices bring the Copilot instructions closer to a living document, evolving alongside the codebase, and freeing engineering resources for the work that requires judgment.

These cycles of re-examining input, processing, and review are powerful in their simplicity, but they are not tools for increasing the speed or volume of output. They reduce noise, hone accuracy, better integrate differing yet concurrent concerns, and heighten our participation in the development lifecycle. Speed improves as a byproduct, but intentional consistency in engineering responsibility results in reduced risk, fewer unknowns, and confidence in handling whatever may arise.
