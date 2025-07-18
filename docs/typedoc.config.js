export default {
  $schema: 'https://typedoc.org/schema.json',
  entryPoints: ['../src/main/index.js'],
  out: './dist',
  outputs: [
    {
      name: 'html',
      path: './docs_html',
    },
  ],
  navigationLinks: {
    Examples: 'https://camptocamp.github.io/inkmap/main/',
  },
  headings: {
    readme: false,
    document: false,
  },
  visibilityFilters: {
    protected: false,
    private: false,
    inherited: false,
    external: true,
  },
  navigation: {
    includeCategories: false,
    includeGroups: false,
    includeFolders: false,
    compactFolders: true,
    excludeReferences: true,
  },
  categorizeByGroup: false,
};
