const rules = {
    'zh-CN': [
        { threshold: 1e8, unit: '亿', divisor: 1e8 }, // 亿
        { threshold: 1e4, unit: '万', divisor: 1e4 }, // 万
        { threshold: 1, unit: '', divisor: 1 }        // 无单位
    ],
    'en-US': [
        { threshold: 1e9, unit: 'B', divisor: 1e9 }, // 十亿
        { threshold: 1e6, unit: 'M', divisor: 1e6 }, // 百万
        { threshold: 1e3, unit: 'k', divisor: 1e3 }, // 千
        { threshold: 1, unit: '', divisor: 1 }       // 无单位
    ]
};
/**
 * 格式化大数字为缩写形式（支持中文/英文）
 * @param {number} num - 要格式化的数字
 * @param {Object} options - 配置项
 * @param {string} [options.locale='zh-CN'] - 语言（zh-CN/en-US）
 * @param {number} [options.maxFractionDigits=1] - 保留小数位数
 * @returns {string} 缩写后的数字（如 1.2万、1.2M）
 */
export function formatLargeNumber(num: number, options: { locale?: keyof typeof rules, precision?: number } = {}) {
    const {
        locale = 'zh-CN',
        precision = 1
    } = options;

    // 处理非数字/0的情况
    if (isNaN(num) || num === 0) return '0';

    // 获取当前语言的规则（默认中文）
    const langRules = rules[locale] || rules['zh-CN'];

    // 匹配当前数字对应的量级规则
    const rule = langRules.find(rule => Math.abs(num) >= rule.threshold) || { unit: '', divisor: 1 };

    // 计算缩写后的数值
    const abbreviatedNum = num / rule.divisor;

    // 拼接数值和单位
    return `${abbreviatedNum.toFixed(precision)}${rule.unit}`;
}
