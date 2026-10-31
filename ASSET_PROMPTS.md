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

## Hero video (`hero.mp4`, `hero-poster.jpg`)
The R&D hero scrubs a generated video: 1280×720, 8.6 s, 64 fps, every frame a keyframe (`-g 1`) for smooth scrubbing.

How it was made:
1. Three keyframes on the same teal-bokeh city (`video-kits/spiderman/1-head.jpg`, `2-back.jpg`, `3-legs.jpg`).
2. Two clips from the Kaggle notebook `video-kits/kaggle/doomsday_spiderman_hero.ipynb` (Wan 2.2 I2V A14B GGUF, first + last frame, 16 fps): head → orbit to the back, then back → down to the boots.
3. The sunglasses the model added in clip 2 were painted out frame by frame with OpenCV (`clips/clip2_clean.mp4`).
4. The stretch where the model morphed his back into his front (and garbled the knees) is cut out entirely; the two clean runs are interpolated to 64 fps separately with OpenCV DIS optical flow, and the page's splash wipe (`splash` in `lib/domains.ts`) covers the cut. Encoded at CRF 24.

Camera stops in `lib/domains.ts`: head = 0, back = 0.585, legs = 1 (fractions of the clip). `scripts/hf_hero_video.py` is the older single-image LTX version.

---

# DOOMSDAY · Tech (Black Panther) assets

| File | Size | Source | Used in |
|---|---|---|---|
| `domains/tech/panther-4k.webp` | 2880×3986 | Official *Black Panther* (2018) promo render (1800×2491, via pngarts), Lanczos-upscaled | Panther rise-in section |
| Kunai | real-time 3D | Built in code (`lib/kunai.ts`, three.js): faceted blade, brushed steel, cord-wrapped grip, etched word | Kunai hero |

The Tech backdrop is generated smoke (SVG noise), so it needs no image.

---

# DOOMSDAY · Content (Deadpool) assets

All in `public/domains/content/`. Comic versions are made from the realistic renders with an in-house filter (cel-shaded palette, ink lines, Ben-Day dots), so comic and real poses match exactly.

| File | Source | Used in |
|---|---|---|
| `fall-comic.webp` | pngimg.com Deadpool #72, comic filter | Hero: the dive |
| `land-comic.webp` | "Deadpool Superhero Landing PNG" by AkiTheFull (DeviantArt), comic filter | Hero: landing |
| `stand-comic.webp` | pngmart.com "Deadpool Movie PNG", comic filter | Hero: stands |
| `aim-comic.webp` / `aim.webp` | "Deadpool One Pistol" by DonComediaTV (DeviantArt): mirrored so he aims left, baked muzzle flash removed, upscaled to 1800 px; comic + real | Hero: aim, both shots, paint reveal, glass shards |
| `standing.webp` | "Deadpool - Transparent" by Asthonx1 (DeviantArt) | Deadpool section (until the video lands) |
| Bullet | real-time 3D (`lib/bullet.ts`): brass case, copper head, engraved word | Hero: second shot |

## Walking video (`walk.mp4`, `walk-poster.jpg`)
From `video-kits/kaggle/doomsday_deadpool_hero.ipynb` (chain mode, start frame `video-kits/deadpool/1-walk.jpg`).
The model painted a zebra crossing under him, so every frame was matted (rembg isnet) and re-composited onto the
clean street from the start frame with a contact shadow. The figure was then upscaled 4× with Real-ESRGAN
(`realesrgan-x4plus`, ncnn-vulkan) and blended into 1920×1080 frames, interpolated to 64 fps with optical flow and
encoded all-intra at CRF 23. Master: `video-kits/deadpool/walk_master.mp4`.

> Real-ESRGAN on this laptop needs `DISABLE_LAYER_AMD_SWITCHABLE_GRAPHICS_1=1`, otherwise AMD's Vulkan layer hides the GPU.

# DOOMSDAY · Tech (Black Panther) video (pending)
`video-kits/kaggle/doomsday_blackpanther_hero.ipynb`: chain mode from `video-kits/blackpanther/1-face.jpg` (face and
chest from `panther-4k.webp`), three clips: camera to the right side of his face as he raises a hand and looks at it →
orbit to his back, hand still raised → tilt down to his legs.
