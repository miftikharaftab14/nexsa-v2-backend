import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { BusinessException } from '../exceptions/business.exception';

/**
 * Normalize a phone number into E.164 format.
 *
 * Defaults to US parsing when no country code is present.
 */
export function normalizePhoneToE164(
  input: string,
  defaultCountry: 'US' = 'US',
): string {
  const raw = (input ?? '').trim();
  if (!raw) {
    throw new BusinessException('Phone number is required', 'PHONE_NUMBER_IS_REQUIRED');
  }

  const parsed = parsePhoneNumberFromString(raw, defaultCountry);
  if (!parsed || !parsed.isValid()) {
    throw new BusinessException(
      `Invalid phone number: ${input}`,
      'INVALID_PHONE_NUMBER',
      { phone_number: input },
    );
  }

  return parsed.number; // E.164
}

