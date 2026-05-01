<section align="center">
  <h1>Doollee Archivist</h1>

  ![Linting Status](https://github.com/seanmhanson/doollee-archivist/actions/workflows/lint-and-format.yml/badge.svg?branch=main)
  ![Unit Tests](https://github.com/seanmhanson/doollee-archivist/actions/workflows/unit-testing.yml/badge.svg?branch=main)
  ![Int Tests](https://github.com/seanmhanson/doollee-archivist/actions/workflows/integration-testing.yml/badge.svg?branch=main)

  <p>A set of scripts leveraging <a href="https://playwright.dev/" target="_blank">Playwright</a> to scrape, normalize, and preserve the playwright and play collection of Doolee.com and curate a modern online database and search interface for the works.</p>

  <h3>Phases:</h3>
  <div>
    ⌛  Scrape &nbsp;&nbsp;→&nbsp;&nbsp;
    ⏳  Normalize &nbsp;&nbsp;→&nbsp;&nbsp;
    🔳  Database &nbsp;&nbsp;→&nbsp;&nbsp;
    🔳  Search
  </div>

</section>

<section>
  <h2>FAQs</h2>

  <h3>What is Doollee?</h3>
  <p><a href="https://doollee.com" target="_blank">Doollee.com</a> is a massive online project spearheaded by <strong>Julian Oddy</strong> cataloging theatre plays that were written, adapted, or translated into English since the 1956 production of John Osborne's <em>Look Back in Anger</em> until 2021. Oddy spent his life curating this collection, and died in September 2022 at which time the website was maintained in tribute to his work and his person.</p>

  <h3>Why scrape and archive Doollee?</h3>

  <p>Doollee, while remaining online as a tribute, is no longer maintained. The site has accumulated usability issues over time from code written before XHTML/HTML5 standards, expired security certificates, 404s, and other bugs. At the same time, the value of the site and work is absolutely prodigous, often presenting significantly more information for younger and lesser known playwrights than other resources like wikipedia.</p>

  <p>Archiving this means:</p>
  <ul>
    <li>preserving Julian Oddy's work beyond a single source</li>
    <li>no longer requiring freinds and family to carry the burden of maintainance</li>
    <li>making this resource available more readily online</li>
    <li>allowing the curation of modern search for easier surfacing of plays and playwrights</li>
  </ul>
</section>

<section>
  <h2>Getting Started</h2>

  <h3>Prerequisites</h3>
  <ul>
    <li><a href="https://nodejs.org/" target="_blank">Node.js</a> 24.14.0 — <a href="https://github.com/nvm-sh/nvm" target="_blank">nvm</a> recommended; a <code>.nvmrc</code> is provided</li>
    <li><a href="https://yarnpkg.com/" target="_blank">Yarn</a> 4.12.0 — managed via Corepack (included with Node)</li>
  </ul>
  <p>A MongoDB instance is only required to run the scraper and analysis scripts locally. It is <strong>not</strong> required for the test suite, which uses an in-memory database automatically.</p>

  <h3>Setup</h3>
  <ol>
    <li>Clone the repository and navigate into it:
      <pre><code>git clone https://github.com/seanmhanson/doollee-archivist.git
cd doollee-archivist</code></pre>
    </li>
    <li>Switch to the required Node version:
      <pre><code>nvm use</code></pre>
    </li>
    <li>Enable Corepack and install dependencies:
      <pre><code>corepack enable
yarn install</code></pre>
    </li>
    <li>Install Playwright browser binaries:
      <pre><code>yarn playwright install</code></pre>
    </li>
    <li>Copy the example environment file and review the values:
      <pre><code>cp .env.example .env</code></pre>
    </li>
  </ol>

  <h3>Database (scripts only)</h3>
  <p>Choose one of the following options to start MongoDB before running any scraper or analysis scripts.</p>

  <p><strong>Option A — Docker (recommended)</strong></p>
  <p>Requires <a href="https://www.docker.com/products/docker-desktop/" target="_blank">Docker Desktop</a> or Docker Engine with the Compose plugin.</p>
  <pre><code>docker compose up -d
yarn db:init</code></pre>

  <p><strong>Option B — Local MongoDB</strong></p>
  <p>Install <a href="https://www.mongodb.com/try/download/community" target="_blank">MongoDB Community Edition 8.2</a>, start <code>mongod</code>, then:</p>
  <pre><code>yarn db:init</code></pre>

  <h3>Available Commands</h3>
  <table>
    <thead>
      <tr><th>Command</th><th>Description</th></tr>
    </thead>
    <tbody>
      <tr><td><code>yarn test</code></td><td>Run unit tests</td></tr>
      <tr><td><code>yarn test:int</code></td><td>Run integration tests</td></tr>
      <tr><td><code>yarn test:all</code></td><td>Run all tests</td></tr>
      <tr><td><code>yarn build:noEmit</code></td><td>Type-check without emitting</td></tr>
      <tr><td><code>yarn lint</code></td><td>Run ESLint</td></tr>
      <tr><td><code>yarn format</code></td><td>Run Prettier</td></tr>
      <tr><td><code>yarn scrape:all</code></td><td>Run the full scraping pipeline <em>(requires MongoDB)</em></td></tr>
      <tr><td><code>yarn analyze</code></td><td>Run field-presence and frequency analysis <em>(requires MongoDB and a completed scrape)</em></td></tr>
    </tbody>
  </table>
</section>
