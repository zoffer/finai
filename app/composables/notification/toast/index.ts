// composables/useToast.ts
import { createVNode, render, type ComponentPublicInstance } from "vue";
import ProgrammaticToast from "./toast.vue";

interface ToastInstance extends ComponentPublicInstance {
    add: (item: any, duration: number) => void;
}

let toastInstance: ToastInstance | null = null;

export const useToast = () => {
    const ensureMounted = () => {
        if (toastInstance) return toastInstance;
        if (import.meta.server) return null;

        // 1. 创建锚点元素
        // 实际内容会被组件内的 <Teleport> 发送到 body
        const container = document.createElement("div");

        const vnode = createVNode(ProgrammaticToast);

        // 保持上下文传递 (i18n, pinia 等)
        const nuxtApp = useNuxtApp();
        vnode.appContext = nuxtApp.vueApp._context;

        render(vnode, container);

        toastInstance = vnode.component?.exposed as ToastInstance;
        return toastInstance;
    };

    const show = (message: string, type: "success" | "error" | "warning", duration = 3000) => {
        const instance = ensureMounted();
        instance?.add({ id: Date.now().toString(), message, type }, duration);
    };

    return {
        success: (msg: string, duration?: number) => show(msg, "success", duration),
        error: (msg: string, duration?: number) => show(msg, "error", duration),
        warning: (msg: string, duration?: number) => show(msg, "warning", duration),
    };
};
