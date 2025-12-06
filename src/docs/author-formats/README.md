<h1 id="overview">Overview</h1>

Author pages come in various templates, with text content that isn't always accessible via reliable CSS selectors and may require xpath selectors or actual traversal of the DOM. Excerpted examples are included in this directory for reference and planning/troubleshooting.

<h2 id="TOC">TOC</h2>
<ul>
  <li><a href="#simple-template"/>Simple Template Examples</a></li>
  <ul>
    <li><a href="#mcdonagh"/>Martin McDonagh</a></li>
    <li><a href="#mamet"/>David Mamet</a></li>
    <li><a href="#kane"/>Sarah Kane</a></li>
    <li><a href="#ashby-rock"/>Jonathan Ashby-Rock</a></li>
  </ul>
  <li><a href="#table-template"/>Table Template Examples</a></li>
  <ul>
    <li><a href="#shakespeare"/>Shakespeare</a></li>
    <li><a href="#7-84"/>7-84 Company</a></li>
  </ul>
</ul>

<br/><br/>

<h1 id="simple-template">Simple Template Examples</h1>

<h2 id="mcdonagh">Martin McDonagh</h2>

🔗 <strong><a href="./mcdonagh.html">Example</a></strong>

- living author with birth year
- author image
- known nationality, website, facebook link, literary agent
- unknown email address
- existing synopsis

<table>
  <thead>
    <tr>
      <th>Content</th>
      <th>Notes on Selectors</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Container</td>
      <td><code>#osborne</code></td>
    </tr>
    <tr>
      <td>Image</td>
      <td><code>#osborne > img</code></td>
    </tr>
    <tr>
      <td>Name</td>
      <td><code>.welcome > h1</code></td>
    </tr>
    <tr>
      <td>Dates</td>
      <td>
        <code>.welcome > h1</code><br/>
        <code>xpath=following-sibling::text()[1]</code>
      </td>
    </tr>
    <tr>
      <td>Nationality</td>
      <td>
        <code>strong:has-text("Nationality:")</code><br/>
        <code>xpath=following-sibling::text()[1]</code>
      </td>
    </tr>
    <tr>
      <td>Email</td>
      <td>
        <code>strong:has-text("email:")</code><br/>
        <code>xpath=following-sibling::text()[1]</code></td>
    </tr>
    <tr>
      <td>Website</td>
      <td><code>strong:has-text("Website:") > a</code></td>
    </tr>
    <tr>
      <td rowspan="2">Agent</td>
      <td>
        For agents listed on Doollee:<br/>
        <code>strong:has-text("Literary Agent") > a</code>
      </td>
    </tr>
    <tr>
      <td>
        For agents without a listed page:<br/>
        <code>strong:has-text("Literary Agent")</code><br/>
        <code>xpath=following-sibling::text()[1]</code>
      </td>
    </tr>
    <tr>
      <td>Bio</td>
      <td>(remaining text contents of container)</td>
    </tr>
  </tbody>
</table>

<h2 id="mamet">David Mamet</h2>

🔗 <strong><a href="./mamet.html">Example</a></strong>

Identical format as above, with two differences:

<h3>Literary Agents</h3>

```
<strong>Literary Agent:</strong>
<a href="../Agents/sAbrams.php" target="_self">
  Abrams Artists Agency
</a>
UK representative
<a href="../agents/kagency.php">
  the Agency (London) Ltd
</a>
```

<h3>Research Link</h3>

```
<strong>Research: </strong>
<a href="http://www.dramatistsguild.com/" target="_blank">
  Member of the Dramatists Guild of America (as at 2015)
</a>
</div> // #osborne
```

<h2 id="kane">Sarah Kane</h2>

🔗 <strong><a href="./kane.html">Example</a></strong>

Identical with one minor difference in parsing text.

<h3>Birth / Death Years</h3>

```
<span class="welcome">
  <h1>SARAH KANE</h1>
  (1971 - 1999)
</span>
```

<h2 id="ashby-rock">Jonathan Ashby-Rock</h2>

🔗 <strong><a href="./ashby-rock.html">Example</a></strong>

<h3>Missing Birth/Death Years</h3>

```
<span class="welcome">
  <h1>JONATHAN ASHBY-ROCK</h1>
</span>
```

<h3>Multiple Social Media</h3>

- two root level `a` tags to social media are listed between nationality and email address
- these are omitted from scarping but impact order of text

<h3>No Literary Agent</h3>

- the value for literary agent is "n/a"

