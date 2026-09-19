grant update (
  name,
  slug,
  color,
  city,
  billing_document,
  logo_url,
  payment_methods,
  agenda_settings,
  public_booking_settings,
  pix_key,
  pix_qr_code_url
) on public.barbershops to authenticated;
