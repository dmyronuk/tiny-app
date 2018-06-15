# TinyApp
### Lighthouse Labs Week 2 Project

## About

TinyApp is a mock REST API that allows users to generate shortened urls.  Built with Express.

## Notes

- Due to an installation issue with the latest version of bcrypt, the app uses version 2.0.0
- Rather than saving the data as an object in memory, the users and urls are dumped out to user-db.json and app-db.json, respectively.  The data persists between server restarts.
- Pageviews are implemented as an object in memory, so the data is lost every time the server restarts.
