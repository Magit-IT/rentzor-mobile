import { Config } from '@remotion/cli/config';

// Instagram Reels: H.264 + AAC, yuv420p. CRF 16 keeps gradients clean before
// Instagram's own re-encode.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709');
Config.setOverwriteOutput(true);

// Use a locally installed Chromium/Chrome Headless Shell when one is provided
// (e.g. CI containers without internet); otherwise Remotion downloads its own.
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
