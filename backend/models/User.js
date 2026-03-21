const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      default: "",
      trim: true
    },
    password: {
      type: String,
      default: ""
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },
    verified: {
      type: Boolean,
      default: false
    },
    picture: {
      type: String,
      default: ""
    },
    notificaciones: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  if (!this.password || !this.password.trim()) {
    return;
  }

  const storedPassword = this.password.trim();

  const looksHashed =
    storedPassword.startsWith("$2a$") ||
    storedPassword.startsWith("$2b$") ||
    storedPassword.startsWith("$2y$");

  if (looksHashed) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(storedPassword, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password || !candidatePassword) {
    return false;
  }

  const storedPassword = this.password.trim();

  const looksHashed =
    storedPassword.startsWith("$2a$") ||
    storedPassword.startsWith("$2b$") ||
    storedPassword.startsWith("$2y$");

  if (looksHashed) {
    return await bcrypt.compare(candidatePassword, storedPassword);
  }

  return storedPassword === candidatePassword;
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;