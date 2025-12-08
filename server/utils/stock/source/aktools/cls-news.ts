const NUXT_AKTOOLS_URL = process.env.AKTOOLS_URL;

type Data = {
    "标题": string;
    "内容": string;
    "发布日期": string;
    "发布时间": string;
}

function parseDate(dateStr: string, timeStr: string) {
    const str = `${dateStr.slice(0, 10)}T${timeStr}+08:00`
    return new Date(str);
}

export async function crawlCLSNews() {
    const res = await $fetch<Array<Data>>(`${NUXT_AKTOOLS_URL}/api/public/stock_info_global_cls`,)
    return res.map((item) => ({
        title: item["标题"],
        content: item["内容"],
        date: parseDate(item["发布日期"], item["发布时间"]),
    }))
}
