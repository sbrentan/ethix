const bcrypt = require("bcrypt");

async function hashPasswords(accounts) {
	const saltRounds = 10; // Number of salt rounds for bcrypt

	const hashedAccounts = await Promise.all(
		accounts.map(async (account) => {
			const hashedPassword = await bcrypt.hash(
				account.password,
				saltRounds
			);
			return { ...account, password: hashedPassword };
		})
	);

	return hashedAccounts;
}

module.exports = hashPasswords;
