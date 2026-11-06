#!/usr/bin/env python3
"""css/style.css → css/light.css (라이트 모드 덮어쓰기)

style.css 의 색이 들어간 선언만 골라 html[data-theme="light"] 아래로 복사하고 색을 바꾼다.
- 어두운 무채색(바탕·패널·테두리) → 밝은 회청색 (바탕 #ebeef4, 패널은 흰색 쪽)
- 밝은 글자색 → 어두운 글자색
- 푸른 은색 포인트 → 포인트 #95afe3 (글자색으로 쓰일 때는 읽히도록 더 진하게)
- 흰색 반투명 덧칠 ↔ 검은색 반투명, 그림자는 옅게
- 그 밖의 뚜렷한 색(역할 색·HP·골드 등)은 그대로
style.css 를 고친 뒤에는 이 스크립트를 다시 돌려 light.css 를 새로 만든다:  python3 tools/gen-light-css.py
"""
import re, colorsys, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'css', 'style.css')
OUT = os.path.join(ROOT, 'css', 'light.css')
SCOPE = 'html[data-theme="light"]'
BG = (0xeb, 0xee, 0xf4)
POINT = (0x95, 0xaf, 0xe3)
POINT_TXT = (0x4a, 0x6c, 0xb0)
# 색 토큰은 이름으로 직접 지정 (글자에 많이 쓰이는 포인트 토큰은 읽히도록 한 단계 진하게)
NAMED = {
    '--gold': '#5577bf', '--gold-hi': '#3f63b0', '--steel-hi': '#3f63b0', '--silver': '#5577bf',
    '--steel': '#6a89c9', '--gold-lo': '#95afe3', '--violet': '#4f7fc8', '--violet-hi': '#3f6fb8',
    '--mp': '#4a76c4', '--tank': '#3b7ad8', '--mag': '#1d93a5', '--heal': '#2f9e5f', '--dps': '#d24a4a',
    '--hp': '#c24f4f', '--xp': '#9a8657', '--violet-lo': '#cfd7e6',
}
CASCADE_PROPS = re.compile(r'^(color|background(-color|-image)?|border(-(top|right|bottom|left))?(-color)?|outline(-color)?|box-shadow|text-shadow|fill|stroke|-webkit-text-fill-color)$')
FILL_VARS = re.compile(r'var\(--(gold|gold-hi|steel|steel-hi|silver)\)')

COLOR_RE = re.compile(r'(#|%23)([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b(?![0-9a-fA-F])|(rgba?)\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)')
TEXT_PROPS = ('color', 'fill', '-webkit-text-fill-color', 'caret-color', 'text-decoration-color')


def hls(r, g, b):
    return colorsys.rgb_to_hls(r / 255, g / 255, b / 255)


def rgb(h, l, s):
    return tuple(round(max(0, min(1, x)) * 255) for x in colorsys.hls_to_rgb(h, l, s))


def map_rgb(r, g, b, prop, a=None):
    h, l, s = hls(r, g, b)
    hd = h * 360
    is_text = prop in TEXT_PROPS
    # 푸른 은색 포인트(색상 180~240, 어느 정도 채도, 밝은 편)
    if 180 <= hd <= 245 and s >= 0.2 and l >= 0.5:
        return POINT_TXT if is_text else POINT
    # 무채색에 가까운 색
    if s < 0.18 or (180 <= hd <= 250 and l < 0.4):
        if a is not None:
            # 반투명 덧칠: 흰색 계열은 어둡게, 검은색 계열(그림자)은 그대로 두되 옅게는 호출부에서
            if l > 0.6:
                return (30, 40, 60)
            if l < 0.1:
                return (20, 28, 45)
            return rgb(220 / 360, 1 - l, 0.18)
        if l < 0.105:                       # 가장 어두운 바탕
            return BG
        if l < 0.2:                         # 패널·칸 바탕 → 흰색 쪽
            return rgb(220 / 360, 0.995 - (l - 0.105) * 0.35, 0.35)
        if l < 0.36:                        # 테두리·구분선
            return rgb(220 / 360, 0.9 - (l - 0.2) * 0.6, 0.22)
        # 글자색: 밝기 뒤집기
        return rgb(220 / 360, max(0.1, 1.04 - l), 0.2)
    # 뚜렷한 색: 아주 밝으면 글자로 읽히게 조금 어둡게
    if is_text and l > 0.78:
        return rgb(h, 0.42, max(s, 0.45))
    if not is_text and l < 0.16:            # 아주 어두운 색 바탕(예: 색 들어간 어두운 칸) → 옅은 색 바탕
        return rgb(h, 0.93, min(0.6, s + 0.1))
    return (r, g, b)


