const User = require('../models/User');

let cachedAIUser = null;

/**
 * Gets or creates the system AI user in MongoDB.
 * Ensures AI answers always have a valid populated author reference.
 */
async function getOrCreateAIUser() {
  if (cachedAIUser) return cachedAIUser;

  // 1. Check if configured via environment variable
  if (process.env.SYSTEM_AI_USER_ID) {
    try {
      const user = await User.findById(process.env.SYSTEM_AI_USER_ID);
      if (user) {
        cachedAIUser = user;
        return user;
      }
    } catch (e) {}
  }

  // 2. Find by system email
  let aiUser = await User.findOne({ email: 'ai-assistant@pariprashna.org' });

  // 3. Create if doesn't exist
  if (!aiUser) {
    aiUser = new User({
      name: 'Vedanta AI',
      email: 'ai-assistant@pariprashna.org',
      role: 'admin',
      provider: 'local',
      password: 'system_ai_account_password_protected',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
      reputation: 10000,
      badges: { gold: 10, silver: 25, bronze: 50 }
    });
    await aiUser.save();
    console.log('[System] Created system AI user:', aiUser._id);
  }

  cachedAIUser = aiUser;
  return aiUser;
}

module.exports = { getOrCreateAIUser };
