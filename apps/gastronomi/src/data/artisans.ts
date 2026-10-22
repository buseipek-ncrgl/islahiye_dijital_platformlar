import { Artisan } from '../types';

/**
 * Artisans and Producers Dataset
 *
 * CRITICAL RULE:
 * In accordance with AGENTS.md Section 4 and corporate accuracy directives,
 * NO fabricated master profiles, unverified names, fake biographies, or stock portraits
 * are presented as real local artisans.
 *
 * This dataset is preserved as an empty array until real local artisans and producers
 * grant formal publication releases and field documentation is verified.
 */
export const ARTISANS: Artisan[] = [];

export const ARTISAN_PROJECT_INFO = {
  badge: 'Mutfak Zanaatları & Emek',
  title: 'Ocaklığın ve Toprağın Zanaat Mirası',
  subtitle:
    'İslahiye mutfak kültürünü şekillendiren fırın ritüelleri, bereketli ova üretimi ve geleneksel el becerilerinin kültürel anlatımı.',
  description:
    "Bu bölüm, İslahiye'nin mutfak zanaatlarını tanıtan temsili bir kültürel içerik alanıdır. Gerçek usta ve üretici profilleri, doğrulanmış bilgiler ve gerekli yayın izinleri sağlandığında eklenebilir.",
  craftCategories: [
    {
      id: 'bakery',
      title: 'Taş Fırın & Ocaklık Kültürü',
      desc: 'Sabahın ilk meşe ateşini yakan, bakır tepsilerde İslahiye tavasını demlendiren ve tırnaklı pideyi kürekle alevle buluşturan çarşı ocaklığı geleneği.',
      fieldCountLabel: 'Temsili Kültürel Anlatı',
    },
    {
      id: 'agriculture',
      title: 'Toprak & Biber Üretimi',
      desc: 'İslahiye Ovası’nın alüvyon toprağında tescilli biberi yetiştiren, eylül sergilerinde güneşte kurutan ve taş dibeklerde işleyen ova emektarları.',
      fieldCountLabel: 'Temsili Kültürel Anlatı',
    },
    {
      id: 'pastry',
      title: 'Geleneksel Hamur Zanaatı',
      desc: 'Ahşap oymalı kalıplarla bayram kömbesini desenleyen ve sac üzerinde peynirli semsek böreği yufkası açan mutfak ustaları.',
      fieldCountLabel: 'Temsili Kültürel Anlatı',
    },
  ],
};

