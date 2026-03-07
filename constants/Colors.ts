/**
 * 主婦・料理人向け：見やすさ・タップしやすさ重視のカラーパレット
 * - 温かみのある色調
 * - 食材・鮮度を連想するティール系メイン
 * - 緊急時は視認性の高い色
 */
const primary = '#0D9488'; // ティール：食材・鮮度・安心感
const primaryDark = '#0F766E';
const primarySoft = '#14B8A6'; // ボタン用：薄めのティール（白文字が読める範囲）
const urgent = '#C62828'; // 期限切れ・今日：明確な赤
const soon = '#E65100'; // もうすぐ：黄みのオレンジ（赤と明確に区別）
const backgroundWhite = '#ffffff'; // 白で統一
const cardBg = '#ffffff'; // カード背景（白）
const textPrimary = '#1C1917'; // 濃いめで視認性UP
const textMuted = '#57534E';
const border = '#E7E5E4';

const tintColorLight = primary;
const tintColorDark = '#5EEAD4'; // ティールの明るいバリアント

export default {
  light: {
    text: textPrimary,
    background: backgroundWhite,
    tint: tintColorLight,
    tabIconDefault: '#A8A29E',
    tabIconSelected: tintColorLight,
    // セマンティック
    primary,
    primaryDark,
    primarySoft,
    urgent,
    soon,
    cardBg,
    textMuted,
    border,
  },
  dark: {
    text: '#FAFAF9',
    background: '#1C1917',
    tint: tintColorDark,
    tabIconDefault: '#A8A29E',
    tabIconSelected: tintColorDark,
    primary: tintColorDark,
    primaryDark: '#2DD4BF',
    primarySoft: '#2DD4BF',
    urgent: '#EF5350', // 明確な赤
    soon: '#FF9800', // 黄みのオレンジ
    cardBg: '#292524',
    textMuted: '#A8A29E',
    border: '#44403C',
  },
};