def conv_value(val, prop):
    def rep(m):
        if m.group(2):
            x = m.group(2)
            if len(x) == 3:
                x = ''.join(c * 2 for c in x)
            r, g, b = int(x[0:2], 16), int(x[2:4], 16), int(x[4:6], 16)
            nr, ng, nb = map_rgb(r, g, b, prop)
            return f'{m.group(1)}{nr:02x}{ng:02x}{nb:02x}'
        r, g, b = int(m.group(4)), int(m.group(5)), int(m.group(6))
        a = m.group(7)
        if a is None:
            nr, ng, nb = map_rgb(r, g, b, prop)
            return f'rgb({nr},{ng},{nb})'
        af = float(a)
        h, l, s = hls(r, g, b)
        nr, ng, nb = map_rgb(r, g, b, prop, af)
        if prop.startswith('background') and l < 0.25 and (s < 0.3 or 180 <= h * 360 <= 250) and af >= 0.3:
            return f'rgba(255,255,255,{round(min(1, af + 0.5), 3)})'   # 어두운 반투명 패널 → 흰 패널
        if prop.startswith('background') and l < 0.25 and s < 0.3:
            return f'rgba(20,28,45,{round(af * 0.5, 3)})'             # 옅은 어두운 덧칠 → 더 옅게
        if l < 0.1 and s < 0.3:             # 검은 그림자 → 옅게
            af = round(af * 0.35, 3)
        elif l > 0.6 and s < 0.3:            # 흰색 덧칠 → 어두운 덧칠, 조금 옅게
            af = round(min(af, 0.5) * 0.7, 3)
        return f'rgba({nr},{ng},{nb},{af})'
    return COLOR_RE.sub(rep, val)


def split_top(s, sep):
    out, depth, q, cur = [], 0, None, ''
    for ch in s:
        if q:
            cur += ch
            if ch == q:
                q = None
            continue
        if ch in '"\'':
            q = ch
        elif ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
        if ch == sep and depth == 0:
            out.append(cur)
            cur = ''
        else:
            cur += ch
    out.append(cur)
    return out


def scope_sel(sel):
    parts = []
    for p in split_top(sel, ','):
        p = p.strip()
        if not p:
            continue
        if p.startswith(':root'):
            parts.append(SCOPE + p[len(':root'):])
        elif p.startswith('html'):
            parts.append(SCOPE + p[len('html'):])
        else:
            parts.append(f'{SCOPE} {p}')
    return ','.join(parts)


KEEP_DARK = re.compile(r'\.(thsw|wm|wmap|mapmodal)\b(?!-dd)|\.wm-(?!dd)|\.hcmd\.on|#glx-ov|\.gsay|\.pv\b|\.pv-|\.walk|\.wk-|\.sundial|\.sd-|\.qtablet|\.qt-|\.lake|\.lk-|\.shards|\.sh-face|\.snowv|\.sv-|\.snow-modal|#seq-ov|#rn-gate|\.cc-|\.cflag|\.cfl-|\.cd-')   # 지역 보기 드롭다운(.wm-dd)은 지도 밖 UI라 라이트로 바꿈


def keep_decls(body):
    out = []
    for d in split_top(body, ';'):
        if ':' not in d:
            continue
        prop, val = d.split(':', 1)
        prop = prop.strip().lower()
        if (CASCADE_PROPS.match(prop) or prop.startswith('--')) and val.strip():
            out.append(f'{prop}:{val.strip()}')
    return ';'.join(out)


