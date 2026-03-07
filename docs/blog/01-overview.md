# Overview

I am not generally the type to spend a lot of time on open-source projects. I value them greatly both in terms of ethos and anxious awareness of how much we depend upon them for nearly everything (I was a web engineer during the [Left Pad](https://en.wikipedia.org/wiki/Npm_left-pad_incident) incident, as well as before JavaScript's ecosystem had widely adopted package management). But when it comes to my own focus outside of work, I find I never have the time I thought I had, and I never have a project that I feel passionately about enough.

This past year, though, I took time to reassess a lot of things outside of my work, and that changed. Life catches up fast. Parents get older. Fundamentals of Democracy shift. Step-families living abroad feel worlds away. Close friends become caretakers. So many things hit, and the last thing I expected to do was find myself pushing to GitHub. Then, one day as I was turning to British playwrights for a different kind of manifestation of everything around me, I ran into the first project that grabbed and shook me.

## Helicopter Systems and Fun Before Web 2.0

Julian Oddy (27 Sept 1946 - 17 Sept 2022) worked with helicopter systems by trade, but was better known and respected for playing a pivotal and unsung role in the preservation of British dramatic arts. Inspired by his wife Pat's prodigious collection of plays, he began a decades-long project in his free time to catalog these and other plays performed since 1976 in Britain online in 2003, creating the website [doollee.com](http://www.doolee.com), straddling the worlds of static sites and earlier dynamic pages that were developing at the time (The site's name, Doollee, has been said to come from the way his grandchildren [tried to pronounce his name](https://www.mcclernan.com/2010/11/tea-and-toasties.html)). 

He continued this work, ultimately also taking up editorship of _Theatre Record_ (previously _London Theatre Record_) in 2016 from Ian Shuttleworth, leading a transition online later completed by the next editor Allison Cook, when Julian stepped down in response to his wife Pat's stroke in 2021. Work on Doollee stopped at this point, and the website became a living memorial following [his death in 2022](https://archive.is/20231007025853/https://www.thestage.co.uk/obituaries--archive/obituaries/julian-oddy) and later [Pat's death in 2023](https://www.dorsetecho.co.uk/notice/30558923.pat-nee-archard-oddy/).

The scope of this work cannot be overstated: the homepage of Doollee last listed a total of **56,653** playwright records and **193,348** plays performed since 1976 in Britain. However, these totals appear to be an underestimate of what remains of the project today, from prior to Julian's death.

## Keeping "In-Yer-Face" In-Your-Face

I ran across Doollee when first researching the works of a handful of different playwrights in Britain during the mid 1990s largely associated with names like Sarah Kane. Along with works by Mark Ravenhill, Philip Ridley, and Martin McDonagh, these would later get the label "In-Yer-Face Theatre" by the author Aleks Sierz. Sierz coined the term when grouping together different playwrights focused on using shocking and upsetting content integrated as a core critique of the works and often structurally to prevent easy disengaging from the performances, in response to issues of significant brutality and violence globally and in other manners locally. Before the end of the 1990s, most of these playwrights had already begun to develop other works in other directions, except for the tragic death of Sarah Kane by suicide.

The relevance of these works today is frightening, while the ubiquitous violence and content feels like it has shifted from shocking to nearly quotidian given how this content now pervades the global media and zeitgeist along with misinformation, AI-generated deepfakes and other content, and a web of other ways that render modern audiences nearly immune to such works. I wanted to see more, and found quickly that getting a list of the plays and associated playwrights during this time was not simple. Wikipedia was anything but thorough, and in my frustrations I came across Doollee.

The site has since fallen into a bit of disrepair. The security certificates have expired, so navigating to the page will require some accepting expired certificates and using HTTP rather than HTTPS. The pages are largely generated from PHP and a server that has been kept up to date, but the site's structure hasn't been maintained in terms of URLs, formatting, and a few other quirks. But in Doollee, I saw more detail than I had ever anticipated–virtually a complete listing of everything I'd struggled to find, and a realization that someone likely spent their entire life working on this project. Then I started to look into who Julian Oddy was, and I realized: that is exactly what happened, unfortunately.

Given the state of the page, comments across social media and other locations about difficulty in contacting people about the site since Julian and Pat's deaths, the fear that search engines may eventually de-emphasize the site, and this work be lost, I realized I had an idea for an open-source project.

## Doollee Archivist: The Goals

Doollee Archivist is an open-source project I am currently working on in my free time, with the four specific goals:  
1. **Scrape** the data provided by Doollee
2. **Normalize** this data as much as possible
3. Set up a **modern database** to maintain this information
4. Create a **modern search** interface to leverage the normalization and help provide this data as a modern mirror to Doollee, for accessibility and for redundancy, as well as a lasting memorial to Oddy's legacy

Specifically, I wanted to leverage various aspects of full stack web work I've done throughout my career, but rarely wind up doing in my day-to-day:
- use the end-to-end framework *Playwright* to instead scrape content and execute in-browser scripts efficiently
- dig into Node a bit more than I normally get a chance due to the paucity of Node servers in the projects I've worked on, and dust off things like orchestrators and dependency injection, work more heavily with classes, and try to keep things as close to plain Node as I can
- return to MongoDB after working there 2016-2020 primarily on MongoDB Atlas and their web offerings at the time, and finally getting to use the newer features that have come out since I left
- leverage Atlas Search (Lucene and then some) to avoid the massive complication of creating a search layer, and instead focus my energy on structure and normalization of my data
- do the frontend bit last, likely with next.js, static rendering, and minimal server-side code

And of course:
- approach all aspects of this project from the perspective of the value of this existing archive to the field, with consistent respect and concern to attribution.

When it comes to trying to stay fresh on web technologies while taking some time away from the field, I've been grateful for the chance to jump in on this project. It's not complete at all, and very much on my schedule rather than playing a primary role in my day-to-day, but I've been steadily pushing up changes outside of the actual scraped data and database itself, including scripts for the actual scraping (ethically, the last thing I want to do is DDoS the project I adore), analyzing data for normalization, and so on. It keeps me motivated, but also means hopefully showing transparency around archival practices.
