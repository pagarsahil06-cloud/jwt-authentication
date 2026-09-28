const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

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

    console.log("JWT Token:", token);

    res.send("Login successful");
});


app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});