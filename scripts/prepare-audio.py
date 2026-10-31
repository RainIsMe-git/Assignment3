"""Convert the four user-supplied WAV files into compact game assets.
Usage: python scripts/prepare-audio.py <source-folder> <ffmpeg-executable>
Original recordings remain untouched. FFmpeg is only a build-time tool.
"""
import subprocess, sys
from pathlib import Path
source, ffmpeg = Path(sys.argv[1]), sys.argv[2]
destination = Path(__file__).resolve().parent.parent / 'dist/assets/audio'
destination.mkdir(parents=True, exist_ok=True)
inputs = {
    'light': 'ES_Lasers, Gun, Fire, Shoot, Discharge, Singular - Epidemic Sound.wav',
    'medium': 'ES_Lasers, Gun, Plasma Blaster, Shoot, Fire, Single Rounds, Dull - Epidemic Sound.wav',
    'heavy': 'ES_Lasers, Gun, Fire, Shoot, Powerful, Exhaust, Steam, Scifi, Variations - Epidemic Sound.wav',
    'music': "ES_Well I Just Don't Care - Stationary Sign.wav",
}
jobs = [
    ('music', 'garden-jazz.mp3', [], 'afade=t=in:d=0.15,afade=t=out:st=136.5:d=1.5', 2, '128k'),
    ('light', 'shot-light.mp3', ['-t', '0.58'], 'volume=3dB,afade=t=out:st=0.49:d=0.09', 1, '96k'),
    ('medium', 'shot-medium.mp3', ['-t', '0.88'], 'afade=t=out:st=0.7:d=0.18', 1, '96k'),
    ('heavy', 'shot-heavy.mp3', ['-t', '2.3'], 'volume=-4dB,afade=t=out:st=1.55:d=0.75', 1, '112k'),
    ('heavy', 'charge-loop.mp3', ['-ss', '0.28', '-t', '0.72'], 'areverse,highpass=f=180,lowpass=f=1800,afade=t=in:d=0.04,afade=t=out:st=0.68:d=0.04', 1, '96k'),
]
for key, name, selection, filters, channels, bitrate in jobs:
    subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source / inputs[key]), *selection, '-af', filters, '-ac', str(channels), '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', bitrate, str(destination / name)], check=True)
    print(name, (destination / name).stat().st_size)
