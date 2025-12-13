# Naming Standards

In the process of both scraping data and normalizing data, as well as later work at the database layer and beyond, consistent naming is more important than ever to ensure data is accurate and cna be readily accessed and surfaced when used. This is a sort of cheat-sheet reference to help promote this.

## Page Structure

For our purposes, Doollee is divided as below, with some individual exceptions:

- `home` - the homepage, containing links to the index pages for letters `A` through `Z`
- `index` - the top level organization of playwright links, broken into smaller named groupings like `aa-ad`
- `listing` - the mid level organization of playwright links, including individual names and links
- `profile` - the dedicated page for a given playwright

### Other details

- `playwright` is used for authors and adaptors of plays, to follow Doollee's existing naming. Note that `playwright` should never be used as a namespace for imports, to avoid collisions. Avoid namespaced imports or use `pw` instead.

### Page Object Models

For object models:

- `IndexPage`
- `ListingPage`
- `ProfilePage`

### Profile Pages

Profile pages may be broken out due to the size and division of content:

- `BiographySection`
- `WorksSection`

### Templates

Templates should be named to preserve meaning:

- `Standard` - the typical template for playwrights and plays
- `Adaptations` - the template used for prevoius playwrights and adaptations of their works
