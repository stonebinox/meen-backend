export const generateOtp = (): Number =>
  Math.floor(100000 + Math.random() * 900000);
