function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type ContactEmailFields = {
  name: string;
  email: string;
  message: string;
};

export const CONTACT_EMAIL_LOGO_CID = "webiko-logo";

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const BG_COLOR = "#0b0c08";
const DIVIDER = "border-top:1px solid rgba(255,255,255,0.15);";
const LABEL_STYLE =
  "color:#ffffff;font-size:12px;font-weight:400;opacity:0.5;text-transform:uppercase;letter-spacing:0.04em;";
const VALUE_STYLE = "color:#ffffff;font-size:17px;font-weight:300;";
// Gmail forces link color/underline on <a> tags unless the inline style
// wins with !important - without it every link here would render blue.
const LINK_STYLE =
  "color:#ffffff!important;text-decoration:none!important;";

export function buildContactEmailHtml({
  name,
  email,
  message,
}: ContactEmailFields): string {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

  return `<!doctype html>
<html>
  <body style="margin:0;padding:40px 16px;background:${BG_COLOR};font-family:${FONT_STACK};" bgcolor="${BG_COLOR}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;">
      <tr>
        <td style="padding-bottom:28px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:10px;">
                <img src="cid:${CONTACT_EMAIL_LOGO_CID}" width="32" height="32" alt="" style="display:block;border-radius:8px;">
              </td>
              <td>
                <a href="https://webiko.dev" style="${LINK_STYLE}font-size:15px;font-weight:300;letter-spacing:0.02em;opacity:0.7;">webiko.dev</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="${DIVIDER}padding-top:24px;">
          <span style="color:#ffffff;font-size:24px;font-weight:300;">New contact form message</span>
        </td>
      </tr>
      <tr>
        <td style="padding-top:24px;">
          <span style="${LABEL_STYLE}">From</span><br>
          <span style="${VALUE_STYLE}">${safeName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding-top:16px;">
          <span style="${LABEL_STYLE}">Email</span><br>
          <a href="mailto:${safeEmail}" style="${LINK_STYLE}font-size:17px;font-weight:300;border-bottom:1px solid rgba(255,255,255,0.4);">${safeEmail}</a>
        </td>
      </tr>
      <tr>
        <td style="padding-top:16px;">
          <span style="${LABEL_STYLE}">Message</span><br>
          <span style="${VALUE_STYLE}line-height:1.6;">${safeMessage}</span>
        </td>
      </tr>
      <tr>
        <td style="${DIVIDER}padding-top:24px;">
          <span style="color:#ffffff;font-size:12px;opacity:0.4;">Sent from the contact form at </span><a href="https://webiko.dev" style="${LINK_STYLE}font-size:12px;opacity:0.4;">webiko.dev</a><span style="color:#ffffff;font-size:12px;opacity:0.4;"> — reply to respond directly.</span>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
