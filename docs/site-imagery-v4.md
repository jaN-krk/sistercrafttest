# SisterCraft&Co — V4 kategori çekimleri

Üretim aracı: built-in `image_gen`. Üç yeni kategori sahnesi ve mum etiketine bir hedefli düzeltme olmak üzere dört üretim çağrısı kullanıldı. Gerçek ürün fotoğrafları görsel kimlik referansıdır; her ürün yeni sahnenin içinde fiziksel olarak yer alır. Fotoğraf çerçevesi veya Polaroid sunumu yoktur.

Kategori görselleri yatay 3:2 biçimindedir. Sitede kategori başlıkları fotoğrafın altındaki ayrı alanda gösterilir. PNG çıktıları çalışma alanının `output/site-imagery-v4/` klasöründe, siteye eklenen WebP dosyaları `storefront/public/editorial/` altında bulunur. WebP oluşturma işlemi yalnızca biçim dönüştürmedir; orijinal ürün galerileri değiştirilmez.

Ürün biçimleri ve belirgin etiketler görsel olarak kontrol edildi. Küçük ambalaj yazılarında üretim farklılıkları olabilir; satışa esas ürün ayrıntıları ve orijinal galeri korunur. İlk mum üretimindeki Vanilla ürün kodu için yalnızca ilgili küçük yazıyı düzelten ikinci çağrı yapıldı. Sitede `category-candles-fixed.png` çıktısının WebP kopyası kullanılır.

Aşağıdaki metinler üretim sırasında kullanılan dosyalardan aynen aktarılmıştır. PNG bağlantıları bu çalışma alanındaki orijinal çıktılara, WebP bağlantıları site deposuna göre verilmiştir.

## Tütsüler

- PNG: [category-incense.png](../../output/site-imagery-v4/category-incense.png)
- Mağazada kullanılan görsel: [category-incense-v4.webp](../public/editorial/category-incense-v4.webp)
- Üretim metni dosyası: [category-incense-prompt.txt](../../output/site-imagery-v4/category-incense-prompt.txt)

### Kullanılan tam üretim metni

```text
Use case: precise-object-edit.
Asset type: horizontal 3:2 finished e-commerce category photograph.
Reference image 1 is the actual SAGE incense bundle to preserve, not a photograph to frame. Extract and place this exact ONE tied sage bundle naturally onto a fireproof pale natural limestone slab. Preserve its botanical leaf textures, narrow cylindrical proportions, ivory cotton string, knot, and existing ivory sleeve label. Keep the label's original appearance and text: "100% Pure Natural Sage", "For Cleansing & Purification", "SAGE", "50 GR", "SisterCraft & co." No new label or branding.
Scene: airy pale sage green and ivory botanical studio, broad gentle daylight with crisp soft-edged botanical shadow falling across a matte light sage backdrop, tactile limestone surface. Premium natural ritual product photography. The product lies diagonally on the stone, with readable front label, turned slightly toward the viewer. One integrated realistic image with contact shadows and matched illumination. Different composition from a dark green vertical multi-bundle hero photograph.
Composition: LANDSCAPE 3:2, single product toward center-right. Entire bundle and stone product resting area must fit between y15% and y68%; bottom 25% remains a calm light ivory foreground for website text. Use quiet negative space to the left and avoid cropping any bundle part. Shallow but restrained depth of field, true dry sage color, no smoke, no flame, no invented products.
Avoid: no picture frame, no polaroid, no photo card, no UI, no captions, no overlay text, no watermark, no other products, no altered herb type, no invented package. The existing product sleeve lettering is the only text.
```

## Mumlar — ilk üretim

- PNG: [category-candles.png](../../output/site-imagery-v4/category-candles.png)
- Bu ilk sürüm sitede kullanılmaz; aşağıdaki düzeltilmiş sürüm kullanılır.
- Üretim metni dosyası: [category-candles-prompt.txt](../../output/site-imagery-v4/category-candles-prompt.txt)

### Kullanılan tam üretim metni

