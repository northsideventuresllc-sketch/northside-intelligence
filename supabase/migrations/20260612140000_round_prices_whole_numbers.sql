-- Round all subscription prices to whole-dollar amounts for display consistency

UPDATE public.ni_tool_pricing SET
  monthly_price_usd = 22.00,
  annual_price_usd = 220.00,
  lifetime_price_usd = 531.00,
  updated_at = now()
WHERE tool_slug = 'replyflow';

UPDATE public.ni_tool_pricing SET
  monthly_price_usd = 33.00,
  annual_price_usd = 330.00,
  lifetime_price_usd = 797.00,
  updated_at = now()
WHERE tool_slug = 'bridgeai';
