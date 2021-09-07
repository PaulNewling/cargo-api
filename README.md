# **Cargo API**

## **Documentation**
The system is fully documented in PDF format [here](documentation/Cargo-API-Full-Docs.pdf). This 44 page documentation comprehensively covers all available endpoints, the access conditions for each endpoint, and the data model for the application.

## **About The Project**
The Cargo Management API system is built using Node.js and Express. The application is deployed on the Google Clout Platform. Data storage is handled but Google Datastore's NoSQL database. For testing of this application a test suite of 352 test (across 90 request) was created in Postman leveraging the Chai Assertion Library.

## **Using the Application**
Navigate to [https://final-newlingp.wl.r.appspot.com/](https://final-newlingp.wl.r.appspot.com/) in any modern browser. 

![Login Screen](documentation/images/login-screen.jpeg)

From there you will be prompted to authenticate with your Google account (if you do not have one you can create one at this step). The application only accesses your full name as well as your subscriber ID (which we will refer to as userID). These will be saved in the datastore and used in conjunction with JWTs to determine access to manipulation of cargo and boat entities.

![Google Screen](documentation/images/google-screen.jpeg)

Once authenticated you will be presented with the Authenticated screen. This screen will display your full name, your userID as well as a new JWT. This JWT can then be used to access the project's API endpoints by using the JWT as the 'Bearer Token' in the 'Authorization' header of any request made to a protected endpoint.

![Authenticated Screen](documentation/images/authentication-screen.jpeg)

When making requests to the endpoints the `Accept` and `Content-Type` values of the HTTP request header must be set to `application/json`.
When making requests to endpoints that are protected the `Authorization` header should include `Bearer JWT`, where JWT is a valid JWT created from the application.

## **Testing**
