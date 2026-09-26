/**
 * TaxPlain Server-Side Input Sanitizer and Anti-Injection Filter
 * Validates and cleans user-submitted statutory text, invoices, and notice clauses
 * to prevent prompt injection, script execution, and DoS payloads before reaching LLMs.
 */

export interface ValidatedTaxRequest {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  promptType: "explainer" | "checklist" | "invoice" | "itr" | "chat";
  temperature: number;
  provider?: "nvidia" | "auto";
}

export class ValidationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = statusCode;
  }
}

// Allowed statutory prompt types
const ALLOWED_PROMPT_TYPES = new Set(["explainer", "checklist", "invoice", "itr", "chat"]);

// Disallowed control characters: ASCII 0-8, 11-12, 14-31, 127
// Preserves \t (9), \n (10), \r (13) which are standard in documents
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

// Unicode directional overrides and hidden control codepoints (used in Trojan Source attacks)
const UNICODE_BIDI_OVERRIDE_REGEX = /[\u202A-\u202E\u2066-\u2069\uFEFF]/g;

// Dangerous script and executable injection tags
const DANGEROUS_HTML_TAGS_REGEX = /<\/?(script|iframe|object|embed|applet|meta|link|style|base|form|input)[^>]*>/gi;
const DANGEROUS_EVENT_HANDLERS_REGEX = /\b(on\w+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_PROTOCOL_REGEX = /\b(javascript|vbscript|data):\s*/gi;

// Chat completion and LLM delimiter tokens (e.g. LLaMA, OpenAI, Mistral format headers)
const LLM_DELIMITER_INJECTIONS = /(<\|im_start\|>|<\|im_end\|>|<\|system\|>|<\|user\|>|<\|assistant\|>|\[INST\]|\[\/INST\]|<<SYS>>|<\/SYS>)/gi;

// Known prompt injection and jailbreak override patterns
const PROMPT_OVERRIDE_PATTERNS = [
  /\b(ignore|disregard|forget|bypass)\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules|commands)\b/gi,
  /\b(you\s+are\s+now|act\s+as)\s+(an?\s+)?(unrestricted|jailbroken|developer\s+mode|dan|god\s+mode)\b/gi,
  /\b(system\s+override|admin\s+override|prompt\s+injection)\b/gi,
  /\b(print|reveal|expose|output|leak)\s+(the\s+)?(system\s+prompt|initial\s+prompt|nvidia_api_key|api\s*key|environment\s+variables)\b/gi,
  /\b(do\s+anything\s+now|jailbreak\s+activated)\b/gi,
];

/**
 * Sanitizes tax text content:
 * 1. Strips null bytes, control chars, and bidirectional overrides
 * 2. Neutralizes script tags, event handlers, and data URI protocols
 * 3. Strips special LLM chat completion delimiter tokens
 * 4. Defangs prompt injection / jailbreak phrases into safely quoted document text
 */
export function sanitizeTaxInputText(text: string): string {
  if (typeof text !== "string") {
    return "";
  }

  // 1. Remove dangerous binary and control characters
  let clean = text
    .replace(CONTROL_CHARS_REGEX, "")
    .replace(UNICODE_BIDI_OVERRIDE_REGEX, "");

  // 2. Neutralize HTML script tags, event handlers, and javascript: protocols
  clean = clean.replace(DANGEROUS_HTML_TAGS_REGEX, "[SANITIZED_TAG]");
  clean = clean.replace(DANGEROUS_EVENT_HANDLERS_REGEX, "");
  clean = clean.replace(JAVASCRIPT_PROTOCOL_REGEX, "sanitized_protocol:");

  // 3. Strip special LLM delimiter tokens that try to escape chat boundaries
  clean = clean.replace(LLM_DELIMITER_INJECTIONS, "[DELIMITER_REMOVED]");

  // 4. Defang prompt override jailbreaks
  for (const pattern of PROMPT_OVERRIDE_PATTERNS) {
    clean = clean.replace(pattern, (match) => `[Quoted Tax Document Text: "${match}"]`);
  }

  // Normalize excessive repeating characters (prevent buffer inflation DoS)
  clean = clean.replace(/(.)\1{100,}/g, "$1$1$1$1$1");

  return clean.trim();
}

/**
 * Validates and sanitizes the complete request body from user
 */
export function validateAndSanitizeTaxPayload(body: any): ValidatedTaxRequest {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Request body must be a valid JSON object.");
  }

  // 1. Validate promptType
  const rawPromptType = body.promptType ? String(body.promptType).toLowerCase() : "explainer";
  if (!ALLOWED_PROMPT_TYPES.has(rawPromptType)) {
    throw new ValidationError(
      `Invalid promptType '${body.promptType}'. Allowed types: ${Array.from(ALLOWED_PROMPT_TYPES).join(", ")}.`
    );
  }
  const promptType = rawPromptType as ValidatedTaxRequest["promptType"];

  // 2. Validate temperature
  let temperature = 0.2;
  if (body.temperature !== undefined && body.temperature !== null) {
    const parsedTemp = Number(body.temperature);
    if (isNaN(parsedTemp)) {
      throw new ValidationError("Temperature must be a valid number between 0.0 and 1.0.");
    }
    temperature = Math.max(0.0, Math.min(1.0, parsedTemp));
  }

  // 3. Validate messages array
  if (!body.messages || !Array.isArray(body.messages)) {
    throw new ValidationError("Missing or invalid 'messages' array in request body.");
  }

  if (body.messages.length === 0) {
    throw new ValidationError("The 'messages' array cannot be empty.");
  }

  if (body.messages.length > 25) {
    throw new ValidationError("Too many messages in conversational history (maximum 25 permitted).");
  }

  let totalCharacterCount = 0;
  const sanitizedMessages: ValidatedTaxRequest["messages"] = [];

  for (let i = 0; i < body.messages.length; i++) {
    const msg = body.messages[i];
    if (!msg || typeof msg !== "object") {
      throw new ValidationError(`Message at index ${i} must be an object with 'role' and 'content'.`);
    }

    const rawRole = String(msg.role || "").toLowerCase().trim();
    if (rawRole !== "user" && rawRole !== "assistant" && rawRole !== "system") {
      throw new ValidationError(`Message at index ${i} has invalid role '${msg.role}'. Allowed: user, assistant, system.`);
    }
    const role = rawRole as "system" | "user" | "assistant";

    if (typeof msg.content !== "string") {
      throw new ValidationError(`Message at index ${i} must contain a string 'content' field.`);
    }

    const rawContent = msg.content.trim();
    if (rawContent.length === 0) {
      throw new ValidationError(`Message at index ${i} content cannot be empty.`);
    }

    if (rawContent.length > 30000) {
      throw new ValidationError(
        `Message at index ${i} exceeds maximum length of 30,000 characters (${rawContent.length} chars).`
      );
    }

    totalCharacterCount += rawContent.length;
    if (totalCharacterCount > 80000) {
      throw new ValidationError(
        `Total combined messages payload exceeds limit of 80,000 characters (${totalCharacterCount} chars).`
      );
    }

    const sanitizedContent = sanitizeTaxInputText(rawContent);
    sanitizedMessages.push({
      role,
      content: sanitizedContent,
    });
  }

  // 4. Validate optional provider
  let provider: ValidatedTaxRequest["provider"] = undefined;
  if (body.provider) {
    const rawProvider = String(body.provider).toLowerCase().trim();
    if (["nvidia", "auto"].includes(rawProvider)) {
      provider = rawProvider as ValidatedTaxRequest["provider"];
    }
  }

  return {
    messages: sanitizedMessages,
    promptType,
    temperature,
    provider,
  };
}

