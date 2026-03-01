import { navigateTo } from "#app";

export const navigateToLogin = () => {
    const requestURL = useRequestURL();
    const referer = requestURL.href.slice(requestURL.origin.length);
    return navigateTo({
        path: "/login",
        query: { referer },
    });
};
