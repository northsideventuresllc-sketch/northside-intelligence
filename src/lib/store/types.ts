export type StoreGateStatus = {
  live: boolean;
  cjWired: boolean;
  makeConfigured: boolean;
  launchFlag: boolean;
  message: string;
};

export interface StoreProductView {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  isMock: boolean;
}
