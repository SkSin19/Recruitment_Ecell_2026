"""
Builds `doomsday_hero_video.ipynb`: a Kaggle notebook that turns keyframe images into a smooth,
scroll-scrubbable hero video with the open Wan 2.2 first-and-last-frame model (no credits, no filters).

The shot list and its keyframes are embedded, so on Kaggle you only upload the notebook and Run all.

    python video-kits/kaggle/build_notebook.py spiderman
"""

import base64
import json
import sys
from pathlib import Path

KITS = Path(__file__).resolve().parent.parent

# Each kit: keyframes in order, one clip per consecutive pair, plus the camera move for that clip.
SHOT_LISTS = {
    "spiderman": {
        "frames": ["1-head.jpg", "2-back.jpg", "3-legs.jpg"],
        "prompts": [
            "Slow cinematic camera orbit. A masked hero in a red and black suit stands completely still, facing the camera. "
            "The camera starts on a close-up of his masked face, then smoothly circles around to his right side and continues "
            "behind him while drifting slightly downward, ending on his upper back and shoulders. Blurred teal city lights in the "
            "background, shallow depth of field, steady gimbal movement, photorealistic, no text.",
            "Slow cinematic camera move. A masked hero in a red and black suit stands completely still. The camera starts behind "
            "him on his upper back, keeps circling slowly around him while gliding down along his body, past his legs, and settles "
            "low on his red boots standing on a dark floor, with a pair of black sunglasses lying beside his right boot. Blurred teal "
            "city lights in the background, shallow depth of field, steady gimbal movement, photorealistic, no text.",
        ],
    },
    # One start frame, three chained clips: face -> hand raised in profile -> his back -> his legs.
    "blackpanther": {
        "mode": "chain",
        "frames": ["1-face.jpg"],
        "prompts": [
            "Cinematic slow camera move. A superhero in a sleek black vibranium suit with a panther-shaped mask and a silver "
            "claw necklace stands still. The camera slowly arcs around to the right side of his face, showing his masked "
            "profile, while he calmly raises his right hand in front of his face and looks at his open clawed hand. Dark "
            "purple night background with soft blurred lights, shallow depth of field, steady gimbal, photorealistic, no text.",
            "Cinematic slow camera move. The superhero in the black vibranium panther suit keeps his hand raised in front of "
            "his face, looking at it, and does not move. The camera keeps orbiting slowly around him, past his shoulder, "
            "until it is behind him, showing his back and the raised arm. Dark purple night background with soft blurred "
            "lights, shallow depth of field, steady gimbal, photorealistic, no text.",
            "Cinematic slow camera move. The superhero in the black vibranium panther suit stands still with his back to the "
            "camera. The camera glides smoothly straight down along his back, past his waist and legs, and settles low on his "
            "black armored boots on a dark floor. Dark purple night background with soft blurred lights, shallow depth of "
            "field, steady crane movement, photorealistic, no text.",
        ],
    },
    # One start frame, two chained clips: he keeps walking towards the camera for ~10 s.
    "deadpool": {
        "mode": "chain",
        "frames": ["1-walk.jpg"],
        "prompts": [
            "A masked mercenary in a red and black leather suit with two katanas on his back walks slowly and confidently "
            "straight towards the camera, holding a pistol in each hand with both arms relaxed down at his sides. Natural "
            "walking motion, steady pace, the camera slowly tracks backwards in front of him. Dark night city street behind "
            "him with soft blurred lights and a few red highlights, shallow depth of field, cinematic, photorealistic, film "
            "grain, no text.",
            "The masked mercenary in the red and black leather suit keeps walking slowly and confidently towards the camera, "
            "a pistol in each hand, arms relaxed down at his sides, getting closer until he fills the frame from head to knees. "
            "Natural walking motion, steady pace, the camera slowly tracks backwards. Dark night city street with soft blurred "
            "lights and a few red highlights, shallow depth of field, cinematic, photorealistic, film grain, no text.",
        ],
    },
}


def md(text):
    return {"cell_type": "markdown", "metadata": {}, "source": text.strip("\n").splitlines(keepends=True)}


def code(text):
    return {
        "cell_type": "code",
        "metadata": {},
        "execution_count": None,
        "outputs": [],
        "source": text.strip("\n").splitlines(keepends=True),
    }


