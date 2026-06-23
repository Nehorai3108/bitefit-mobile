import { ImageManipulator, SaveFormat, manipulateAsync } from 'expo-image-manipulator';

// Resize + JPEG-compress a photo before uploading. Modern phone cameras produce
// 12MP images; the vision model downscales internally anyway, so sending a
// ~1024px JPEG keeps recognition accuracy while cutting upload size and — more
// importantly — the number of image tokens billed per scan (the app's biggest
// variable cost). Never blocks the scan: on any failure it returns the original.
export async function compressForUpload(uri, { maxDim = 1024, compress = 0.7 } = {}) {
  // New context API (expo-image-manipulator 13+)
  try {
    if (ImageManipulator?.manipulate) {
      const ctx = ImageManipulator.manipulate(uri).resize({ width: maxDim });
      const ref = await ctx.renderAsync();
      const out = await ref.saveAsync({ compress, format: SaveFormat.JPEG });
      if (out?.uri) return out.uri;
    }
  } catch {
    /* fall through to legacy */
  }
  // Legacy API (still exported, deprecated)
  try {
    const out = await manipulateAsync(
      uri,
      [{ resize: { width: maxDim } }],
      { compress, format: SaveFormat.JPEG },
    );
    if (out?.uri) return out.uri;
  } catch {
    /* fall through to original */
  }
  return uri;
}
