export function changePasswordTemplateEmailText(
  firstName: string,
  url: string,
) {
  return `
Hello ${firstName},

We received a request to reset the password for your account. Please click the link below to set a new password:

${url}

If you did not request this change, please ignore this email or contact our support team.

Best regards
`;
}

export function changePasswordTemplateEmailHTML(
  firstName: string,
  url: string,
) {
  return `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Password Reset Request</title><style>body {font-family: Arial, sans-serif;line-height: 1.6;margin: 0;padding: 0;background-color: #f4f4f4;}.container {width: 80%;margin: auto;overflow: hidden;background: #fff;padding: 20px;border-radius: 5px;box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);}.button {display: inline-block;font-size: 18px;color: #fff;background-color: #32c709;padding: 10px 20px;border-radius: 5px;text-decoration: none;}</style></head><body><div class="container"><h1>Hello ${firstName},</h1><p>We received a request to reset the password for your account. Please click the button below to set a new password:</p><a href="${url}" class="button">Reset Password</a><p>If you did not request this change, please ignore this email.</p><br /><p>Best regards</p></div></body></html>
`;
}
