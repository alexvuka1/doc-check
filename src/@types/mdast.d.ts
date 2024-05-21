import { Parent } from 'mdast';

declare module 'mdast' {
  interface Section extends Parent {
    /**
     * Node type of section.
     */
    type: 'section';
    /**
     * Section rank.
     *
     * A value of `1` is said to be the highest rank and `6` the lowest.
     */
    depth: 1 | 2 | 3 | 4 | 5 | 6;
  }

  interface RootContentMap {
    section: Section;
  }
}
