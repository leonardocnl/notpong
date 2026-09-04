import { LeaderboardManager } from './pong/src/utils/LeaderboardManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const leaderboardContainer = document.getElementById('leaderboardContainer');
    const clearBtn = document.getElementById('clearLeaderboardBtn');

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            LeaderboardManager.clear();
            if (leaderboardContainer) {
                leaderboardContainer.innerHTML = '<div class="text-muted-text text-center w-full" style="padding: 2rem; border: 1px solid var(--color-border-subtle); background-color: #0c0c0c;">Nenhuma pontuação ainda. Jogue para registrar!</div>';
            }
        });
    }

    if (!leaderboardContainer) return;

    const leaderboard = LeaderboardManager.get();

    if (leaderboard.length === 0) {
        leaderboardContainer.innerHTML = '<div class="text-muted-text text-center w-full" style="padding: 2rem; border: 1px solid var(--color-border-subtle); background-color: #0c0c0c;">Nenhuma pontuação ainda. Jogue para registrar!</div>';
        return;
    }

    const colors = ['text-gold', 'text-silver', 'text-bronze', 'text-surface-variant'];

    leaderboardContainer.innerHTML = leaderboard.map((entry, index) => {
        const colorClass = colors[index] || 'text-surface-variant';
        const timeClass = index === 0 ? 'text-interactive-red font-bold' : 'text-primary';
        const delay = 0.5 + (index * 0.1);
        return `
                <div class="leaderboard-item flex items-center justify-between opacity-0 animate-fade-in" style="animation-delay: ${delay}s; font-size: 14px;">
                    <div class="flex items-center gap-4">
                        <span class="${colorClass}" style="width: 2rem; display: inline-block;">${index + 1}.</span>
                        <span class="text-primary">${entry.name}</span>
                    </div>
                    <span class="${timeClass}">${Number(entry.time).toFixed(2)}s</span>
                </div>
        `;
    }).join('');
});
