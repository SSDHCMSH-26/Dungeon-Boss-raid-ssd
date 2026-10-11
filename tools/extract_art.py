"""game/index.html 안의 base64 그림을 game/art/ 폴더의 이미지 파일로 분리하는 스크립트.

사용법:  python3 tools/extract_art.py
- 이미지 변수(T3A, ART, ART2, ART3, FACE, FACEG, MOBA, FXD, 크리스탈)의 각 그림을
  game/art/<묶음>/<이름>.png(.jpg) 로 저장하고, 코드에는 상대 경로 문자열만 남긴다.
- 원래 "data:image/png;base64,"+값 처럼 접두어를 붙여 쓰던 곳은 경로를 그대로 쓰도록 고친다.
- 이미 분리된 파일에 다시 돌리면 아무것도 바꾸지 않는다(분리할 base64 가 없음).
"""
import base64, io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, 'game', 'index.html')
ART_DIR = os.path.join(ROOT, 'game', 'art')

# (줄 시작 문자열, 저장 폴더, 원래 값에 data: 접두어가 붙어 있는지)
GROUPS = [
    ('const T3A=', 't3a', False),            # 테마3 용사·효과
    ('const ART=', 'art1', True),            # 기존 디자인 스프라이트
    ('const ART2=', 'art2', True),           # 테마2(빈센토) 스프라이트
    ('const ART3=', 'art3', True),           # 테마2(그론) 스프라이트·함정
    ('const FACE=', 'face', True),           # 빈센토 얼굴
    ('Object.assign(ART3,', 'art3b', True),  # 상자·아이템 (ART3 에 덮어씀)
    ('const FACEG=', 'face', True),          # 그론 얼굴
    ('const MOBA=', 'mob', False),           # 미믹·보물 고블린
    ('["y","b"].forEach(', 'crystal', False),# 번개 크리스탈
    ('const FXD=', 'fx', False),             # 공격 이펙트
]
B64 = r'[A-Za-z0-9+/]+=*'
# "키": "값"  또는  키:"값"  형태
ITEM = re.compile(r'("?)([A-Za-z0-9_]+)\1(\s*:\s*)"(data:image/(png|jpeg);base64,)?(' + B64 + r')"')
SINGLE = re.compile(r'^(const (FACE|FACEG)=)"data:image/(png|jpeg);base64,(' + B64 + r')"')
PREFIX = '"data:image/png;base64,"+'


def save(folder, name, b64, ext=None):
    raw = base64.b64decode(b64)
    real = 'png' if raw[:8] == b'\x89PNG\r\n\x1a\n' else 'jpg' if raw[:2] == b'\xff\xd8' else None
    if real is None:
        sys.exit(f'알 수 없는 이미지 형식: {folder}/{name}')
    rel = f'art/{folder}/{name}.{real}'
    path = os.path.join(ROOT, 'game', rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if os.path.exists(path) and open(path, 'rb').read() != raw:
        sys.exit(f'같은 이름의 다른 그림이 이미 있음: {rel}')
    open(path, 'wb').write(raw)
    return rel


def main():
    src = open(HTML, encoding='utf-8').read()
    lines = src.split('\n')
    count = 0
    for start, folder, _ in GROUPS:
        idx = [i for i, l in enumerate(lines) if l.startswith(start)]
        assert len(idx) == 1, f'{start} 줄이 {len(idx)}개'
        i = idx[0]
        m = SINGLE.match(lines[i])
        if m:  # FACE / FACEG : 값 하나
            rel = save(folder, m.group(2).lower(), m.group(4))
            lines[i] = m.group(1) + '"' + rel + '"' + lines[i][m.end():]
            count += 1
            continue

        def rep(mm):
            nonlocal count
            count += 1
            q, key, sep = mm.group(1), mm.group(2), mm.group(3)
            return f'{q}{key}{q}{sep}"{save(folder, key, mm.group(6))}"'
        lines[i] = ITEM.sub(rep, lines[i])
    out = '\n'.join(lines)
    # 접두어를 붙여 쓰던 곳: 이제 값이 경로이므로 접두어 제거
    n = out.count(PREFIX)
    out = out.replace(PREFIX, '')
    left = len(re.findall(r'data:image/[a-z]+;base64,', out)) + len(re.findall(r'iVBORw0KGgo', out))
    open(HTML, 'w', encoding='utf-8').write(out)
    print(f'그림 {count}개 분리, 접두어 {n}곳 제거, 남은 base64 {left}개')
    print(f'index.html: {len(src):,} → {len(out):,} bytes')


if __name__ == '__main__':
    main()
