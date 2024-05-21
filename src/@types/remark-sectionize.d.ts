declare module 'remark-sectionize' {
  function plugin(): (tree: import('mdast').Root) => void;
  export default plugin;
}
