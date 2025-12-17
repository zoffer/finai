import { z } from 'zod';

export async function apiParameterParse<T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> {
    const result = schema.safeParse(data);
    if (result.success) {
        return result.data;
    }
    return Promise.reject(new ApiError({
        code: "invalid_parameter",
        message: z.prettifyError(result.error)
    }));
}