# Workflow Best Practices
(author: Seán Hanson, drafting in progress May 11 2026)

## Overview of AI Integrated Workflow
Workflow-specific instructions are provided for integration with GitHub Copilot, and make up the middle portion of the workflow used in creation of this project. Specifically, the workflow documentation provides instructions to:

1. **Trigger the automated workflow** when a planning agent plan is approved for execution
2. **Open and name a clean feature branch** from the most recent main branch
3. **Execute the plan and commit** one or more sets of changes following execution
4. **Perform a self-review** in consideration of the code in isolation and as integrated into the broader application
5. **Perform verification checks** and iterate until passing
6. **Commit self-review/verification changes and open a new pull request** for the branch, requesting a review by the GitHub Copilot code review instance

The value of automated output will depend on your configuration and settings, but at a high level we can observe that three areas have a disproportionately significant impact, all reliant on manual review or consideration:
- input quality
- review standards
- iterative improvement

This reflects a basic machine learning principle that has not changed in the development of large language models: output quality is still a function of input quality and iterative feedback loops. The same discipline applied to improving these areas ultimately underpins this workflow.

## Pre-Planning (Quality of Input)
- create issues from high-level plans, and treat generated issues as drafts that must be rewritten manually once all related issues are opened
- this allows for mutual revisions and identification of which decisions are most important that may have been disregarded
- prepare supplemental materials for the ask and planning agent modes rather than only relying on documentation and code. This may including referencing other apps that do what you want, references to their repos, dependency docs specific with versions when appropriate, examples of data, edge cases and concerns, schemas and type definitions, established input/output contracts, or statistics (such as frequency tables) involving data or usage that can help predict future errors or behaviors
- evaluate if this is the correct time to make a given change to the degree discussed
- when ready to use the planning agent, you should already have identified the boundaries in scope and specific details the planning agent is likely to provide you
- use the planning agent not to make design decisions, but to catch how to distribute the technical workload, dependencies for parallel execution, the size and impact of the changesets, and facets of execution you would be more likely to stumble into understanding of partway through
- provide the planning agent any resources already provided to the ask agent
- saving the planning output before execution to allow for PR body generation when teh context window shifts; consequences thereof



## Meaningful Code Review (Review Standards)
- self-review and criteria in the instructions (reflection of manual review)
- multiple agent/platform reviewers
- skills, official plugins, and other resources to improve capability
- evergreen potential for revision of criteria 

## Manual Review (Iterative Improvement)
- reflection of the self-review criteria and approaches
- large scale/integration changes indicate potential improvement of input and discovery process
- small scale/code-specific changes indicate potential improvement of instructions involving style or other details
- regular tasks of reviewing the current context window and codebase to update instructions throughout development lifecycle
