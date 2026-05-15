<h1 id="overview">Overview</h1>

Plays are listed only as embedded documents in the Doollee pages for playwrights, but exist with a dedicated id. Content for play entries are much more varied in their completion than playwright entries, and so just as playwright data was not always accessible via reliable CSS selectors and required some additional parsing, the same is true of plays. Excerpted examples are included in this directory, notably contrasting the same play when presented in a table template vs. a simple template, such as in the case of plays that are adaptations of classic works and are listed for both the author and the adaptor.

<h2 id="TOC">TOC</h2>
<ul>
  <li><a href="#simple-template">Simple Template Examples</a></li>
  <ul>
    <li><a href="#mamet">The Anarchist (Mamet)</a></li>
    <li><a href="#kane">What She Said (Kane)</a></li>
  </ul>
  <li><a href="#table-template">Simple/Table Template Pairs</a></li>
  <li><a href="#comparison">Template Comparisons</a></li>
</ul>

<br/><br/>

<h1 id="simple-template">Simple Template Examples</h1>

In the simple template examples, id tags are used repeatedly for each play entry, similarly to a class instead. As a result, it is necessary to iterate carefully through the data to avoid overwriting or skipping values.

<h2 id="mamet">The Anarchist (David Mamet)</h2>
🔗 <strong><a href="./mamet-anarchist.html">Example</a></strong>
<br/><br/>

- nearly all fields present (except "music" and "reference")
- production companies and publishers including dates
- multiple publishers, including one Doollee linked page
- multiple genres, joined by slashes
  <br/><br/>

<table>
  <thead>
    <tr>
      <th>Content</th>
      <th>Notes on Selectors</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>PlayId (Doollee)</td>
      <td><code>#playwrightTable > a</code><br/>on <code>name</code> attribute</td>
    </tr>
    <tr>
      <td>Title</td>
      <td><code>#playTable</code></td>
    </tr>
    <tr>
      <td>Image (alt name)</td>
      <td><code>#synopsisTitle > center > img</code><br/> on <code>alt</code> attribute</td>
    </tr>
    <tr>
      <td>Synopsis</td>
      <td><code>#synopsisName</code></td>
    </tr>
    <tr>
      <td>Notes</td>
      <td><code>#notesName</code></td>
    </tr>
    <tr>
      <td>First Production</td>
      <td><code>#producedPlace</code><br>(can include company and date)</td>
    </tr>
    <tr>
      <td>Organization(s)</td>
      <td><code>#companyName</code></td>
    </tr>
    <tr>
      <td>Publisher (in text)</td>
      <td><code>#publishedName</code><br>(can include company and date)</td>
    </tr>
    <tr>
      <td>Publisher (in link)</td>
      <td><code>#publishedName > a</code><br>(can include company and date)</td>
    </tr>
    <tr>
      <td>Music</td>
      <td><code>#musicName</code></td>
    </tr>
    <tr>
      <td>Genre</td>
      <td><code>#genreName</code></td>
    </tr>
    <tr>
      <td>Parts</td>
      <td><code>#partsMaletitle</code></td>
    </tr>
    <tr>
      <td>References</td>
      <td><code>#refname</code></td>
    </tr>
  </tbody>
</table>

<h2 id="kane">What She Said (Sarah Kane)</h2>
🔗 <strong><a href="./kane-what-she-said.html">Example</a></strong>
<br/><br/>

- minimal example (this was a student work by Kane)
- omitted: synopsis, image, notes, first production, organizations, first publication, music
- present: playId, title, genre, parts, reference,

See above for selectors; all tags exist, but most are empty content ("<code>-</code>")

<br/><br/>

<h1 id="table-template">Table Templates</h1>

Table values are not labeled programmmatically, but do have label text which can be parsed if needed. Otherwise, they maintain a consistent layout summarized below. Note: for actual selectors, see the comparison of the templates below.

<table>
  <thead>
    <tr><th>Content</th><th>Table</th><th>Row</th><th>Cell</th></tr>
  </thead>
  <tbody>
    <tr>
      <th style="border-bottom: 0;">PlayId</th>
      <td>1</td><td>1</td><td>1</td>
    </tr>
    <tr>
      <th style="border-bottom: 0;">Title</th>
      <td>1</td><td>2</td><td>1</td>
    </tr>
    </tbody>
    <tbody style="border-top: 1px solid ">
    <tr >
      <th style="border-bottom: 0;">Production Company</th>
      <td>2</td><td>1</td><td>2</td>
    </tr>
    <tr>
      <th style="border-bottom: 0;">Production Date</th>
      <td>2</td><td>1</td><td>3</td>
    </tr>
    <tr>
      <th style="border-bottom: 0;">Organizations</th>
      <td>2</td><td>2</td><td>2</td>
    </tr>
    <tr>
      <th style="border-bottom: 0;">Publisher</th>
      <td>2</td><td>3</td><td>2</td>
    </tr>
    <tr>
      <th style="border-bottom: 0;">ISBN</th>
      <td>2</td><td>3</td><td>4</td>
    </tr>
    <tr>
      <th style="border-bottom: 0;">Music</th>
      <td>2</td><td>4</td><td>2</td>
    </tr>
    <tr>
      <th style="border-bottom: 0;">Genre</th>
      <td>2</td><td>7</td><td>2</td>
    </tr>
    <tr>
      <th style="border-bottom: 0;">Male Parts</th>
      <td>2</td><td>8</td><td>3</td>
    </tr>
    <tr>
      <th style="border-bottom: 0;">Female Parts</th>
      <td>2</td><td>8</td><td>5</td>
    </tr>
    <tr>
      <th style="border-bottom: 0;">Other Parts</th>
      <td>2</td><td>9</td><td>2</td>
    </tr>
    <tr>
      <th style="border-bottom: 0;">Notes</th>
      <td>2</td><td>10</td><td>2</td>
    </tr>
    <tr>
      <th style="border-bottom: 0;">Synopsis</th>
      <td>2</td><td>11</td><td>2</td>
    </tr>
    <tr>
      <th style="border-bottom: 0;">Reference</th>
      <td>2</td><td>12</td><td>2</td> 
    </tr>
  </tbody>
