/**
 * Images are imported straight from the app (../../src/assets) so the Reels
 * reuse the exact product artwork; the 3D icon cut-outs in public/icons were
 * cropped from src/assets/shared/{3d-iconlar…,category-icon}.png.
 */
import { staticFile } from 'remotion';
import heroGear from '../../src/assets/onboarding/premium-rental-app-illustration-1-2.png';
import heroWallet from '../../src/assets/onboarding/premium-rental-app-illustration-1-3.png';
import heroMap from '../../src/assets/onboarding/illustration-2.png';
import mapTiles from '../../src/assets/shared/map-image.png';
import cameraHero from '../../src/assets/home/product-kamera.png';
import cameraNikon from '../../src/assets/search/image.png';
import cameraCanon from '../../src/assets/search/image-3.png';
import cameraNikonBag from '../../src/assets/search/image-5.png';
import ps5 from '../../src/assets/home/product-ps5.jpg';
import scooter from '../../src/assets/home/product-samokat.jpg';
import drone from '../../src/assets/saved/product-dji.jpg';
import ipad from '../../src/assets/home/product-ipad.jpg';
import speaker from '../../src/assets/home/product-kolonka.jpg';
import bike from '../../src/assets/home/product-velosiped.jpg';
import vr from '../../src/assets/location-notification/image.jpg';
import xbox from '../../src/assets/saved/product-xbox.jpg';
import avatarMalika from '../../src/assets/product/avatar-malika.jpg';
import avatarDoston from '../../src/assets/product/avatar-doston.jpg';
import emptyCards from '../../src/assets/empty-states/no-cards.png';
import type { Product } from './copy/types';

export const img = {
  heroGear,
  heroWallet,
  heroMap,
  mapTiles,
  cameraHero,
  cameraNikon,
  cameraCanon,
  cameraNikonBag,
  avatarMalika,
  avatarDoston,
  emptyCards,
};

export const productImage: Record<Product['key'], string> = {
  camera: cameraHero,
  ps5,
  scooter,
  drone,
  ipad,
  speaker,
  bike,
  vr,
  xbox,
};

export type IconName =
  | 'camera' | 'camera2' | 'gamepad' | 'bike' | 'bike2' | 'scooter' | 'speaker' | 'speakers'
  | 'headphones' | 'laptop' | 'tablet' | 'phone' | 'watch' | 'gopro' | 'drone_gopro' | 'lens'
  | 'mic' | 'sneakers' | 'treadmill' | 'dumbbells' | 'helmet' | 'backpack' | 'mat' | 'kayak';

export const icon3d = (name: IconName) => staticFile(`icons/${name}.png`);