def build(kit: str) -> Path:
    shots = SHOT_LISTS[kit]
    frames = {name: base64.b64encode((KITS / kit / name).read_bytes()).decode() for name in shots["frames"]}

    cells = [
        md(f"""
# DOOMSDAY · {kit} hero video

Generates the hero clip with **Wan 2.2 image-to-video** (from keyframes, or chained from one start frame), then smooths it to 60 fps.

**Before Run all:** Settings (right panel) → *Accelerator* **GPU T4 ×2** · *Internet* **On** (needs a phone-verified account).
Expect **~30–45 min per clip** at 720p. When it finishes, download the files from the **Output** panel (`/kaggle/working`).
"""),
        md("## 1 · Settings — change these if needed"),
        code(f"""
KIT = {kit!r}
MODE = {shots.get("mode", "keyframes")!r}   # "keyframes": one clip per keyframe pair; "chain": each clip continues the last
WIDTH, HEIGHT = 1280, 720   # if you hit an out-of-memory error, use 960, 544
SECONDS_PER_CLIP = 5        # Wan runs at 16 fps -> 81 frames for 5 s
FINAL_FPS = 60              # motion-interpolated for buttery scroll-scrubbing
SEED = 42
QUANT = "Q4_K_M"            # GGUF quality: Q4_K_M fits a T4; Q5_K_M is sharper but heavier

PROMPTS = {json.dumps(shots["prompts"], indent=4)}
NEGATIVE = ("text, letters, logo, watermark, subtitles, jittery, shaky camera, flicker, distorted body, extra limbs, "
            "deformed hands, morphing suit, character turning around, static frame, blurry, low quality")
"""),
        md("## 2 · Keyframes (embedded)"),
        code(
            "import base64, pathlib\n"
            "KEY_DIR = pathlib.Path('/kaggle/working/keyframes'); KEY_DIR.mkdir(parents=True, exist_ok=True)\n"
            f"FRAMES = {json.dumps(shots['frames'])}\n"
            "_DATA = {\n"
            + "".join(f"    {name!r}: {data!r},\n" for name, data in frames.items())
            + "}\n"
            "for name, data in _DATA.items():\n"
            "    (KEY_DIR / name).write_bytes(base64.b64decode(data))\n"
            "print('keyframes:', sorted(p.name for p in KEY_DIR.iterdir()))\n"
        ),
        md("## 3 · Install ComfyUI + GGUF loader"),
        code("""
import subprocess, sys, os, shutil
def sh(cmd):
    print('$', cmd); subprocess.run(cmd, shell=True, check=True)

os.chdir('/kaggle/working')
if not os.path.exists('/tmp/ComfyUI'):
    sh('git clone --depth 1 https://github.com/comfyanonymous/ComfyUI /tmp/ComfyUI')
    sh('git clone --depth 1 https://github.com/city96/ComfyUI-GGUF /tmp/ComfyUI/custom_nodes/ComfyUI-GGUF')
# Keep Kaggle's preinstalled CUDA torch; install everything else.
sh("grep -viE '^(torch|torchvision|torchaudio)([<>=].*)?$' /tmp/ComfyUI/requirements.txt > /tmp/req.txt")
sh(f'{sys.executable} -m pip install -q -r /tmp/req.txt gguf')
sh('nvidia-smi --query-gpu=name,memory.total --format=csv')
"""),
        md("## 4 · Download models (~27 GB, resolved automatically)"),
        code("""
from huggingface_hub import list_repo_files, hf_hub_download
MODELS = '/tmp/models'
CU = '/tmp/ComfyUI/models'

def find(repos, must, exclude=()):
    for repo in repos:
        try:
            files = list_repo_files(repo)
        except Exception as e:
            print('skip', repo, e); continue
        hits = [f for f in files if all(m.lower() in f.lower() for m in must) and not any(x.lower() in f.lower() for x in exclude)]
        if hits:
            return repo, sorted(hits, key=len)[0]
    return None, None

def fetch(repos, must, folder, exclude=(), required=True):
    repo, path = find(repos, must, exclude)
    if not repo:
        if required: raise SystemExit(f'Could not find a file matching {must}')
        print('optional file not found:', must); return None
    local = hf_hub_download(repo, path, local_dir=MODELS)
    os.makedirs(f'{CU}/{folder}', exist_ok=True)
    dest = f'{CU}/{folder}/{os.path.basename(path)}'
    if not os.path.exists(dest): os.symlink(local, dest)
    print('ok', folder, os.path.basename(path))
    return os.path.basename(path)

GGUF_REPOS = ['QuantStack/Wan2.2-I2V-A14B-GGUF', 'bullerwins/Wan2.2-I2V-A14B-GGUF']
UNET_HIGH = fetch(GGUF_REPOS, ['high', QUANT, '.gguf'], 'unet')
UNET_LOW  = fetch(GGUF_REPOS, ['low',  QUANT, '.gguf'], 'unet')
TEXT_ENC  = fetch(['Comfy-Org/Wan_2.1_ComfyUI_repackaged'], ['text_encoders', 'umt5', 'fp8', '.safetensors'], 'text_encoders')
VAE       = fetch(['Comfy-Org/Wan_2.1_ComfyUI_repackaged'], ['vae', 'wan_2.1_vae', '.safetensors'], 'vae')
# 4-step "Lightning" LoRAs make each clip ~5x faster. Optional: without them we sample 20 steps instead.
LORA_REPOS = ['lightx2v/Wan2.2-Lightning', 'Kijai/WanVideo_comfy']
LORA_HIGH = fetch(LORA_REPOS, ['i2v', 'high', '.safetensors'], 'loras', exclude=['t2v', '5b'], required=False)
LORA_LOW  = fetch(LORA_REPOS, ['i2v', 'low',  '.safetensors'], 'loras', exclude=['t2v', '5b'], required=False)
FAST = bool(LORA_HIGH and LORA_LOW)
print('fast 4-step mode' if FAST else 'standard 20-step mode (slower)')
print(shutil.disk_usage('/tmp'))
"""),
        md("## 5 · Start ComfyUI (headless)"),
        code("""
import time, urllib.request, json as _json
server = subprocess.Popen([sys.executable, 'main.py', '--listen', '127.0.0.1', '--port', '8188',
                           '--disable-auto-launch', '--preview-method', 'none'],
                          cwd='/tmp/ComfyUI', stdout=open('/kaggle/working/comfy.log', 'w'), stderr=subprocess.STDOUT)
for _ in range(180):
    try:
        urllib.request.urlopen('http://127.0.0.1:8188/system_stats', timeout=2); break
    except Exception:
        time.sleep(2)
else:
    raise SystemExit(open('/kaggle/working/comfy.log').read()[-3000:])
print('ComfyUI is up')
"""),
        md("## 6 · Generate one clip per keyframe pair"),
        code("""
def api(path, payload=None):
    req = urllib.request.Request(f'http://127.0.0.1:8188{path}', data=None if payload is None else _json.dumps(payload).encode(),
                                 headers={'Content-Type': 'application/json'})
    return _json.loads(urllib.request.urlopen(req, timeout=60).read())

def workflow(start, end, prompt, prefix):
    steps, split, cfg = (4, 2, 1.0) if FAST else (20, 10, 3.5)
    high = ['1', 0] if not FAST else ['3', 0]
    low  = ['2', 0] if not FAST else ['4', 0]
    g = {
        '1':  {'class_type': 'UnetLoaderGGUF', 'inputs': {'unet_name': UNET_HIGH}},
        '2':  {'class_type': 'UnetLoaderGGUF', 'inputs': {'unet_name': UNET_LOW}},
        '5':  {'class_type': 'ModelSamplingSD3', 'inputs': {'model': high, 'shift': 8.0}},
        '6':  {'class_type': 'ModelSamplingSD3', 'inputs': {'model': low, 'shift': 8.0}},
        '7':  {'class_type': 'CLIPLoader', 'inputs': {'clip_name': TEXT_ENC, 'type': 'wan'}},
        '8':  {'class_type': 'CLIPTextEncode', 'inputs': {'text': prompt, 'clip': ['7', 0]}},
        '9':  {'class_type': 'CLIPTextEncode', 'inputs': {'text': NEGATIVE, 'clip': ['7', 0]}},
        '10': {'class_type': 'VAELoader', 'inputs': {'vae_name': VAE}},
        '11': {'class_type': 'LoadImage', 'inputs': {'image': start}},
        '13': {'class_type': 'WanFirstLastFrameToVideo', 'inputs': {
            'positive': ['8', 0], 'negative': ['9', 0], 'vae': ['10', 0], 'width': WIDTH, 'height': HEIGHT,
            'length': SECONDS_PER_CLIP * 16 + 1, 'batch_size': 1, 'start_image': ['11', 0]}},
        '14': {'class_type': 'KSamplerAdvanced', 'inputs': {
            'model': ['5', 0], 'add_noise': 'enable', 'noise_seed': SEED, 'steps': steps, 'cfg': cfg,
            'sampler_name': 'euler', 'scheduler': 'simple', 'positive': ['13', 0], 'negative': ['13', 1],
            'latent_image': ['13', 2], 'start_at_step': 0, 'end_at_step': split, 'return_with_leftover_noise': 'enable'}},
        '15': {'class_type': 'KSamplerAdvanced', 'inputs': {
            'model': ['6', 0], 'add_noise': 'disable', 'noise_seed': SEED, 'steps': steps, 'cfg': cfg,
            'sampler_name': 'euler', 'scheduler': 'simple', 'positive': ['13', 0], 'negative': ['13', 1],
            'latent_image': ['14', 0], 'start_at_step': split, 'end_at_step': 10000, 'return_with_leftover_noise': 'disable'}},
        '16': {'class_type': 'VAEDecodeTiled', 'inputs': {
            'samples': ['15', 0], 'vae': ['10', 0], 'tile_size': 512, 'overlap': 64, 'temporal_size': 64, 'temporal_overlap': 8}},
        '17': {'class_type': 'SaveImage', 'inputs': {'images': ['16', 0], 'filename_prefix': prefix}},
    }
    if end is not None:  # first + last frame; without an end frame the model animates freely from the start frame
        g['12'] = {'class_type': 'LoadImage', 'inputs': {'image': end}}
        g['13']['inputs']['end_image'] = ['12', 0]
    if FAST:
        g['3'] = {'class_type': 'LoraLoaderModelOnly', 'inputs': {'model': ['1', 0], 'lora_name': LORA_HIGH, 'strength_model': 1.0}}
        g['4'] = {'class_type': 'LoraLoaderModelOnly', 'inputs': {'model': ['2', 0], 'lora_name': LORA_LOW, 'strength_model': 1.0}}
    return g

for name in FRAMES:
    shutil.copy(KEY_DIR / name, f'/tmp/ComfyUI/input/{name}')

clips = []
for i, prompt in enumerate(PROMPTS):
    prefix = f'clip{i + 1}/f'
    if MODE == 'chain':
        start, end = (FRAMES[0] if i == 0 else f'chain{i}.png'), None
    else:
        start, end = FRAMES[i], FRAMES[i + 1]
    print(f'clip {i + 1}: {start} -> {end or "free"} ...', flush=True)
    t0 = time.time()
    pid = api('/prompt', {'prompt': workflow(start, end, prompt, prefix)})['prompt_id']
    while True:
        time.sleep(15)
        hist = api(f'/history/{pid}').get(pid)
        if hist and hist.get('status', {}).get('completed'):
            break
        if hist and hist.get('status', {}).get('status_str') == 'error':
            print(_json.dumps(hist['status'], indent=1)[-3000:]); raise SystemExit('generation failed - see comfy.log')
    clip_dir = f'/tmp/ComfyUI/output/clip{i + 1}'
    out = f'/kaggle/working/clip{i + 1}.mp4'
    sh(f"ffmpeg -y -v error -framerate 16 -pattern_type glob -i '{clip_dir}/*.png' -c:v libx264 -crf 14 -pix_fmt yuv420p {out}")
    clips.append(out)
    if MODE == 'chain':  # the next clip starts exactly where this one ends
        shutil.copy(sorted(pathlib.Path(clip_dir).glob('*.png'))[-1], f'/tmp/ComfyUI/input/chain{i + 1}.png')
    print(f'  done in {(time.time() - t0) / 60:.1f} min -> {out}')
"""),
        md("## 7 · Join, smooth to 60 fps and encode for scroll-scrubbing"),
        code("""
# Consecutive clips share a keyframe, so drop the first frame of every clip after the first.
inputs = ' '.join(f'-i {c}' for c in clips)
chain = ''.join(f'[{k}]' + ('trim=start_frame=1,setpts=PTS-STARTPTS' if k else 'null') + f'[v{k}];' for k in range(len(clips)))
joined = ''.join(f'[v{k}]' for k in range(len(clips)))
final = f'/kaggle/working/{KIT}_hero.mp4'
sh(f"ffmpeg -y -v error {inputs} -filter_complex \\"{chain}{joined}concat=n={len(clips)}:v=1:a=0,"
   f"minterpolate=fps={FINAL_FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,format=yuv420p\\" "
   f"-c:v libx264 -g 1 -crf 18 -preset slow -movflags +faststart -an {final}")
sh(f'ffmpeg -y -v error -i {final} -frames:v 1 -q:v 2 /kaggle/working/{KIT}_hero_poster.jpg')
server.terminate()
print('Download from the Output panel:', final, '+ the clip*.mp4 files')
"""),
    ]

    nb = {
        "cells": cells,
        "metadata": {
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python"},
            "kaggle": {"accelerator": "nvidiaTeslaT4", "isInternetEnabled": True, "isGpuEnabled": True},
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }
    out = Path(__file__).resolve().parent / f"doomsday_{kit}_hero.ipynb"
    out.write_text(json.dumps(nb, indent=1), encoding="utf-8")
    return out


if __name__ == "__main__":
    for kit in sys.argv[1:] or SHOT_LISTS:
        print("wrote", build(kit))
