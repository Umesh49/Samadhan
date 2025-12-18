import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    className?: string
    gradient?: boolean
}

export function GlassCard({ children, className, gradient = false, ...props }: GlassCardProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]",
                // Light mode: High opacity (85%) to ensure text readability against pattern
                "bg-white/85 border-zinc-200 text-zinc-950 hover:bg-white/95 hover:border-zinc-300",
                // Dark mode: moderate opacity, light text
                "dark:bg-zinc-900/60 dark:border-white/10 dark:text-zinc-50 dark:hover:bg-zinc-900/80",
                gradient && "bg-gradient-to-br from-white/90 to-white/60 dark:from-white/10 dark:to-white/5",
                className
            )}
            {...props}
        >
            {gradient && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-50 pointer-events-none dark:from-white/10" />
            )}
            <div className="relative z-10">{children}</div>
        </div>
    )
}
