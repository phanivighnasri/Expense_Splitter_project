const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, upi, faceDescriptor } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashedPassword, upi, faceDescriptor });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });

    res.status(200).json({ message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Face Login
router.post("/face-login", async (req, res) => {
  try {
    const { descriptor } = req.body; // array from frontend
    const users = await User.find();

    let foundUser = null;
    for (let user of users) {
      if (!user.faceDescriptor) continue;
      const distance = euclideanDistance(user.faceDescriptor, descriptor);
      if (distance < 0.6) { // adjust threshold
        foundUser = user;
        break;
      }
    }

    if (foundUser) return res.status(200).json({ message: "Face recognized", user: foundUser });
    else return res.status(404).json({ message: "Face not recognized" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Euclidean Distance helper
function euclideanDistance(desc1, desc2) {
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += (desc1[i] - desc2[i]) ** 2;
  }
  return Math.sqrt(sum);
}

module.exports = router;
