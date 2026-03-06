module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Zustand 等の ESM が使う import.meta を Web バンドルで変換する（Cannot use 'import.meta' outside a module を防ぐ）
          unstable_transformImportMeta: true,
        },
      ],
    ],
  };
};
