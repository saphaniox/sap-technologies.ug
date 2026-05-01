require("dotenv").config();
const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { User } = require("../src/models");

const DEFAULT_EMAIL = "admin@sap-technologies.com";
const DEFAULT_NAME = "SAPTech Uganda Admin";

function getArgValue(flagName) {
  const arg = process.argv.find((item) => item.startsWith(`${flagName}=`));
  return arg ? arg.split("=").slice(1).join("=") : null;
}

function generateStrongPassword(length = 20) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+";
  const bytes = crypto.randomBytes(length);
  let value = "";

  for (let i = 0; i < length; i += 1) {
    value += chars[bytes[i] % chars.length];
  }

  return value;
}

(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("Missing MONGODB_URI in environment.");
    process.exit(1);
  }

  const email = (getArgValue("--email") || process.env.ADMIN_SEED_EMAIL || DEFAULT_EMAIL).toLowerCase().trim();
  const name = (getArgValue("--name") || process.env.ADMIN_SEED_NAME || DEFAULT_NAME).trim();
  const providedPassword = getArgValue("--password") || process.env.ADMIN_SEED_PASSWORD;
  const resetPassword = getArgValue("--reset-password") === "true" || process.env.ADMIN_SEED_RESET_PASSWORD === "true";

  let plainPassword = providedPassword;
  if (!plainPassword) {
    plainPassword = generateStrongPassword();
  }

  try {
    await mongoose.connect(mongoUri);

    const existing = await User.findOne({ email });
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    if (!existing) {
      const admin = new User({
        name,
        email,
        password: hashedPassword,
        role: "admin",
        isActive: true,
        emailVerified: true,
        privacyPolicyAccepted: new Date()
      });

      await admin.save();
      console.log("Admin account created successfully.");
      console.log(`Email: ${email}`);
      console.log(`Password: ${plainPassword}`);
      console.log("Please log in and change this password immediately.");
    } else {
      existing.role = "admin";
      existing.isActive = true;
      existing.emailVerified = true;

      if (resetPassword) {
        existing.password = hashedPassword;
      }

      await existing.save();
      console.log("Existing user elevated/updated as admin successfully.");
      console.log(`Email: ${email}`);

      if (resetPassword) {
        console.log(`New Password: ${plainPassword}`);
        console.log("Please log in and change this password immediately.");
      } else {
        console.log("Password unchanged. Use --reset-password=true to reset it.");
      }
    }
  } catch (error) {
    console.error("Failed to seed admin account:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
})();
