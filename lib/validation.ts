import { z } from 'zod';

// Phone validation - E.164 format
const phoneRegex = /^\+[1-9]\d{1,14}$/;

export const phoneSchema = z.string().regex(phoneRegex, 'Invalid phone number format (use E.164: +1234567890)');

export const emailSchema = z.string().email('Invalid email address');

// Campaign validation
export const createCampaignSchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  course_id: z.string().uuid('Invalid course ID'),
  template_id: z.string().uuid('Invalid template ID'),
  name: z.string().min(1, 'Campaign name is required').max(200, 'Campaign name too long'),
  description: z.string().max(1000, 'Description too long').nullable().optional(),
  scheduled_at: z.string().datetime('Invalid date/time format'),
  timezone: z.string().min(1, 'Timezone is required'),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

// Message validation
export const sendMessageSchema = z.object({
  conversation_id: z.string().uuid('Invalid conversation ID'),
  body: z.string().min(1, 'Message body is required').max(5000, 'Message too long'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// Contact validation
export const createContactSchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  course_id: z.string().uuid('Invalid course ID').nullable().optional(),
  name: z.string().max(200, 'Name too long').nullable().optional(),
  phone: phoneSchema,
  email: emailSchema.nullable().optional(),
  consent: z.enum(['granted', 'denied', 'unknown']).default('unknown'),
  tags: z.array(z.string()).default([]),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;

// Brand verification validation
export const brandVerificationSchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  legal_name: z.string().min(1, 'Legal name is required').max(200),
  dba: z.string().max(200).nullable().optional(),
  website: z.string().url('Invalid website URL').nullable().optional(),
  ein: z.string().regex(/^\d{2}-?\d{7}$/, 'Invalid EIN format').nullable().optional(),
  address: z.string().min(1, 'Address is required').max(500),
  contact_name: z.string().min(1, 'Contact name is required').max(200),
  contact_email: emailSchema,
  contact_phone: phoneSchema,
  notes: z.string().max(1000).nullable().optional(),
});

export type BrandVerificationInput = z.infer<typeof brandVerificationSchema>;

/**
 * Validate and parse form data
 */
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { 
        success: false, 
        error: firstError.message 
      };
    }
    return { 
      success: false, 
      error: 'Invalid input data' 
    };
  }
}

/**
 * Extract and validate FormData
 */
export function formDataToObject(formData: FormData): Record<string, any> {
  const obj: Record<string, any> = {};
  
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      obj[key] = trimmed === '' ? null : trimmed;
    } else {
      obj[key] = value;
    }
  }
  
  return obj;
}

/**
 * Validate datetime is in the future
 */
export function isFutureDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date.getTime() > Date.now();
}

/**
 * Sanitize user input for display
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';
  return input.trim().replace(/[<>]/g, '');
}
