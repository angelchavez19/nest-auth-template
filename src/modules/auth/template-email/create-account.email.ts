interface GetEmailProps {
  email: string;
  firstName: string;
  lastName: string;
  url: string;
}

const getEmailText = (firstName: string, lastName: string, url: string) => {
  return `Hello ${firstName} ${lastName},

Thank you for registering with us! Please confirm your account by clicking the link below:

${url}

If you did not create an account, please ignore this email.

Best regards`;
};

const getEmailHTML = (firstName: string, lastName: string, url: string) => {
  return `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Account Confirmation</title><style>body{font-family:Arial,sans-serif;line-height:1.6;margin:0;padding:0;background-color:#f4f4f4}.container{width:80%;margin:auto;overflow:hidden;background:#fff;padding:20px;border-radius:5px;box-shadow:0 0 10px rgba(0,0,0,.1)}.button{display:inline-block;font-size:18px;color:#fff;background-color:#32c709FF;padding:10px 20px;border-radius:5px;text-decoration:none}</style></head><body><div class="container"><h1>Hello ${firstName} ${lastName},</h1><p>Thank you for registering with us! Please confirm your account by clicking the button below:</p><a href="${url}" class="button">Confirm Account</a><p>If you did not create an account, please ignore this email.</p></div></body></html>
`;
};

export function getCreateAccountEmail(props: GetEmailProps) {
  return {
    email: props.email,
    subject: `Confirm Email`,
    text: getEmailText(props.firstName, props.firstName, props.url),
    html: getEmailHTML(props.firstName, props.firstName, props.url),
  };
}
