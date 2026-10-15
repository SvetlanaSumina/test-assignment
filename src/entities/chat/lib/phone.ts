export function normalizeRecipient(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("80")) digits = `375${digits.slice(2)}`;
  else if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  else if (digits.length === 10 && digits.startsWith("9")) digits = `7${digits}`;
  return /^(7\d{10}|375\d{9})$/.test(digits) ? digits : null;
}
