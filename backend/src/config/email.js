const parseEmailFrom = (emailFrom, smtpUser) => {
  const fallbackAddress = smtpUser || 'no-reply@localhost';
  const rawValue = emailFrom || `"AI CareerBridge" <${fallbackAddress}>`;
  const match = rawValue.match(/^(?:"?([^"]*)"?\s*)?<([^>]+)>$/);

  if (match) {
    return {
      name: match[1]?.trim() || 'AI CareerBridge',
      address: match[2].trim(),
    };
  }

  return {
    name: 'AI CareerBridge',
    address: rawValue.includes('@') ? rawValue : fallbackAddress,
  };
};

export const getEmailConfig = () => {
  const smtpUser = process.env.SMTP_USER?.trim() || '';
  let smtpHost = process.env.SMTP_HOST?.trim() || '';
  const smtpPass = process.env.SMTP_PASS?.trim() || '';

  if (!smtpHost && smtpUser.endsWith('@gmail.com')) {
    smtpHost = 'smtp.gmail.com';
  }

  const missing = [];
  if (!smtpHost) missing.push('SMTP_HOST');
  if (!smtpUser) missing.push('SMTP_USER');
  if (!smtpPass) missing.push('SMTP_PASS');

  const emailFrom = parseEmailFrom(process.env.EMAIL_FROM?.trim(), smtpUser);

  return {
    isConfigured: missing.length === 0,
    missing,
    smtpHost,
    smtpPort: Number(process.env.SMTP_PORT) || 587,
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser,
    smtpPass,
    emailFrom,
    verificationExpireMinutes: Number(process.env.EMAIL_VERIFICATION_EXPIRE_MINUTES) || 15,
  };
};

export default getEmailConfig;
