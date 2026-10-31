# Generating hero videos on Kaggle (free)

The notebook runs the open **Wan 2.2 first + last frame** model (14B, GGUF) in a headless ComfyUI on
Kaggle's free GPU. No credits, no watermark, no content filter. Our keyframes are embedded in it.

## One-time setup (5 min)
1. Create an account at **kaggle.com**.
2. Profile → **Settings** → **Phone verification**. Required — without it Kaggle won't give you a GPU or internet.

## Each run
1. **kaggle.com → Create → New Notebook.**
2. **File → Import Notebook** → upload `doomsday_spiderman_hero.ipynb` (this folder).
3. Right-hand panel → **Session options**:
   - **Accelerator: GPU T4 ×2**
   - **Internet: On**
4. **Run all** (▶▶ at the top). You can leave the tab; keep the session running.
   - Install + model download: ~10 min (≈27 GB).
   - Each clip: ~30–45 min at 1280×720 (2 clips for Spider-Man).
5. When the last cell prints `Download from the Output panel`, open **Output** (right panel → `/kaggle/working`) and download:
   - `spiderman_hero.mp4` — the finished, joined, 60 fps video
   - `spiderman_hero_poster.jpg`
   - `clip1.mp4`, `clip2.mp4` — the raw clips (handy if one needs redoing)
6. Put them in `video-kits/spiderman/clips/` and tell me — I'll review and wire them in.

## If something goes wrong
- **Out of memory (CUDA OOM):** in cell 1 set `WIDTH, HEIGHT = 960, 544` and Run all again.
- **"generation failed":** open `comfy.log` in the Output panel and send me the last lines.
- **No GPU option / Internet greyed out:** phone verification isn't done yet.
- Free quota is ~30 GPU hours a week, so a full Spider-Man run (~1.5 h) fits many times over.

## Rebuilding / other heroes
Shot lists live in `build_notebook.py` (`SHOT_LISTS`). Add a kit folder with numbered keyframes, add its prompts, then:

```bash
python video-kits/kaggle/build_notebook.py spiderman
```
