interface GetEmailProps {
  email: string;
  firstName: string;
  url: string;
  lang: string;
}

const getEmailText = ({ firstName, url, lang }: GetEmailProps) => {
  if (lang === 'es') {
    return `Hola ${firstName},

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Por favor, haz clic en el enlace a continuación para establecer una nueva contraseña:

${url}

Si no solicitaste este cambio, por favor ignora este correo electrónico o contacta a nuestro equipo de soporte.

Saludos cordiales`;
  }

  return `Hello ${firstName},

We received a request to reset the password for your account. Please click the link below to set a new password:

${url}

If you did not request this change, please ignore this email or contact our support team.

Best regards`;
};

const getEmailHTML = ({ firstName, url, lang }: GetEmailProps) => {
  return `
<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${lang === 'es' ? 'Solicitud de Restablecimiento de Contraseña' : 'Password Reset Request'}</title>
<style>body {font-family: Arial, sans-serif;line-height: 1.6;margin: 0;padding: 0;background-color: #f4f4f4;}.container {width: 80%;margin: auto;overflow: hidden;background: #fff;padding: 20px;border-radius: 5px;box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);}.button {display: inline-block;font-size: 18px;color: #fff;background-color: #32c709;padding: 10px 20px;border-radius: 5px;text-decoration: none;}</style></head><body><div class="container">
  <h1>${lang === 'es' ? 'Hola' : 'Hello'} ${firstName},</h1>
  <p>${lang === 'es' ? 'Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Por favor, haz clic en el botón a continuación para establecer una nueva contraseña:' : 'We received a request to reset the password for your account. Please click the button below to set a new password:'}</p>
  <a href="${url}" class="button">${lang === 'es' ? 'Restablecer Contraseña' : 'Reset Password'}</a>
  <p>${lang === 'es' ? 'Si no solicitaste este cambio, por favor ignora este correo electrónico.' : 'If you did not request this change, please ignore this email.'}</p>
  <br />
  <p>${lang === 'es' ? 'Saludos cordiales' : 'Best regards'}</p>
</div></body></html>
`;
};

export function getChangePasswordEmail(props: GetEmailProps) {
  return {
    email: props.email,
    subject: props.lang === 'es' ? 'Cambio de contraseña' : 'Change Password',
    text: getEmailText(props),
    html: getEmailHTML(props),
  };
}
