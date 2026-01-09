export function L2Normalize(vector: number[]) {
    const norm = Math.sqrt(vector.reduce((acc, val) => acc + val ** 2, 0));
    return { norm, vector: vector.map((val) => val / norm) };
}
