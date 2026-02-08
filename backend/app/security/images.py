
import io
from PIL import Image
import base64

def process_image_securely(base64_str: str) -> str:
    """
    Re-encode image to JPEG, strip EXIF/metadata, and enforce size limits.
    Prevents steganography and malformed chunk attacks.
    """
    try:
        if "base64," in base64_str:
            base64_str = base64_str.split("base64,")[1]
            
        img_data = base64.b64decode(base64_str)
        if len(img_data) > 2 * 1024 * 1024: # 2MB Strict Limit
            raise ValueError("Payload too large")

        img = Image.open(io.BytesIO(img_data))
        
        # Verify format (Reject SVG/WebP if needed, stick to standard)
        if img.format not in ['JPEG', 'PNG', 'WEBP']:
            # Force conversion
            img = img.convert('RGB')

        # Re-encode to remove all metadata/EXIF
        output = io.BytesIO()
        img.save(output, format="JPEG", quality=85, optimize=True)
        
        return base64.b64encode(output.getvalue()).decode('utf-8')
    except Exception as e:
        print(f"IMAGE_PROC_ERROR|{str(e)}")
        raise ValueError("Image processing failed security check.")
