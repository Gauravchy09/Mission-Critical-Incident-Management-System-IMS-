/**
 * Higher-order function to wrap any async operation with retry logic (Exponential Backoff)
 * This is used to ensure database writes are resilient to transient network or load issues.
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (err) {
            lastError = err;
            console.warn(`[RETRY] Attempt ${attempt} failed: ${err instanceof Error ? err.message : err}. Retrying in ${delayMs}ms...`);
            
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
                delayMs *= 2; // Exponential backoff
            }
        }
    }
    
    throw lastError;
}
