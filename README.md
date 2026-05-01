<section align="center">
  <h1>Doollee Archivist</h1>

  ![Linting Status](https://github.com/seanmhanson/doollee-archivist/actions/workflows/lint-and-format.yml/badge.svg?branch=main)
  ![Unit Tests](https://github.com/seanmhanson/doollee-archivist/actions/workflows/unit-testing.yml/badge.svg?branch=main)
  ![Int Tests](https://github.com/seanmhanson/doollee-archivist/actions/workflows/integration-testing.yml/badge.svg?branch=main)

  <p>A set of scripts leveraging <a href="https://playwright.dev/" target="_blank" rel="noopener noreferrer">Playwright</a> to scrape, normalize, and preserve the playwright and play collection of doollee.com and curate a modern online database and search interface for the works.</p>

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

  <p><a href="https://doollee.com" target="_blank" rel="noopener noreferrer">Doollee.com</a> is a massive online project spearheaded by <strong>Julian Oddy</strong> cataloging theatre plays that were written, adapted, or translated into English since the 1956 production of John Osborne's <em>Look Back in Anger</em> until 2021. Oddy spent his life curating this collection, and died in September 2022 at which time the website was maintained in tribute to his work and his person.</p>

  <h3>Why scrape and archive Doollee?</h3>

  <p>Doollee, while remaining online as a tribute, is no longer maintained. The site has accumulated usability issues over time from code written before XHTML/HTML5 standards, expired security certificates, 404s, and other bugs. At the same time, the value of the site and work is absolutely prodigious, often presenting significantly more information for younger and lesser known playwrights than other resources like wikipedia.</p>

  <p>Archiving this means:</p>
  <ul>
    <li>preserving Julian Oddy's work beyond a single source</li>
    <li>no longer requiring friends and family to carry the burden of maintenance</li>
    <li>making this resource available more readily online</li>
    <li>allowing the curation of modern search for easier surfacing of plays and playwrights</li>
  </ul>
</section>

<section>
  <h2>Getting Started</h2>

  <h3>Prerequisites</h3>
  <table>
    <thead>
      <tr>
        <th>Dependency</th>
        <th>Version</th>
        <th>Supported Tooling</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <a href="https://nodejs.org/" target="_blank" rel="noopener noreferrer">
            Node.js
          </a>
        </td>
        <td><code>24.14.0</code></td>
        <td><a href="https://github.com/nvm-sh/nvm" target="_blank" rel="noopener noreferrer">Node Version Manager (nvm)</a></td>
        <td></td>
      </tr>
      <tr>
        <td>
          <a href="https://yarnpkg.com/" target="_blank" rel="noopener noreferrer">
            Yarn
          </a>
        </td>
        <td><code>4.12.0</code></td>
        <td><a href="https://yarnpkg.com/corepack" target="_blank" rel="noopener noreferrer">Corepack (Node)</a></td>
        <td></td>
      </tr>
      <tr>
      <td>
        <a href="https://www.mongodb.com/try/download/community" target="_blank" rel="noopener noreferrer">
          MongoDB 
        </a>
      </td>
      <td><code>8.2</code></td>
      <td><a href="https://www.docker.com/products/docker-desktop/" target="_blank" rel="noopener noreferrer">Docker Desktop</a></td>
      <td>Required for scraping and analysis scripts; not required for executing tests and other development</td>
      </tr>
    </tbody>
  </table>

  <h3>Setup</h3>

  <ol>
    <li>Clone the repository and navigate into it:
      <pre><code>git clone https://github.com/seanmhanson/doollee-archivist.git
cd doollee-archivist</code></pre>
    </li>
    <li>Switch to the required Node version: <pre><code>nvm use</code></pre></li>
    <li>Enable Corepack and install dependencies:
      <pre><code>corepack enable
yarn install</code></pre>
    </li>
    <li>Install Playwright browser binaries:
      <pre><code>yarn playwright install</code></pre>
    </li>
    <li>Copy the example environment file and review the default values:
      <pre><code>cp .env.example .env</code></pre>
    </li>
  </ol>

  <h3>Database (for scraping/analysis scripts)</h3>
  
  <h4>1. Install Docker / MongoDB</h4>
  You can find the installers for Docker Desktop and MongoDB in the prerequisites above.
  Additional options for installing MongoDB locally or using a hosted instance:

  - macOS users may wish to install MongoDB using <a href="https://brew.sh/" target="_blank" rel="noopener noreferrer">Homebrew</a>
  - Linux users may wish to install and then verify using <a href="https://www.mongodb.org/static/pgp/" target="_blank" rel="noopener noreferrer">the GPG keys provided by MongoDB</a>
  - MongoDB Atlas users can 
    <a href="https://www.mongodb.com/docs/manual/reference/connection-string/?deployment-type=atlas&amp;interface-atlas-only=atlas-cli" target="_blank" rel="noopener noreferrer">
      provide the URI string to their cluster</a> in their local <code>.env</code> file and ensure the cluster is running.

  <h4>2. Start the database (if not already running)</h4>
  
  <table>
  <thead><tr><th>Method / Documentation</th><th>Command</th></tr></thead>
    <tbody>
      <tr>
        <td>
        <a href="https://docs.docker.com/compose/" target="_blank" rel="noopener noreferrer">
        Docker Compose</a>
        </td>
        <td><pre><code>docker compose up -d --wait</code></pre></td>
      </tr>
      <tr>
        <td>
        <a href="https://docs.brew.sh/Manpage#services-subcommand" target="_blank" rel="noopener noreferrer">Homebrew (macOS)</a></td>
        <td><pre><code>brew services start mongodb-community</code></pre></td>
      </tr>
      <tr>
        <td><a href="https://man7.org/linux/man-pages/man1/systemctl.1.html" target="_blank" rel="noopener noreferrer">Linux (systemctl)</a></td>
        <td><pre><code>sudo systemctl start mongod</code></pre></td>
      </tr>
      <tr>
      <td><a href="https://www.mongodb.com/docs/manual/reference/program/mongod/" target="_blank" rel="noopener noreferrer">
        MongoDB (command line args)</a></td>
        <td><pre><code>mongod --port 27017</code></pre></td>
      </tr>
      <tr>
      <td><a href="https://www.mongodb.com/docs/manual/reference/configuration-options/" target="_blank" rel="noopener noreferrer">
        MongoDB (config file)</a></td>
        <td><pre><code>mongod --config /etc/mongod.conf</code></pre></td>
      </tr>
    </tbody>
  </table>

  <h4>3. Run DB Initialization Script(s)</h4>

  <table>
    <thead>
      <tr><th>Script</th><th>Command</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>
          Reset/Wipe Database (optional)
        </td>
        <td><pre><code>yarn db:reset</code></pre></td>
      </tr>
      <tr>
        <td>
          Initialize Database
        </td>
        <td><pre><code>yarn db:init</code></pre></td>
      </tr>
    </tbody>
  </table>
</section>

<section>
  <h2>Selected Available Commands</h2>
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