</table>

<h2 id="#comparison">Template Comparison</h2>
<h3>Example: <em>Bakkhai</em>, Euripedes (trans. Anne Carson)</h3>
🔗 <strong><a href="./euripedes-carson-bakkhai.html">Table Template Example</a></strong><br/>
🔗 <strong><a href="./carson-bakkhai.html">Simple Template Example</a></strong>

<h3>Example: <em>Love Is My Sin</em>, Peter Brook<br/>(adapted from Sonnets by Shakespeare)</h3>
🔗 <strong><a href="./shakespeare-brook-love-is-my-sin.html">Table Template Example</a></strong><br/>
🔗 <strong><a href="./brook-love-is-my-sin.html">Simple Template Example</a></strong>

<h3> Selector Comparisons</h3>

<table>
  <thead>
    <tr>
    <th rowspan="2">Content</th>
    <th colspan="2" style="border-bottom:0; text-align: center;">
      Selectors
    </th>
    </tr>
    <tr>
      <th>Table Template</th>
      <th>Simple Template</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th style="border-bottom:0">PlayId</th>
      <td>
        <code>#playwrightTable > a</code>
        <br/>
        <small>on <code>name</code> attribute</small>
      </td>
      <td>
        <small>On preceding "header" table:</small>
        <br /><br />
        <code>tr > td:nth-child(1) > p > strong > a:nth-child(1)</code>
        <br/>
        <small>on <code>name</code> attribute</small>
      </td>
    </tr>
    <tr>
      <th style="border-bottom:0">Title</th>
      <td><code>#playTable</code></td>
      <td>
        <small>On preceding "header" table:</small>
        <br /><br />
        <code>tr > td:nth-child(2)</code>
      </td>
    </tr>
    <tr>
      <th style="border-bottom:0">Alt Name</th>
      <td>
        <code>#synopsisTitle > center > img</code><br/>
        <small>on <code>alt</code> attribute</small>
      </td>
      <td>-</td>
    </tr>
    <tr>
      <th style="border-bottom:0">Synopsis</th>
      <td><code>#synopsisName</code></td>
      <td>
        <code>tr:nth-child(11) > td:nth-child(2)</code>
      </td>
    </tr>
    <tr>
      <th style="border-bottom:0">Notes</th>
      <td>
        <code>#notesName</code>
      </td>
      <td>
        <code>tr:nth-child(10) > td:nth-child(2)
        </code>
      </td>
    </tr>
    <tr>
      <th style="border-bottom:0">Production</th>
      <td>
        <code>#producedPlace</code>
      </td>
      <td>
        <small>Location</small><br/>
        <code>tr:nth-child(1) > td:nth-child(2)</code>
        <br/><br/>
        <small>Date</small><br/>
        <code>tr:nth-child(1) > td:nth-child(3)</code>
      </td>
    </tr>
    <tr>
      <th style="border-bottom:0">Organizations</th>
      <td>
        <code>#companyName</code>
      </td>
      <td>
        <code>tr:nth-child(2) > td:nth-child(2)</code>
      </td>
    </tr>
    <tr>
      <th style="border-bottom:0">Publisher</th>
      <td>
        <code>#publishedName</code>
      </td>
      <td>
        <code>tr:nth-child(3) > td:nth-child(2)</code>
      </td>
    </tr>
    <tr>
      <th style="border-bottom:0">Music</th>
      <td>
        <code>#musicName</code>
      </td>
      <td>
        <code>tr:nth-child(4) > td:nth-child(2)</code>
      </td>
    </tr>
    <tr>
      <th style="border-bottom:0">Genre</th>
      <td>
        <code>#genreName</code>
      </td>
      <td>
        <code>tr:nth-child(7) > td:nth-child(2)</code>
      </td>
    </tr>
    <tr>
      <th style="border-bottom:0">Parts</th>
      <td>
        <code>#partsMaletitle</code>
      </td>
      <td>
        <small>Male Parts</small><br/>
        <code>tr:nth-child(8) > td:nth-child(3)</code>
        <br/><br/>
        <small>Female Parts</small><br/>
        <code>tr:nth-child(8) > td:nth-child(5)</code>
        <br/><br/>
        <small>Other Parts</small><br/>
        <code>tr:nth-child(9) > td:nth-child(2)</code>
      </td>
    </tr>
    <tr>
      <th style="border-bottom:0">References</th>
      <td>
        <code>#refname</code>
      </td>
      <td>
        <code>tr:nth-child(12) > td:nth-child(2)</code>
      </td>
    </tr>
    <tr>
      <th style="border-bottom:0">ISBN</th>
      <td>
        Optionally present at the end of <br/>text content from 
        <code>#publishedName</code>
      </td>
      <td>
        <code>tr:nth-child(3) > td:nth-child(4)</code>
      </td>
    </tr>
  </tbody>
</table>