```text
Use case: compositing. Asset type: finished wide 3:2 ecommerce candle category editorial photograph for SisterCraft&Co, distinct from a single-product hero.
Input image 1 is the product identity reference for the open VANILLA candle at the lower right; input image 2 is the identity reference for the closed AMBER NOIR candle. Use exactly these TWO real candle products, not the full stack from reference 1.
Make one integrated premium product photography scene: the open vanilla tin candle rests in the foreground at center-right on natural dark warm limestone with its small real flame, while the closed amber noir tin rests just behind and to its left, slightly higher on a small matching stone step. Their apparent scale must match because they use the same short, wide silver tin packaging. Natural warm sunlight from upper left, textured sage-green and ivory lime-plaster wall softly blurred at the rear, modest leaf shadows at the upper edge. Refined editorial still life, realistic contact shadows and accurate brushed silver metal reflections, tactile stone.
Preserve all essential physical details from the references: the broad low circular silver metal tins, black wrap labels, exact prominent lowercase label names "vanilla" and "amber noir" respectively, the reference label typography, and visible SisterCraft&Co brand artwork on the closed tin's lid. Open vanilla must retain the exact low metal container shape, pale wax, a single wick with modest natural flame. Closed amber noir must remain closed and broad/low, with its branded circular lid visible from the slightly elevated camera angle. Do not replace these products with jars, bottles, cups or generic unbranded candles. No fig or coconut label substitution; the selected open candle is vanilla and selected closed candle is amber noir.
Composition: landscape 3:2. Balanced two-product composition occupying center-right and upper 75 percent of the image, avoiding overlap of front label text. Products approximately centered at x58 percent, y44 percent together. Keep lower 25 percent visually calm, medium-dark natural stone in gentle shade, sufficient clean unbroken space for the website's later white category title. No title or text rendered on the image itself beyond existing packaging. Do not place a photograph, rectangle, card or frame inside the scene. No borders, UI, watermark, additional products or added marketing text. Photorealistic final advertising photo.
```

## Mumlar — kullanılan düzeltilmiş görsel

- PNG: [category-candles-fixed.png](../../output/site-imagery-v4/category-candles-fixed.png)
- Mağazada kullanılan görsel: [category-candles-v4.webp](../public/editorial/category-candles-v4.webp)
- Üretim metni dosyası: [category-candles-fix-prompt.txt](../../output/site-imagery-v4/category-candles-fix-prompt.txt)

### Kullanılan tam üretim metni

```text
Use case: precise-object-edit, a SINGLE tiny packaging text correction to input image 1, the 1536×1024 two-candle category photo. Input image 2 is product-label reference only, not a replacement composition. In input image 1, the open VANILLA candle at the lower right has a small white code that currently reads "N2" / "N.2" at the upper-left area of its black body label, approximately at pixel x800,y709. Change ONLY this small code to exact "N.4", which is the real vanilla product number visible on the open vanilla tin in source image 2. Preserve the same tiny white lettering size, weight, location, perspective and print texture. This is the ONLY change. Keep the entire first image otherwise unchanged: same aspect ratio, camera, framing, product sizes and positions, short wide silver metal tins, vanilla and amber noir words, all other packaging lettering, closed amber noir lid and its branding, open vanilla wax and single flame, contact shadows, stone plinths, leaf shadows, wall, sunlight, color and exposure. Do not redesign labels or regenerate the scene. Do not edit the amber noir product code. No extra text, UI, frame, border, watermark or objects.
```

## Ritüel kutuları

- PNG: [category-ritual.png](../../output/site-imagery-v4/category-ritual.png)
- Mağazada kullanılan görsel: [category-ritual-v4.webp](../public/editorial/category-ritual-v4.webp)
- Üretim metni dosyası: [category-ritual-prompt.txt](../../output/site-imagery-v4/category-ritual-prompt.txt)

### Kullanılan tam üretim metni

```text
Use case: compositing / precise-object-edit.
Asset type: horizontal 3:2 finished premium e-commerce category photograph.
Input image 1 shows the real SisterCraft & co. ritual kit contents with a CLOSED matte black gift box and is the authoritative item layout/identity reference. Input image 2 supplies close-up identity details for those same kit components only. Do not frame either reference photograph. Create one seamless photographic still-life with the actual kit directly inside the new scene.
Scene: bright natural limestone table partly draped with warm ivory linen, softly out-of-focus green garden beyond, angled natural daylight. Refined tactile natural ritual brand aesthetic. DIFFERENT from a dark green hero scene; this is a wide, airy, slightly elevated three-quarter tabletop composition.
Subjects: one closed matte black rectangular gift box at back-left, with its subtle tiny existing white brand mark; beside it the SAME real kit components visible in image 1: one SAGE herbal bundle and one LAVENDER herbal bundle with their actual white sleeve labels and cotton string; two small amber glass dropper bottles with gold collars and white dropper tops; one low round silver tin with dark labelled lid; one small black rectangular tin; one black circular wrapped item tied in twine with round white tag; a small group of the existing pale Palo Santo wood sticks and its little white card; the original white card bearing a single red heart and "Love Blooms"; the small black packet/cards belonging to the kit. Keep herb identity, existing packaging, shapes, materials, count and scale coherent with the references. Do not add any candles, crystals, jars, cups, flowers, other bundles or invented products.
Composition: LANDSCAPE 3:2; all actual products and closed box fully visible, arranged naturally in upper and middle 75% of frame. Low diagonal arrangement, all contact shadows grounded on stone/linen. Bottom 25% quiet pale foreground for website text; no objects crossing bottom edge. Product labels face the camera where possible, retain exact product names "SAGE" and "LAVENDER". No open box.
Avoid: NO picture frame, NO Polaroid, NO white photo card displaying the source image, NO UI, NO captions, NO added promotional text, NO watermark. Only original packaging/label/card text may exist.
```

