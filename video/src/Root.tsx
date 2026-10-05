import React from 'react';
import { Composition, Still } from 'remotion';
import { FPS, HEIGHT, WIDTH } from './brand';
import { ExplainerCover, PromoCover } from './Covers';
import { loadFonts } from './fonts';
import { Explainer, EXPLAINER_FRAMES } from './explainer/Explainer';
import { Promo, PROMO_FRAMES } from './promo/Promo';

loadFonts();

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Promo-ru" component={Promo} durationInFrames={PROMO_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ lang: 'ru' }} />
    <Composition
      id="Explainer-ru"
      component={Explainer}
      durationInFrames={EXPLAINER_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ lang: 'ru' }}
    />
    <Still id="PromoCover-ru" component={PromoCover} width={WIDTH} height={HEIGHT} defaultProps={{ lang: 'ru' }} />
    <Still id="ExplainerCover-ru" component={ExplainerCover} width={WIDTH} height={HEIGHT} defaultProps={{ lang: 'ru' }} />
  </>
);
