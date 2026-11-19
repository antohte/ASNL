export const official = 'https://app.grinta.eu/asnl';
export const categories = {
  all: 'Tout voir', jerseys: 'Maillots', shorts: 'Shorts', shirts: 'T-shirts', caps: 'Casquettes', accessories: 'Accessoires',
} as const;

export type Category = keyof typeof categories;
export type Age = 'adult' | 'kid';
type ProductCategory = Exclude<Category, 'all'>;

type ListedProduct = readonly [
  name: string,
  price: number,
  slug: string,
  signature: string,
  imageKey: string,
  category?: ProductCategory,
  age?: Age,
];

// Catalogue public Grinta relevé le 19 novembre 2026.
const catalog = [
  ['Gommes', 1, 'gommes', 'jAGnwVaYO963UV3yBmvFveJkhNjmstd0aVHFam4gEb8', '10rstqr0nkkf2jk8wdnmf6b9u7qg'],
  ['Crayons de couleurs', 5, 'crayons-de-couleurs', 'zTRqSW37nxE-YY0dgUKUSdPdtToQupGNAaWA28ofp6M', 'rcxb7rvw3pi9eh25me3bkt5mb7rj'],
  ['Ballon taille 5 23/24', 20, 'ballon-taille-5-23-24', '8nS_uAyDGl3G1wF2xLobkGfyByov3t0VtklgjJ4fHpc', 'm6m8zk6klqflu6iegxlf6ftqduy7'],
  ['Mini-ballon 23/24', 12, 'mini-ballon-23-24', '8nS_uAyDGl3G1wF2xLobkGfyByov3t0VtklgjJ4fHpc', 'm6m8zk6klqflu6iegxlf6ftqduy7'],
  ['Stylo 4 couleurs 24/25', 5.99, 'stylo-4-couleurs-24-25', 'ZZVa_BDfFyOVeuylFXsTQEuUJdH7_115efQLp8Bu_Nk', 'xfhm64gjqdq1q6ty0wa8un2aedgn'],
  ['Magnet 24/25', 6, 'magnet-24-25', 'cohaG4RUDHc8WtTP8x_IUSBMrtDwGRfWtQXwnMBcOXo', 'uz2mq7maju77ebd5gm77i5y218w9'],
  ['Petit fanion 24/25', 10, 'petit-fanion-24-25', 'IfQF86xu5UsxF3xQPQ6PETmaijlmmxOCrvEqIctAJ9I', 'qy0hnf3yoa0lskenug3b3oqywexl'],
  ['Cache-cou 24/25', 9, 'cache-cou-24-25', '7D51mb6G7BUo7v93tG4HMdYSnCmsPmXFOGC6C7AvtA4', 'lf2ql3fr25mi31l6187tbaho4tdt'],
  ['Serviette de plage 24/25', 30, 'serviette-plage-24-25', 'faToRr9JiBr6EHcSEKqYVVaLwZwdmqBjuk3Q_GwzHBo', '31319z4u16p9tf8ro18xadmoynxi'],
  ['Plaid 24/25', 20, 'plaid-24-25', 'QGRMTXStyC7TptBPrqVIoQE_pK3qrolf_g4mM-NKSN4', 'kpul1z8emtqq0y5g92pxp38yefq6'],
  ['Drapeau blanc 60 × 40 25/26', 6, 'drapeau-60x40-25-26?color=blanc', '2wIqf0Lj861ARjBJVXLPnntEr7lzklExhbrzUJSfzJk', 'kft2zapug8je4e4r3azzev07cmq5'],
  ['Drapeau rouge 60 × 40 25/26', 6, 'drapeau-60x40-25-26?color=rouge', 'RdAsjS920zO4XhDEpPlJk-E5uatLLesrQj78CxeNl08', 'wucqeyfhoonvqod9hk45l21x51fs'],
  ['Drapeau blanc 75 × 120 25/26', 12, 'drapeau-75x120-25-26?color=blanc', '2wIqf0Lj861ARjBJVXLPnntEr7lzklExhbrzUJSfzJk', 'kft2zapug8je4e4r3azzev07cmq5'],
  ['Drapeau rouge 75 × 120 25/26', 12, 'drapeau-75x120-25-26?color=rouge', 'RdAsjS920zO4XhDEpPlJk-E5uatLLesrQj78CxeNl08', 'wucqeyfhoonvqod9hk45l21x51fs'],
  ['Short de bain 25/26', 29, 'short-de-bain-25-26', 'vZNjoOANZOlVRDQ1-dbrfzT2wn0g_4GPUtUBIohfZUY', '1g0bcp3xfpoypgzu8ctyjafqxgyp', 'shorts'],
  ['T-shirt Champion adulte 24/25', 15, 'tshirt-champion-adulte-24-25', '_D-A_EAqtrFEjw1051dcTLd9Xq0vNwQGgPDEda4_aeU', 'kdt9pce6fkj2ot100ot0ol61fld2', 'shirts', 'adult'],
  ['T-shirt Champion junior 24/25', 15, 'tshirt-champion-junior-24-25', '_D-A_EAqtrFEjw1051dcTLd9Xq0vNwQGgPDEda4_aeU', 'kdt9pce6fkj2ot100ot0ol61fld2', 'shirts', 'kid'],
  ['Écharpe acrylique ASNL 25/26', 20, 'echarpe-acrylique-asnl-25-26', 'lmthHm7IoL3zR1Hn6ZfSBLzpGM84YBS3UJXOAPUdakA', 'od9gw5f6wzij38rk4b91x3pm2cdy'],
  ['Écharpe HD ASNL 25/26', 20, 'echarpe-hd-asnl-25-26', 'Y0KDQ2DLarWD0hA8iQiPzuapOXLZSuWP7T0-IKr2V3I', 'mewqzte0n30j59vp5omv6ob49lda'],
  ['Casquette LS ASNL blanche 24/25', 15, 'casquette-ls-asnl-24-25?color=blanche', 'P8EaPYYern5oyH7Hgbb7vWequtngkceVdV9I5pTC84I', 'fwqils5f00nfk1ups1l2tjdmf801', 'caps'],
  ['Casquette LS ASNL rouge 24/25', 15, 'casquette-ls-asnl-24-25?color=rouge', 'dhiFm30_9bBSFs8yjLOzGFNY4ZJq7OrT9p_7NUctx70', 'd5uplczttaswenokq133n4y1g5r1', 'caps'],
  ['Petit fanion ASNL blanc et rouge', 10, 'petit-fanion-asnl?color=blanc%2Frouge', 'jHLLQvOycmu5Q3bkKyFR0ZMZm2cJu9jbo8fEcUpyo0M', 'r7z09asgqaktjfeczkdt79hkeqm8'],
  ['Petit fanion ASNL noir et or', 10, 'petit-fanion-asnl?color=noir%2For', 'QflL2vH5UB8QySUMW1TFtK65I2W3x6RUE1wHi103e6A', 'dw57wr39ijkuthpm1r05ec4yh61m'],
  ['Petit fanion ASNL rouge et blanc', 10, 'petit-fanion-asnl?color=rouge%2Fblanc', '8hehFoVl6VXCc--_ibP0y37A2_udjQVbEZkb8PF_oGg', 'srcnjd4v7cizoqwxr5nkcolkp076'],
  ['Porte-clés décapsuleur ASNL 25/26', 6, 'porte-cle-decapsuleur-asnl-25-26', 'HehYdWKFaI50_Em6H3VfBh5JtoMlCkgg5LMAAnqxjeY', 'vam1ch9ixx05yn3zx0hl81bvpequ'],
  ['Porte-clés ballon ASNL 25/26', 6, 'porte-cle-ballon-asnl-25-26', '6hl4llYMdLyHeHMva1diL_ghvGAbynDTCT6ykP3IQDs', 'uexzd9pdn2nie7hszyb6wernft5l'],
  ['Porte-clés métal doré ASNL 25/26', 6, 'porte-cle-metal-dore-asnl-25-26?color=dor%C3%A9', '75TMPn7WZK8ycSCTZOR6uH_Mybtu6_0_N-PK-KRDToM', 'eo1e9gdxe3rcmdbksrw3f41lsooe'],
  ['Porte-clés métal argenté ASNL 25/26', 6, 'porte-cle-metal-argente-asnl-25-26?color=argent%C3%A9', 'pa-2Lm0lUYFl6C0R_rBTc430qSyxS0zvBUVBk7WPctU', 'fri1nlv7fu3gzntbtnkjcn04v90l'],
  ['Porte-clés jeton ASNL 25/26', 6, 'porte-cle-jeton-asnl-25-26', 'z_ky8AO1JB4ue3T8lRa0DulIShu7boY2zTkKnWk3U6g', 's5yvatnr21ilz7ovrjzb4ssa5ojx'],
  ['Porte-clés maillot ASNL 25/26', 6, 'porte-cle-maillot-asnl-25-26', 'EP0jJci5Su1zZWVNmCVM--48LD09seSB0MYSacnnh_g', 'xc813s1f2rcfv4ansa884oevwuyo', 'jerseys'],
  ['Tour de cou ASNL 25/26', 3, 'tour-de-cou-asnl-25-26', 'A9xafxuvNqc5YwWFXQj2R56MvCF3189NxQtImH25oTY', 'jul8tohyaskd85ogq64cz5vulg65'],
  ['Porte-clés PVC ASNL 25/26', 6, 'porte-cle-pvc-asnl-25-26', 'zu8DmCbTWFiqDduMFlnWpp-X38oJ4WnWSp6Yg5UnGDY', 'uq4qp3yipnmqsplude4f09qnuqsy'],
] satisfies ListedProduct[];

export const products = (catalog as ListedProduct[]).map(([name, price, slug, signature, imageKey, category = 'accessories', age]) => ({
  name, price, category, age,
  href: official + '/official/products/' + slug + (slug.includes('?') ? '' : '?color=-'),
  image: 'https://grinta-imgproxy-production.herokuapp.com/' + signature + '/w:600/plain/s3://grinta-assets-production/' + imageKey,
}));
