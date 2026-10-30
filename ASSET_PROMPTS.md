# DOOMSDAY · R&D (Spider-Man) assets

All files live in `public/domains/rnd/`. They were sourced from the web (no AI generators), trimmed and converted to WebP.

| File | Size | Source | Used in |
|---|---|---|---|
| `hero-figure.webp` | 741×1924 | "Spider-Man Integrated Suit PNG" by thatKONNORguy, https://www.deviantart.com/thatkonnorguy/art/Spider-Man-Integrated-Suit-PNG-1199770812 | Hero (scroll camera) |
| `glasses.webp` | 594×355 | pngimg.com sunglasses #29 (CC BY-NC 4.0), https://pngimg.com/uploads/sunglasses/sunglasses_PNG29.png | Hero floor prop |
| `swing.webp` | 1217×1497 | "Spider-Man No Way Home Final Swing Suit PNG" by AkiTheFull, https://www.deviantart.com/akithefull/art/Spider-Man-No-Way-Home-Final-Swing-Suit-PNG-943196876 | City swing section |
| `hammock.webp` | 2048×553 | Spider-Man: Homecoming promotional art (Sony / Marvel), found via Bing image search (Pinterest copy at 2048×1152). Cut out with rembg BiRefNet for the body, and the web keyed off the blue backdrop | Join Us, merged into the footer |
| `city-night.webp` | 2910×1940 | "New York City at night HDR" by Paulo Barcellos Jr., Wikimedia Commons (CC BY-SA 2.0), https://commons.wikimedia.org/wiki/File:New_York_City_at_night_HDR_edit1.jpg (tinted on the page) | City section, hero backdrop and the fixed page backdrop |

Credits are shown in the page footer (`credits` in `lib/domains.ts`). Keep them if you swap images.

## Swapping an image
- Replace the file and update its `width`/`height` in `lib/domains.ts`.
- For the swing cut-out, set `webAttach` (where the web leaves the image, as 0–1 fractions) and `webAngle` (degrees from vertical) so the drawn web line joins the image's own web.
- The hammock cut-out spans the full width; its lower part fades into the footer (`SiteFooter merge`).
- All character art gets the shared colour grade in `lib/grade.ts`.

## Optional hero video
Video mode is still supported (`media: { kind: "video", src, poster }`). `scripts/hf_hero_video.py` generates one on Hugging Face's free GPUs, which have a daily quota.

---

# DOOMSDAY · Tech (Black Panther) assets

| File | Size | Source | Used in |
|---|---|---|---|
| `domains/tech/panther.webp` | 718×1847 | "T'Challa / Black Panther 3" by sidewinder16 (DeviantArt), trimmed | Panther drop-in section |
| Kunai | real-time 3D | Built in code (`lib/kunai.ts`, three.js): faceted blade, brushed steel, cord-wrapped grip, etched word | Kunai hero |

The Tech backdrop is generated smoke (SVG noise), so it needs no image.
