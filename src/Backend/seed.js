// backend/seed-users.js
const { newPool } = require('./config/db');
const bcrypt = require('bcrypt');

async function seedUsers() {
  console.log('🌱 Seeding users...\n');

  try {
    // 1. Add roles
    await pool.query(`INSERT INTO roles (role_name) VALUES ('SuperAdmin') ON CONFLICT (role_name) DO NOTHING`);
    await pool.query(`INSERT INTO roles (role_name) VALUES ('Admin') ON CONFLICT (role_name) DO NOTHING`);
    console.log('✅ Roles ready');

    // 2. Upgrade admin to SuperAdmin
    await pool.query(`
      INSERT INTO user_roles (user_id, role_id)
      SELECT u.user_id, r.role_id 
      FROM users u, roles r 
      WHERE u.username = 'admin' AND r.role_name = 'SuperAdmin'
      ON CONFLICT (user_id, role_id) DO NOTHING
    `);
    console.log('✅ Admin upgraded to SuperAdmin');

    // 3. Create 3 dummy admin users
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);

    for (let i = 1; i <= 3; i++) {
      const username = `admin${i}`;
      
      const userResult = await pool.query(
        `INSERT INTO users (username, password_hash, recovery_email, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (username) DO UPDATE SET password_hash = $2
         RETURNING user_id`,
        [username, hash, `${username}@fatima.edu.ph`]
      );
      const userId = userResult.rows[0].user_id;

      await pool.query(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT $1, role_id FROM roles WHERE role_name = 'Admin'
         ON CONFLICT (user_id, role_id) DO NOTHING`,
        [userId]
      );

      console.log(`✅ Created: ${username}`);
    }

    console.log('\n📋 Summary:');
    console.log('  SuperAdmin: admin / admin123');
    console.log('  Admins: admin1, admin2, admin3 / admin123');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  await pool.end();
  console.log('\n✨ Done!');
}

seedUsers();