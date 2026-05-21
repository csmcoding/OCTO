"""Generate a 1280x640 social preview banner for OCTO."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).parent.parent
IMAGES = REPO / "docs" / "images"
OUT = IMAGES / "social-preview.png"

W, H = 1280, 640
BG = (9, 11, 18)          # deepspace bg
ACCENT = (124, 157, 245)  # periwinkle #7c9df5
DIM = (80, 90, 120)

def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def load_font(size, bold=False):
    candidates = [
        f"/usr/share/fonts/truetype/dejavu/DejaVuSans{'-Bold' if bold else ''}.ttf",
        f"/usr/share/fonts/truetype/liberation/LiberationSans-{'Bold' if bold else 'Regular'}.ttf",
        f"/usr/share/fonts/truetype/freefont/FreeSans{'Bold' if bold else ''}.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# Subtle grid lines (decorative)
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill=(20, 24, 36), width=1)
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill=(20, 24, 36), width=1)

# Left panel text area (60% of width)
TEXT_W = int(W * 0.58)

# OCTO title
font_title = load_font(96, bold=True)
draw.text((72, 180), "OCTO", font=font_title, fill=(240, 245, 255))

# Tagline
font_tag = load_font(28)
tagline = "3D repository visualizer for Linux"
draw.text((76, 310), tagline, font=font_tag, fill=ACCENT)

# Sub-tagline
font_sub = load_font(20)
sub = "Spot git-dirty repos, explore project trees,\nswitch between activity and architecture views."
draw.text((76, 368), sub, font=font_sub, fill=DIM)

# Install pill
pill_x, pill_y = 76, 470
pill_text = "  sudo dpkg -i octopus-dashboard.deb  "
font_code = load_font(18)
bbox = draw.textbbox((pill_x, pill_y), pill_text, font=font_code)
draw.rounded_rectangle(
    [bbox[0]-8, bbox[1]-8, bbox[2]+8, bbox[3]+8],
    radius=6, fill=(18, 22, 36), outline=(40, 50, 80)
)
draw.text((pill_x, pill_y), pill_text, font=font_code, fill=(160, 200, 160))

# Right panel — hero screenshot if it exists
hero_path = IMAGES / "hero.png"
if hero_path.exists():
    hero = Image.open(hero_path).convert("RGB")
    # Scale to fill right panel (W*0.42 x H) maintaining aspect ratio
    panel_w = int(W * 0.42) - 20
    panel_h = H - 40
    hero.thumbnail((panel_w, panel_h), Image.LANCZOS)
    x_off = TEXT_W + (W - TEXT_W - hero.width) // 2
    y_off = (H - hero.height) // 2
    # Paste with a left-edge fade mask
    mask = Image.new("L", hero.size, 255)
    mask_draw = ImageDraw.Draw(mask)
    fade_w = 40
    for i in range(fade_w):
        alpha = int(255 * (i / fade_w))
        mask_draw.rectangle([i, 0, i+1, hero.height], fill=alpha)
    img.paste(hero, (x_off, y_off), mask)
else:
    # Placeholder node art
    cx, cy = int(W * 0.79), H // 2
    for r, color, alpha in [
        (180, (100, 140, 220), 30),
        (120, (124, 157, 245), 50),
        (60, (180, 210, 255), 80),
    ]:
        for ox in range(-r, r, 2):
            for oy in range(-r, r, 2):
                if ox*ox + oy*oy <= r*r:
                    px, py = cx+ox, cy+oy
                    if 0 <= px < W and 0 <= py < H:
                        cur = img.getpixel((px, py))
                        blended = tuple(min(255, c + int((t-c)*alpha/255)) for c, t in zip(cur, color))
                        img.putpixel((px, py), blended)
    draw.ellipse([cx-8, cy-8, cx+8, cy+8], fill=(200, 220, 255))

# Thin accent line left edge
draw.rectangle([0, 0, 3, H], fill=ACCENT)

img.save(OUT, "PNG", optimize=True)
print(f"Saved: {OUT}")
