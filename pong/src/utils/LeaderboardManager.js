export class LeaderboardManager {
    static get() {
        return JSON.parse(localStorage.getItem('pongLeaderboard')) || [];
    }
    static add(name, time) {
        let leaderboardData = this.get();
        leaderboardData.push({ name, time });
        leaderboardData.sort((entryA, entryB) => entryA.time - entryB.time);
        leaderboardData = leaderboardData.slice(0, 3);
        localStorage.setItem('pongLeaderboard', JSON.stringify(leaderboardData));
        return leaderboardData;
    }
    static clear() {
        localStorage.removeItem('pongLeaderboard');
    }
}
