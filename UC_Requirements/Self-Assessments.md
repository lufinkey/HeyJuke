# Self-Assessments

## Luis Finke

My contributions to this project included the mobile app and some features of the backend player. I built the mobile app using a cross-platform framework called React Native, of which I had started to get a bit familiar with before the project began. I ended up building an entire module to use within the app, and this helped me contribute to my skill of learning libraries. React native comes with a few shortcomings, and recognizing and working with those shortcomings was something I was able to learn from. Specifically it was often difficult to debug, so I built a logger within the app to help us figure out where errors were coming from.

Working with multiple streaming services was also a difficult obstacle. In many instances, copyright protection in software tends to only make it harder to use. Spotify and YouTube were both challenging to work with in that regard. YouTube’s API wouldn’t grant video streams for specific videos that opted out of allowing embedding. To solve this issue, we had to use a scraper library to get the audio stream directly. Spotify’s SDK required the Flash Widevine plugin, only available in browsers. Since we were using Electron, we would have to use a custom build and apply for a certificate from an authority, which could take weeks to actually be accepted. For this reason, we chose to opt out of Spotify temporarily.

Our group was able to create a working prototype of our app, with all module communicating with each other. The project as a whole helped me learn the ideal way to divide team work. Since each of us worked on an individual module, we only had to discuss the protocols for communication between our modules, and all implementation could be managed individually. This made our work clearer and our contributions more focused. In some cases, pair programming and debugging was an effective way to figure out and correct issues in specific modules.

Another thing I learned about group work from this project was that groups tend to need a leader. Somebody has to take responsibility to make sure each member of the project gets their individual contribution done. It can’t necessarily be expected that everyone will remember, and if everyone in a group project joins with that mindset, projects could get done a lot faster and better. This may have been a shortcoming of our group, but it certainly ended as a learning experience.

## Joe Hirschfeld

On HeyJuke I was responsible for the server component. The server component is
the piece of software which coordinates state and actions between both the
mobile app and the player sub-application. This included features such as
dynamic cached local file content indexing with fuzzy searching, a full
expandable role based access control system with hooks for creating more
authentication mechanisms, full queue subsystem with permission based management
and control, as well as a dynamic key value settings store which enables all
configuration of the server to occur from within the mobile application.

The server itself is written in Node.js with libraries which assisted in many
facets of the server. I created in-depth and thorough documentation for use in
writing the mobile app documenting all possible queries between the app and the
server. This documentation was very helpful as it made integration between the
app and the server very easy, seamless, and predictable for both me and Luis.
