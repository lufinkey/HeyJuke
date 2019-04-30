# Summary of Hours

## Joseph Hirschfeld

- Semester 1 - 18 Hours
	- 2 hours - Compiling task list
	- 5 hours - Research into APIs
	- 4 hours - Research into mobile app dev
	- 3 hours - Design diagrams and summaries
	- 2 hours - Various other documentation
	- 2 hours - Presentation

- Semester 2 - 39 Hours
	- 3 hours - Writing test cases for server
	- 6 hours - Setup + Authentication code for Server
	- 8 hours - Local files indexing
	- 4 hours - Queue API
	- 2 hours - Integrating media server web socket
	- 3 hours - Integration meeting 1
	- 2 hours - Broadcast beacon
	- 3 hours - Key value settings store
	- 3 hours - Integration meeting 2
	- 5 hours - Setup production pi + personal network for senior design expo

Total Hours: 57

Last semester, I worked with my group coming up with teh entire system architecture, design components, and various documentation for the project. That was the vast majority of the time that was spent. I also spent some time looking into mobile app development, but handed that responsibility off once it seemed like there was going to be too much risk in me handling the mobile development. At the beginning of this semester, I wrote all of the test cases for the server component. During the semester (and accounted for during the other time slots) these test cases were incrementally tested. Setting up my test environment took time, as well as getting the server to start correctly. Local file indexing took quite some time and was by far the most intense part of the server due to the various logic that had to be written. The queue + media server integration is the core of the service, and was required before integration testing with the media server. The broadcast beacon homes the app to the server. The key value settings store allows for nice cascading settings files which are also able to be set from within the app, making the service easier to use. Finally, I set up the raspberry pi as well as a router for use at the expo - this was non-trivial because the pi had to act as the router to UC_Secure for our private network which took time to figure out.



## John D'Alessandro

- Semester 1 - 18 Hours
	- 2 hours - Compiling information for tasklist
	- 3 hours - Creating timeline with input from teammates
	- 8 hours - Research into APIs to be used
	- 2 hours - Research into Electron
	- 3 hours - Design diagrams and summaries

- Semester 2 - 33 Hours
	- 2 hours - Writing use cases for the media player
	- 6 hours - Initial stack setup of mediaplayer
	- 4 hours - Playing local files mvp
	- 4 hours - Created test websocket server script
	- 2 hours - Playing Bandcamp urls through the provided API
	- 3 hours - Integration meeting 1
	- 2 hours - Initial Youtube integration
	- 5 hours - Attempted Spotify Integration
	- 3 hours - Integration meeting 2
	- 2 hours - Completed websocket API

Total Hours: 51

During the first semester, work on each piece of documentation was split fairly evenly. I worked on each of the pieces of documentation, especially those related to the Mediaplayer. To make sure that the project was possible, I did research into the various APIs that we would have to use for streaming music. Finally, I had to research Electron and reacquaint myself with JavaScript once we decided that the Mediaplayer should use those technologies. In the second semester, most of my time was spent developing the project itself and participating in a number of integration meetings that we had with the whole team. I wrote the Mediaplayer, including a large portion to use the Spotify. Complications with the DRM in Spotify's streaming API made this work for naught, but this could potentially be an area for future exploration.
