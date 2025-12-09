import { kv } from "~~/server/utils/redis/index";

type modelType = "glm-4.6" | "glm-4.5" | "glm-4.5-air" | "glm-4.5-x" | "glm-4.5-airx" | "glm-4.5-flash" | "glm-4-plus" | "glm-4-airx" | "glm-4-flashx"

type Message = {
    role: 'user' | 'system';
    content: string;
} | {
    role: 'assistant';
    content: string;
    tool_calls?: {
        id: string;
        type: string;
        function: {
            name: string;
            arguments: string;
        }
    }[];
} | {
    role: 'tool';
    content: string;
    tool_call_id: string;
}

type Tool = {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters?: Record<string, any>;
    }
} | {
    type: "retrieval";
    retrieval: {
        knowledge_id: string;
        prompt_template: string;
    }
} | {
    type: "web_search";
    web_search: {
        search_engine: "search_std" | "search_pro" | "search_pro_sogou" | "search_pro_quark";
        enable?: boolean;
        search_query?: string;
        search_intent?: boolean;
        count?: number;
        search_domain_filter?: string;
        search_recency_filter?: 'oneDay' | 'oneWeek' | 'oneMonth' | 'oneYear' | 'noLimit';
        content_size?: "medium" | "high";
        result_sequence?: "before" | "after";
        search_result?: boolean;
        require_search?: boolean;
        search_prompt?: string;
    }
}

type ChatCompletionBody = {
    model?: modelType;
    messages: Message[];
    temperature?: number;
    top_p?: number;
    do_sample?: boolean;
    stream?: boolean;
    thinking?: { type: 'enabled' | 'disabled'; };
    max_tokens?: number;
    response_format?: { type: 'text' | 'json_object' };
    tools?: Tool[];
    tool_choice?: 'auto',
}

type Choice = {
    index: number;
    message: {
        role: string;
        content?: string;
        reasoning_content?: string;
    };
    finish_reason: 'stop' | 'length' | 'tool_calls' | "sensitive" | "network_error";
}

type ChatCompletionResponse = {
    id: string;
    request_id: string;
    created: number;
    model: modelType;
    choices: Choice[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        prompt_tokens_details: {
            cached_tokens: number;
        }
    };
    video_result?: {
        url: string;
        cover_image_url: string;
    }[];
    web_search?: {
        icon: string //来源网站的图标
        title: string //搜索结果的标题
        link: string //搜索结果的网页链接
        media: string //搜索结果网页的媒体来源名称
        publish_date: string //网站发布时间
        content: string //搜索结果网页引用的文本内容
        refer: string //角标序号
    }[];
    content_filter?: {
        role: string;
        level: number;
    }[];
}

async function callChatCompletions(body: ChatCompletionBody): Promise<ChatCompletionResponse> {
    const bodyText = JSON.stringify({
        model: "glm-4.5-flash",
        temperature: 0,
        ...body,
    })
    const response = await fetch(
        "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.ZAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: bodyText
        }
    );

    if (!response.ok) {
        console.error('API 调用失败:', response.status, response.statusText);
        return Promise.reject(response.statusText);
    }
    const data = await response.json();
    await kv.ai.log("glm", data.id, {
        request: bodyText,
        response: JSON.stringify(data),
    });
    return data
}

export const zhipuAI = {
    chat: callChatCompletions,
}

