import sanitizeHtml from 'sanitize-html';

/** Sanitises rich text from the admin editor before it is stored. */
export function cleanHtml(html: string) {
  return sanitizeHtml(html ?? '', {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote', 'img', 'hr'],
    allowedAttributes: { a: ['href', 'target', 'rel'], img: ['src', 'alt', 'width', 'height'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowProtocolRelative: false,
    transformTags: {
      a: (tag, attribs) => ({
        tagName: 'a',
        attribs: /^https?:/.test(attribs.href ?? '') ? { ...attribs, target: '_blank', rel: 'noopener noreferrer' } : attribs,
      }),
    },
  });
}

