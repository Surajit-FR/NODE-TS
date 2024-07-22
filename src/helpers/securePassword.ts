import bcrypt from 'bcryptjs';

// Define the function to hash the password
const SecurePassword = async (password: string): Promise<string> => {
    const hashedPassword = await bcrypt.hash(password, 13);
    return hashedPassword;
};

export default SecurePassword;