"""Convert the reference's original Type 1 outlines to browser-ready WOFF2.

Only needed to regenerate the checked-in fonts. Requires fonttools and brotli.
Usage: python scripts/convert_fonts.py <directory-containing-bchr8a.pfb>
"""

from pathlib import Path
import sys

from fontTools import agl
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.t1Lib import T1Font


def convert(source, target, style, weight, italic):
    original = T1Font(str(source))
    glyphs = original.getGlyphSet()
    glyph_order = list(glyphs)
    glyph_order.remove(".notdef")
    glyph_order.insert(0, ".notdef")
    charstrings = {}
    metrics = {}
    cmap = {}
    for name in glyph_order:
        glyph = glyphs[name]
        recording = RecordingPen()
        glyph.draw(recording)
        width = int(round(glyph.width))
        pen = T2CharStringPen(width, glyphs)
        recording.replay(pen)
        charstrings[name] = pen.getCharString()
        metrics[name] = (width, 0)
        unicode_text = agl.toUnicode(name)
        if len(unicode_text) == 1:
            cmap[ord(unicode_text)] = name
    builder = FontBuilder(1000, isTTF=False)
    builder.setupGlyphOrder(glyph_order)
    builder.setupCharacterMap(cmap)
    builder.setupCFF(
        "CharterWeb-" + style,
        {
            "FullName": "Charter Web " + style,
            "FamilyName": "Charter Web",
            "Weight": "Bold" if weight == 700 else "Normal",
            "ItalicAngle": original["FontInfo"]["ItalicAngle"],
            "Notice": "Copyright 1989-1992 Bitstream Inc. See LICENSE.txt. BITSTREAM CHARTER is a registered trademark of Bitstream Inc.",
        },
        charstrings,
        {},
    )
    builder.setupHorizontalMetrics(metrics)
    builder.setupHorizontalHeader(ascent=960, descent=-240)
    builder.setupNameTable({
        "familyName": "Charter Web",
        "styleName": style,
        "uniqueFontIdentifier": "CharterWeb-" + style,
        "fullName": "Charter Web " + style,
        "psName": "CharterWeb-" + style,
        "version": "Version 1.0",
        "copyright": "Copyright 1989-1992 Bitstream Inc.",
        "licenseDescription": (target.parent / "LICENSE.txt").read_text(encoding="utf-8"),
    })
    builder.setupOS2(
        sTypoAscender=960, sTypoDescender=-240, sTypoLineGap=0,
        usWinAscent=960, usWinDescent=240, usWeightClass=weight,
        fsSelection=(1 if italic else 0) | (32 if weight == 700 else 0) | (64 if weight == 400 and not italic else 0),
    )
    builder.setupPost(italicAngle=original["FontInfo"]["ItalicAngle"])
    builder.font["head"].macStyle = (1 if weight == 700 else 0) | (2 if italic else 0)
    builder.font.flavor = "woff2"
    builder.save(str(target))
    print(f"Created {target.name}: {len(glyph_order)} original glyphs")


if __name__ == "__main__":
    source_dir = Path(sys.argv[1])
    output = Path(__file__).resolve().parent.parent / "assets" / "fonts"
    output.mkdir(parents=True, exist_ok=True)
    for filename, style, weight, italic in (
        ("bchr8a.pfb", "Regular", 400, False),
        ("bchb8a.pfb", "Bold", 700, False),
        ("bchri8a.pfb", "Italic", 400, True),
        ("bchbi8a.pfb", "BoldItalic", 700, True),
    ):
        convert(source_dir / filename, output / f"charter-{style.lower()}.woff2", style, weight, italic)