def conv_decls(body):
    out = []
    for d in split_top(body, ';'):
        if ':' not in d:
            continue
        prop, val = d.split(':', 1)
        prop = prop.strip().lower()
        if prop in NAMED:
            out.append(f'{prop}:{NAMED[prop]}')
            continue
        if prop.startswith('background') and FILL_VARS.search(val) and not COLOR_RE.search(val):
            out.append(f'{prop}:{FILL_VARS.sub("#95afe3", val).strip()}')   # 포인트 토큰으로 칠한 면은 포인트색 그대로
            continue
        if not COLOR_RE.search(val):
            # 색이 없는 값(transparent·none·var 등)도 색 관련 속성이면 그대로 옮긴다.
            # 라이트 규칙은 앞에 html[data-theme] 이 붙어 우선순위가 높아지므로, 원래 순서대로 덮어쓰던 값이 빠지면 뒤집힌다.
            if CASCADE_PROPS.match(prop) and val.strip():
                out.append(f'{prop}:{val.strip()}')
            continue
        nv = conv_value(val, prop)
        if nv != val:
            out.append(f'{prop}:{nv.strip()}')
    return ';'.join(out)


def walk(css):
    """{ } 블록을 따라가며 색 선언만 옮긴다. @media 는 안쪽을 다시 따라감, @keyframes·@font-face 는 건너뜀."""
    out, i, n = [], 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0:
            break
        head = css[i:j].strip()
        # 블록 끝 찾기
        depth, k, q = 0, j, None
        while k < n:
            ch = css[k]
            if q:
                if ch == q:
                    q = None
            elif ch in '"\'':
                q = ch
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    break
            k += 1
        body = css[j + 1:k]
        i = k + 1
        head = re.sub(r'/\*.*?\*/', '', head, flags=re.S).strip()
        if not head:
            continue
        if head.startswith('@media') or head.startswith('@supports'):
            inner = walk(body)
            if inner:
                out.append(f'{head}{{{inner}}}')
        elif head.startswith('@'):
            continue
        elif KEEP_DARK.search(head):
            # 어두운 그대로 두는 곳(세계 지도, 모드 스위치): 색 관련 선언을 바꾸지 않고 옮겨 우선순위만 맞춘다
            d = keep_decls(re.sub(r'/\*.*?\*/', '', body, flags=re.S))
            if d:
                out.append(f'{scope_sel(head)}{{{d}}}')
        else:
            d = conv_decls(re.sub(r'/\*.*?\*/', '', body, flags=re.S))
            if d:
                out.append(f'{scope_sel(head)}{{{d}}}')
    return '\n'.join(out)


