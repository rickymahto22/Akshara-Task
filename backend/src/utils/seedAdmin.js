import User from "../models/User.js";

export const ensureDefaultAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return;
    }

    const name = process.env.ADMIN_NAME || "SmartChat Admin";
    const email = process.env.ADMIN_EMAIL || "admin@smartchat.local";
    const password = process.env.ADMIN_PASSWORD || "admin123";

    const admin = await User.create({
      name,
      email,
      password,
      role: "admin",
      isActive: true,
    });

    console.log(
      `Default admin user created: ${admin.email} (you can change this later in the database)`
    );
  } catch (err) {
    console.error("Failed to ensure default admin user:", err);
  }
};

