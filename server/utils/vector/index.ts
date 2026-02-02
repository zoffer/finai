export function L2Normalize(vector: number[]) {
    const norm = Math.sqrt(vector.reduce((acc, val) => acc + val ** 2, 0));
    const epsilon = 1e-10;
    if (Math.abs(norm - 1) < epsilon) {
        return { norm: 1, vector };
    }
    return { norm, vector: vector.map((val) => val / norm) };
}
