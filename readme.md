# BCIT ProgressTracker

### A chrome extension that indexes student's course list and creates magical spells out of it.

So what does it do?
___
This is a course page on BCIT's site - stale, lifeless, void

![bcit.ca/study/programs/5500cert before](http://i.imgur.com/0apzwLD.png)
___
 This is the same course page after installing the extension - completed courses are faded out, the ones in progress have green bar next to them with a pie graph showing progression through the semester.

![bcit.ca/study/programs/5500cert after](http://i.imgur.com/jbdyzrR.png)
But why, you ask?
> *"Every second spent that could've been saved = a second wasted"*
\- Unknown

Every semester students visit this page, but before they can decide which courses to register next, they first have to mentally filter out the ones that they've done and the one's they are doing. 

That my friend, is called [cognitive load](https://www.wikiwand.com/en/Cognitive_load), and we reduced it by automating the filtering part.  

___
Once filtering is done and students move on to picking next course(s), instead of shooting in the dark and picking a random course, students can make a smarter decision by considering the ones which are part of more programs (meaning, setting foot in wider variety of trades). They get to see those programs plus the progress they've made in them. And while they are there, they can check the 'Done', 'In Progress' and 'Incomplete' courses for any program in that list, making it easier for them to see how they are doing.

![bcit.ca/study/programs/5500cert even better](http://i.imgur.com/em2ty7n.png)

___
## Technical details
There is not API provided by BCIT to fetch student course's or query BCIT's program/course database, instead this extension sources it's data from a scraper, all that logic is contained in `src/scripts/content/Scrapper.ts` which is the most complex part of this extension.

Once we have the data, everything is rendered with React.

Logging is done using Rollbar.

___
## Downloads

Extension is available at [Chrome webstore - BCIT ProgressTracker](https://chrome.google.com/webstore/detail/bcit-progresstracker/kbnklenakgjfodgloppngbnaidljgepi)
