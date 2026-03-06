/**
 * Lightweight creed card reference data for Hub admin UI.
 * Extracted from ark-identity/lib/creedCardsData.ts — only id, title, category.
 */

export interface CreedCardRef {
  id: number;
  title: string;
  category: string;
}

export const CREED_CARDS: CreedCardRef[] = [
  { id: 1, title: 'THE TRIUNE GOD', category: 'Trinity & Nature of God' },
  { id: 2, title: 'ONE GOD IN THREE PERSONS', category: 'Trinity & Nature of God' },
  { id: 3, title: 'GOD THE FATHER', category: 'Trinity & Nature of God' },
  { id: 4, title: 'GOD THE SON', category: 'Trinity & Nature of God' },
  { id: 5, title: 'GOD THE HOLY SPIRIT', category: 'Trinity & Nature of God' },
  { id: 6, title: 'THE DIVINE DANCE', category: 'Trinity & Nature of God' },
  { id: 7, title: 'THE CREATOR GOD', category: 'Trinity & Nature of God' },
  { id: 8, title: 'GOD\'S SOVEREIGNTY', category: 'Trinity & Nature of God' },
  { id: 9, title: 'THE INCARNATION', category: 'Jesus Christ' },
  { id: 10, title: 'THE VIRGIN BIRTH', category: 'Jesus Christ' },
  { id: 11, title: 'FULLY GOD AND FULLY HUMAN', category: 'Jesus Christ' },
  { id: 12, title: 'CHRIST\'S SACRIFICE', category: 'Jesus Christ' },
  { id: 13, title: 'THE RESURRECTION', category: 'Jesus Christ' },
  { id: 14, title: 'THE ASCENSION', category: 'Jesus Christ' },
  { id: 15, title: 'CHRIST OUR HIGH PRIEST', category: 'Jesus Christ' },
  { id: 16, title: 'CHRIST THE HEAD', category: 'Jesus Christ' },
  { id: 17, title: 'THE COMFORTER', category: 'Holy Spirit' },
  { id: 18, title: 'REGENERATION', category: 'Holy Spirit' },
  { id: 19, title: 'SANCTIFICATION', category: 'Holy Spirit' },
  { id: 20, title: 'THE FRUIT OF THE SPIRIT', category: 'Holy Spirit' },
  { id: 21, title: 'GIFTS OF THE SPIRIT', category: 'Holy Spirit' },
  { id: 22, title: 'THE SPIRIT\'S INDWELLING', category: 'Holy Spirit' },
  { id: 23, title: 'THE GOSPEL', category: 'Salvation & Gospel' },
  { id: 24, title: 'GRACE', category: 'Salvation & Gospel' },
  { id: 25, title: 'FAITH', category: 'Salvation & Gospel' },
  { id: 26, title: 'JUSTIFICATION', category: 'Salvation & Gospel' },
  { id: 27, title: 'REPENTANCE', category: 'Salvation & Gospel' },
  { id: 28, title: 'ADOPTION', category: 'Salvation & Gospel' },
  { id: 29, title: 'INSPIRATION OF SCRIPTURE', category: 'Holy Scripture' },
  { id: 30, title: 'AUTHORITY OF SCRIPTURE', category: 'Holy Scripture' },
  { id: 31, title: 'CHRIST IN SCRIPTURE', category: 'Holy Scripture' },
  { id: 32, title: 'THE LIVING WORD', category: 'Holy Scripture' },
  { id: 33, title: 'THE CHURCH', category: 'Church & Sacraments' },
  { id: 34, title: 'THE BODY OF CHRIST', category: 'Church & Sacraments' },
  { id: 35, title: 'BAPTISM', category: 'Church & Sacraments' },
  { id: 36, title: 'THE LORD\'S SUPPER', category: 'Church & Sacraments' },
  { id: 37, title: 'COMMUNION OF SAINTS', category: 'Church & Sacraments' },
  { id: 38, title: 'ONE, HOLY, CATHOLIC, APOSTOLIC', category: 'Church & Sacraments' },
  { id: 39, title: 'DISCIPLESHIP', category: 'Christian Life' },
  { id: 40, title: 'LOVE', category: 'Christian Life' },
  { id: 41, title: 'PRAYER', category: 'Christian Life' },
  { id: 42, title: 'SPIRITUAL WARFARE', category: 'Christian Life' },
  { id: 43, title: 'PERSEVERANCE', category: 'Christian Life' },
  { id: 44, title: 'GOOD WORKS', category: 'Christian Life' },
  { id: 45, title: 'SUFFERING', category: 'Christian Life' },
  { id: 46, title: 'WITNESS', category: 'Christian Life' },
  { id: 47, title: 'THE SECOND COMING', category: 'Last Things' },
  { id: 48, title: 'RESURRECTION OF THE DEAD', category: 'Last Things' },
  { id: 49, title: 'FINAL JUDGMENT', category: 'Last Things' },
  { id: 50, title: 'NEW HEAVEN AND NEW EARTH', category: 'Last Things' },
];

/** Get unique categories in order */
export const CREED_CATEGORIES = [...new Set(CREED_CARDS.map(c => c.category))];

/** Get a card by ID */
export function getCreedCard(id: number): CreedCardRef | undefined {
  return CREED_CARDS.find(c => c.id === id);
}
