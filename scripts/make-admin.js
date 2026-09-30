// One-off CLI to promote an existing account to admin, so there is no hardcoded backdoor code.
// Usage: node scripts/make-admin.js someone@example.com
const connectDB = require('../src/config/db');
const { assertConfig } = require('../src/config/env');
const User = require('../src/models/User');

async function main() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  if (!email) { console.error('Usage: node scripts/make-admin.js <email>'); process.exit(1); }

  assertConfig();
  await connectDB();
  const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
  if (!user) { console.error(`No account found for ${email}. They must register first.`); process.exit(1); }
  console.log(`${user.email} is now an admin.`);
  process.exit(0);
}

main().catch(error => { console.error(error.message); process.exit(1); });
