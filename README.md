# TinyApp
### Lighthouse Labs Week 2 Project

## About

TinyApp is a mock REST API that allows users to generate shortened urls.  Built with Express.

## Dependencies
- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session
- method-override

## Getting Started

- ```npm install```
- ```node express-server.js```

## Screenshots
!["Screenshot of url list"](https://github.com/dmyronuk/tiny-app/blob/master/screenshots/user-urls-list.png)
!["Screenshot of url list"](https://github.com/dmyronuk/tiny-app/blob/master/screenshots/single-url-info.png)

## Notes

- Due to an installation issue with the latest version of bcrypt, the app uses version 2.0.0
- Rather than saving the data as an object in memory, the users and urls are dumped out to user-db.json and app-db.json, respectively.  The data persists between server restarts.
- Pageviews are implemented as an object in memory, so the data is lost every time the server restarts.
