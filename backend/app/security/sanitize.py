
import re
import bleach
from urllib.parse import urlparse, urlunparse

def normalize_url(text: str) -> str:
    """Normalize URLs to reveal actual destinations and remove tracking."""
    def clean(match):
        url = match.group(0)
        try:
            parsed = urlparse(url)
            # Basic normalization: remove fragments and common tracking
            query_params = [p for p in parsed.query.split('&') if not p.startswith(('utm_', 'clickid', 'fbcl'))]
            new_query = '&'.join(query_params)
            return urlunparse(parsed._replace(query=new_query, fragment=''))
        except:
            return url
    return re.sub(r'https?://[^\s<>"]+', clean, text)

def sanitize_text(text: str) -> str:
    """Zero-trust text sanitization: strip HTML, control chars, and normalize URLs."""
    if not text:
        return ""
    
    # 1. Strip all HTML/Scripts
    text = bleach.clean(text, tags=[], attributes={}, strip=True)
    
    # 2. Remove control characters (Injection resistance)
    text = "".join(ch for ch in text if ord(ch) >= 32 or ch in "\n\r\t")
    
    # 3. Normalize URLs
    text = normalize_url(text)
    
    return text.strip()
