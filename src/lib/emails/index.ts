export { NI_EMAIL } from "@/lib/emails/brand";
export {
  emailButton,
  emailCodeBlock,
  emailDivider,
  emailHeading,
  emailSmallPrint,
  emailText,
  emailTextHtml,
} from "@/lib/emails/components";
export { renderNiEmail, type NiEmailLayoutOptions } from "@/lib/emails/layout";
export { renderOtpVerificationEmail } from "@/lib/emails/templates/otp-verification";
export { renderAxonAccessCodeEmail } from "@/lib/emails/templates/axon-access-code";
export {
  renderGeneralNiEmail,
  renderWelcomeEmailExample,
  type NiGeneralEmailOptions,
} from "@/lib/emails/templates/general";