<h3>Correction Footer</h3>

- a sitewide footer about submitting additional information is provided in the container as a root level `a` tag

```
<a href="../Main%20Pages/1submission.doc" target="_blank">
  please send corrections / additions to doollee as an attachment
  -&gt;download WORD submission template
</a>
```

<br/><br/>

<h1 id="table-template">Table Template Examples</h1>

For adaptations, companies, and other listed playwrights that do not use the typical author template, this information is significantly different in structure.

<h2 id="shakespeare">Shakespeare</h2>

🔗 <strong><a href="./shakespeare.html">Example</a></strong>

Shakespeare presents a most empty example of the table template used in these exceptions.

<table>
  <thead>
    <tr>
      <th>Content</th>
      <th>Notes on Selectors</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Container</td>
      <td><code>#table table:first-child</code></td>
    </tr>
    <tr>
      <th colspan="2"><br/>First Row</th>
    </tr>
  <tr>
    <td>Row</td>
    <td>
      Container > <code>tr:first-child</code>
      <br/>
      <small>Note: This is the only row containing multiple table cells</small>
    </td>
  </tr>
  <tr>
    <td>Image</td>
    <td>
      Row > <code>td:first-child > p > a > img</code><br/><br/>
      However, note that images with:
      <br/>
      <code>src="../Images-playwrights/Blank.gif"</code>
      <br/>
      are blank and should be omitted.
    </td>
  </tr>
  <tr>
    <td>Name</td>
    <td>Row > <code>td:nth-child(2) > h1</code></td>
  </tr>
  <tr>
    <th colspan="2"><br/>Second Row</th>
  </tr>
  <tr>
    <td>Row</td>
    <td><code>Container > tr:nth-child(2)</code></td>
  </tr>
  <tr>
    <td>Nationality</td>
    <td>
      <code>strong:has-text("Nationality:")</code><br/>
      <code>xpath=following-sibling::text()[1]</code>
    </td>
  </tr>
  <tr>
    <td>Email</td>
    <td>
      <code>strong:has-text("Email:")</code><br/>
      <code>xpath=following-sibling::text()[1]</code>
    </td>
  </tr>
  <tr>
    <td>Website</td>
    <td>
      <code>strong:has-text("Website:")</code><br/>
      <code>xpath=following-sibling::text()[1]</code>
    </td>
  </tr>
  <tr>
    <th colspan="2"><br/>Third Row</th>
  </tr>
  <tr>
    <td>Literary Agent</td>
    <td>
      <code>strong:has-text("Literary Agent")</code><br/>
      <code>xpath=following-sibling::text()[1]</code>
    </td>
  </tr>
  </tbody>
</table>

<h2 id="7-84">7-84 Company</h2>

🔗 <strong><a href="./7-84-company.html">Example</a></strong>

The page for the 7-84 Theater Company uses the template seen for Shakespeare, but with a few changes:

<h3>Images are Omitted</h3>

The table cell is instead preserved but blank:

```
<td width="15%" rowspan="3"></td>
```

<h3>Start and End Years are Provided in the Name</h3>

This content must be separated programmatically rather than by selectors:

```
<td width="85%">
  <h1>7:84 THEATRE COMPANY(1971 - 2008)</h1>
</td>
```

<h3>Address and Telephone Fields are Added</h3>

These are part of the same cell as the other fields, but in a separate container:

```
<td>
  <p>
    <strong>Nationality:</strong>
    British
    <strong>Email:</strong>
    n/a
    <strong>Website:</strong>
    n/a
  </p>
  <p>
    <strong>Address:</strong>
    n/a
    <br />
    <strong>Telephone:</strong>
    n/a
  </p>
</td>
```

<h3>A multi-paragraph bio is included, with some non-text content</h3>

This is presented outside the table referenced above. Note that some content may
require examining the `href` or other attributes of tags.

```
</table> // see above
<p>
  <b>7:84 Theatre Company (England) 1973-1984</b>:
  Scottish left-wing agitprop theatre group.

  // (...)

  <br /><br />
  <b>7:84 Theatre Company (Scotland) 1971-2008</b>:
  In 1973, it split into 7:84 (England) and 7:84 (Scotland).

  // (...)

  <br /><br />
  For archive material, please contact:
  <a href="mailto:s.harrower@nls.uk">
    Sally Harrower
  </a>, Manuscripts Curator,
  National Library of Scotland, George IV Bridge,
  Edinburgh, EH1 1EW, Scotland.
</p>
```
