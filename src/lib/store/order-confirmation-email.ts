export type {
  StoreOrderConfirmationInput,
  StoreOrderConfirmationLine,
} from "@/lib/store/order-confirmation-email-html";

export {
  sendStoreOrderConfirmationEmail,
  sendStoreOrderAdminNotificationEmail,
  sendStoreShippingUpdateEmail,
  getStoreOrdersNotifyEmail,
} from "@/lib/store/order-emails";
