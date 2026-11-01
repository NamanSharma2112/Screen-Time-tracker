#!/usr/bin/env python3
"""Generates seamless ambient noise loops for body-doubling mode (no third-party audio needed).

Usage: python3 scripts/generate-ambient.py   (needs numpy + ffmpeg)
"""
import os
import subprocess
import tempfile
import wave

import numpy as np

SR = 22050
SECONDS = 24
FADE = 2.0  # crossfade seconds to make the loop seamless
ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds')


def brown(n, rng):
    x = np.cumsum(rng.standard_normal(n))
    # Leaky integration keeps it from drifting.
    x = x - np.convolve(x, np.ones(SR) / SR, mode='same')
    return x


def pink(n, rng):
    # Voss-McCartney-ish: filter white noise with 1/f spectrum in the frequency domain.
    white = rng.standard_normal(n)
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = 1
    spectrum = np.fft.rfft(white) / np.sqrt(f)
    return np.fft.irfft(spectrum, n)


def lowpass(x, cutoff):
    f = np.fft.rfftfreq(len(x), 1 / SR)
    spec = np.fft.rfft(x)
    spec *= 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(spec, len(x))


def make_loop(signal):
    fade = int(FADE * SR)
    body, tail = signal[:-fade], signal[-fade:]
    ramp = np.linspace(0, 1, fade)
    body[:fade] = body[:fade] * ramp + tail * (1 - ramp)
    body = body / np.max(np.abs(body)) * 0.5
    return body


def write(name, signal):
    pcm = (signal * 32767).astype(np.int16)
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        with wave.open(tmp.name, 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        out = os.path.join(ROOT, f'{name}.m4a')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp.name, '-c:a', 'aac', '-b:a', '64k', out], check=True)
    print(f'✓ assets/sounds/{name}.m4a')


rng = np.random.default_rng(7)
n = SR * SECONDS + int(FADE * SR)
os.makedirs(ROOT, exist_ok=True)
write('brown-noise', make_loop(lowpass(brown(n, rng), 900)))
write('pink-noise', make_loop(lowpass(pink(n, rng), 4000)))
