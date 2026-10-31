# Spider-Man hero video — shot kit (Dreamina / Seedance)

Goal: one continuous camera move like the reference — **head (front) → camera orbits round to his back → glides down to the legs and boots**.
Made as **2 clips** that share their middle frame, so they join seamlessly.

## Settings (same for both clips)
- Tab: **AI Video**
- Model: the newest **Seedance** available (2.0 or 2.5)
- Mode: **First and last frame** (upload a start image and an end image)
- Aspect ratio: **16:9** · Resolution: **1080p** (or the highest offered) · Duration: **5s**
- Leave sound / audio **off** if there's an option

---

## Clip 1 — head → back
- **First frame:** `1-head.jpg`
- **Last frame:** `2-back.jpg`
- **Prompt:**

> Slow cinematic camera orbit. A masked hero in a red and black suit stands completely still, facing the camera. The camera starts on a close-up of his masked face, then smoothly circles around to his right side and continues behind him while drifting slightly downward, ending on his upper back and shoulders. Blurred teal city lights in the background, shallow depth of field, steady gimbal movement, photorealistic, no text.

Save as: `clips/clip1.mp4`

---

## Clip 2 — back → legs
- **First frame:** `2-back.jpg`
- **Last frame:** `3-legs.jpg`
- **Prompt:**

> Slow cinematic camera move. A masked hero in a red and black suit stands completely still. The camera starts behind him on his upper back, keeps circling slowly around him while gliding down along his body, past his legs, and settles low on his red boots standing on a dark floor, with a pair of black sunglasses lying beside his right boot. Blurred teal city lights in the background, shallow depth of field, steady gimbal movement, photorealistic, no text.

Save as: `clips/clip2.mp4`

---

### Tips
- If a result morphs the suit or turns the character instead of moving the camera, regenerate once — results vary per seed.
- Don't type "Spider-Man" in the prompt; the images already say who it is, and naming the character can trigger a refusal.
- Watermark? Fine for now — tell me and I'll handle it in post if needed.

When both files are in `clips/`, tell me — I'll upscale, smooth to 60 fps, join and wire them into the hero.
