export const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL,
};

// Server-only variables
export const serverEnv = {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
};

export function validateEnv() {
    const requiredPublic = [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ];

    const missing = requiredPublic.filter(
        (key) => !process.env[key] || process.env[key]?.includes("your_")
    );

    if (missing.length > 0) {
        throw new Error(
            `Missing required public environment variables: ${missing.join(", ")}`
        );
    }
}