def main():
    css = open(SRC, encoding='utf-8').read()
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    body = walk(css)
    tail = f"""
/* 직접 지정: 바탕 · 포인트 */
{SCOPE}{{color-scheme:light}}
{SCOPE} body{{background:#ebeef4!important;color:#2e3546}}
{SCOPE} body::before{{background:#ebeef4}}
/* 만신전 출현 팝업 항목 이름(출현 위치·집결 시간 등): 라이트에서 분홍 → 검정(프론트) */
{SCOPE} .modal.evpm .evp-dl dt{{color:#1a1d24;font-weight:600}}
/* 선택된 퀘스트 줄: 라이트 모드에서는 옅게(프론트) */
{SCOPE} .list .li.clickable[aria-current="true"],{SCOPE} .li.clickable[aria-current="true"]{{background:#eef2fa}}
/* 팝업·채팅 시트 뒤 가림막: 라이트에서도 흰색이 아니라 어둡게 흐리게(프론트) */
{SCOPE} .scrim,{SCOPE} body.chat-open #chatbk{{background:rgba(28,34,48,.38)}}
{SCOPE}{{--st-buff:#e0b13a;--st-debuff:#7448d0;--st-heal:#45bf78}}
/* 역할 칩(탱·딜·힐) 글자 대비 4.5 이상: 라이트에서는 칩 색만 한 톤 진하게(프론트) */
{SCOPE} .chip.tank:not(.cls){{background:#2a62b8}}
{SCOPE} .chip.dps:not(.cls){{background:#b53434}}
{SCOPE} .chip.heal:not(.cls){{background:#1a7442}}
{SCOPE} .mass-card .chip.tank:not(.cls):not(.dim){{background:color-mix(in srgb,#2a62b8 10%,transparent);border-color:#2a62b8;color:#2a62b8}}
{SCOPE} .mass-card .chip.dps:not(.cls):not(.dim){{background:color-mix(in srgb,#b53434 10%,transparent);border-color:#b53434;color:#b53434}}
{SCOPE} .mass-card .chip.heal:not(.cls):not(.dim){{background:color-mix(in srgb,#1a7442 10%,transparent);border-color:#1a7442;color:#1a7442}}
{SCOPE} .chip.st-debuff,{SCOPE} .hud-fx.st-debuff{{color:#fff}}
{SCOPE} .gtel,{SCOPE} .gtel.aoe{{background:#fff;box-shadow:none}}
{SCOPE} .gtel .gtel-k,{SCOPE} .gtel .tk-run{{color:#c62828}}
{SCOPE} .hud-lvl,{SCOPE} .hud-tag{{color:#8a6a1c}}
{SCOPE} .sks-n{{color:#fff;background:linear-gradient(0deg,rgba(0,0,0,.85),transparent)}}
/* 만신전 커맨드 창 투명도(메인): 라이트에서는 흰 바탕에 투명도 */
@media (min-width:1101px){{{SCOPE} .gfx .gf-act{{background:rgba(255,255,255,calc(.95*var(--hud-a,1)))!important;border-color:rgba(28,34,48,calc(.14*var(--hud-a,1)))}}}}
/* 만신전 보스 칸: 라이트에서 그라데이션 없이 짙은 붉은 단색(프론트) */
{SCOPE} .gboss{{background:#9b2c2c;border-color:#7a1f1f}}
{SCOPE} .gboss b{{color:#fff}}
{SCOPE} .gboss small{{color:#ffd6d6}}
/* 라이트 모드 글자 대비 정리(프론트, 2026-11-07): 흐린 글자·경고·완료 색을 한 톤 진하게(작은 글씨 4.5:1 안팎) */
{SCOPE}{{--faint:#66708a;--warn:#8a5a10;--ok:#287045;--bad:#b93838;--luck:#6a4fc0}}
{SCOPE} .btn-primary,{SCOPE} .btn-primary .num{{color:#1a2240}}
{SCOPE} .chip.tank .faint,{SCOPE} .chip.dps .faint,{SCOPE} .chip.heal .faint{{color:inherit;opacity:.78}}
{SCOPE} .qcats .li[aria-current="true"] small{{color:#2f62b8}}
{SCOPE} .qcats .list[data-cat="epic"] .li[aria-current="true"] small{{color:#7a5c14}}
{SCOPE} .qcats .li[aria-current="true"] b{{color:var(--text)}}
/* 카지노 골든 오아시스: 연한 금색 글자 → 짙은 금색, 달팽이 트랙 어두운 바탕 → 밝은 모래색 */
{SCOPE} .md-sec>h3.cas-title,{SCOPE} .cas-title{{color:#7a5c14!important;text-shadow:none}}
{SCOPE} .cas-g b,{SCOPE} .cshop-t b,{SCOPE} .sn-mult b{{color:#7a5c14}}
{SCOPE} .cas-c{{color:#8a5a10}}
{SCOPE} .sn-track{{background:linear-gradient(180deg,#f6efe0,#efe5d2);border-color:rgba(138,106,28,.35)}}
{SCOPE} .sn-road{{border-bottom-color:rgba(122,92,20,.3)}}
/* 공방 종류 표시(제작·요리·연금) */
{SCOPE} .cm-k.k-craft{{color:#9a5a14}}
{SCOPE} .cm-k.k-cook{{color:#287045}}
{SCOPE} .cm-k.k-alch{{color:#6a4fc0}}
{SCOPE} .cf-warn{{color:#8a5a10!important}}
{SCOPE} .ol-badge{{color:#b93838}}
{SCOPE} .casino{{background:linear-gradient(160deg,#f7efd9,#fff 60%)!important;border-color:rgba(138,106,28,.4)!important}}
{SCOPE} .vil-say.theft{{background:#fbecea}}
{SCOPE} .vil-say.theft p{{color:#a3332b}}
"""
    open(OUT, 'w', encoding='utf-8').write('/* 자동 생성 파일 — 직접 고치지 말고 tools/gen-light-css.py 를 고친 뒤 다시 만드세요 */\n' + body + '\n' + tail)
    print('light.css', len(body.splitlines()), 'rules')


if __name__ == '__main__':
    main()
