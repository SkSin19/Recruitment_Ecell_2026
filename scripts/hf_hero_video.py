"""
Generate the R&D hero video on a free Hugging Face ZeroGPU space (LTX-Video distilled)
and re-encode it so the browser can scrub it smoothly on scroll.

Usage (from the recruitment/ folder):
    pip install gradio_client
    python scripts/hf_hero_video.py                      # text-to-video
    python scripts/hf_hero_video.py --image hero-still.png  # image-to-video from your generated still (recommended)

Needs ffmpeg on PATH. Uses HF_TOKEN from the environment if set.
Free ZeroGPU quota is a few minutes per day; if you see "exceeded your free ZeroGPU quota",
wait for the reset time printed in the error.
"""

import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path

from gradio_client import Client, handle_file

SPACE = "Lightricks/ltx-video-distilled"
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "domains" / "rnd"

# Camera move copied from the reference: hold on head/shoulders, then one smooth tilt down
# with a slow orbit (front 3/4 -> side/back), past the legs, settling on the boots + sunglasses.
PROMPT = (
    "Photorealistic cinematic shot, Spider-Man in the MCU red and black suit with fine web texture standing still "
    "in front of a heavily blurred teal and magenta neon city at night. The camera starts on a medium close-up of his masked "
    "head and shoulders, white eye lenses, three-quarter front view, holds for a moment, then performs one smooth continuous "
    "tilt down while slowly orbiting around him to a side and back view: across his chest and back, down his black and red legs, "
    "to his red boots standing on a dark rooftop floor, where a pair of black sunglasses lies on the ground beside his feet. "
    "Camera settles on the boots. Shallow depth of field, teal rim light, soft red key light, film grain, steady gimbal motion"
)
NEGATIVE = "text, letters, typography, logo, shaky, fast motion, worst quality, inconsistent motion, jittery, distorted, deformed hands, extra limbs, text, watermark, cartoon"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--image", help="start frame for image-to-video (e.g. the face close-up of your hero still)")
    ap.add_argument("--seconds", type=float, default=7)
    args = ap.parse_args()

    client = Client(SPACE, verbose=False)
    common = dict(
        prompt=PROMPT,
        negative_prompt=NEGATIVE,
        input_video_filepath=None,
        height_ui=512,
        width_ui=896,
        duration_ui=args.seconds,
        ui_frames_to_use=9,
        seed_ui=42,
        randomize_seed=True,
        ui_guidance_scale=1,
        improve_texture_flag=True,
    )
    if args.image:
        result = client.predict(input_image_filepath=handle_file(args.image), mode="image-to-video", api_name="/image_to_video", **common)
    else:
        result = client.predict(input_image_filepath=None, mode="text-to-video", api_name="/text_to_video", **common)

    raw = result[0]["video"] if isinstance(result[0], dict) else result[0]
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "raw.mp4"
        shutil.copy(raw, src)
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        # Every frame a keyframe (-g 1) so setting currentTime on scroll is instant.
        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-i", str(src), "-vf", "scale=1280:-2,format=yuv420p", "-c:v", "libx264",
             "-g", "1", "-crf", "24", "-preset", "slow", "-movflags", "+faststart", "-an", str(OUT_DIR / "hero.mp4")],
            check=True,
        )
        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-i", str(OUT_DIR / "hero.mp4"), "-frames:v", "1", "-q:v", "3", str(OUT_DIR / "hero-poster.jpg")],
            check=True,
        )
    print("Saved", OUT_DIR / "hero.mp4")


if __name__ == "__main__":
    main()
