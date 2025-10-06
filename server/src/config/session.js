const session = require("express-session");
const MongoStore = require("connect-mongo");

const sessionConfig = {
    secret: process.env.SESSION_SECRET || "sap-technologies-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || "mongodb://localhost:27017/sap-technologies",
        touchAfter: 24 * 3600 // lazy session update
    }),
    cookie: {
        secure: process.env.NODE_ENV === "production", // require HTTPS in production
        httpOnly: true, // prevent XSS attacks
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    },
    name: "sap.sid" // change default session name
};

module.exports = sessionConfig;
