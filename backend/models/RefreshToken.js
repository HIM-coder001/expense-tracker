import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Stored as a hash — never store raw tokens in DB
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    // Reuse detection: once a token is rotated, the old hash is kept
    // here and treated as stolen if presented again
    replacedByHash: {
      type: String,
      default: null,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// TTL index — MongoDB automatically removes expired documents
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema);
export default RefreshToken;
