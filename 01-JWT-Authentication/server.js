const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const session = require("express-session");

const User = require("./models/User");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "mySessionSecret",
    resave: false,
    saveUninitialized: false
}));

app.use(express.static("public"));

function verifyToken(req, res, next) {

    // Check session
    if (!req.session.user) {
        return res.status(401).send("Access denied. Please login first.");
    }

    // Get JWT from session
    const token = req.session.user.token;

    try {
        jwt.verify(token, "mysecret");

        next();

    } catch (error) {
        return res.status(401).send("Invalid or expired token");
    }
}

mongoose.connect("mongodb://127.0.0.1:27017/jwtdb")
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch((error) => {
        console.log("MongoDB Connection Error:", error);
    });

app.get("/", (req, res) => {
    res.send("JWT Authentication Project");
});

app.post("/register", async (req, res) => {

    const { name, email, password } = req.body;

    const user = new User({
        name: name,
        email: email,
        password: password
    });

    await user.save();

    res.send("Registration successful");
});

app.post("/login", async (req, res) => {

    const { email, password } = req.body;

    const user = await User.findOne({ email: email });

    if (!user) {
        return res.send("Invalid email or password");
    }

    const passwordMatch = await bcrypt.compare(
        password,
        user.password
    );

    if (!passwordMatch) {
        return res.send("Invalid email or password");
    }

   const token = jwt.sign(
    { id: user._id },
    "mysecret",
    { expiresIn: "1h" }
);

// Create session
req.session.user = {
    id: user._id,
    token: token
};

console.log("JWT Token:", token);

res.redirect("/dashboard");
});


app.get("/dashboard", verifyToken, (req, res) => {

    res.sendFile(__dirname + "/public/dashboard.html");

});
// LOGOUT
app.get("/logout", (req, res) => {

    req.session.destroy((error) => {

        if (error) {
            return res.send("Logout failed");
        }

        res.redirect("/login.html");
    });

});
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});