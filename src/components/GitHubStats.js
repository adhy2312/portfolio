import React, { useEffect, useState, useRef } from 'react';
import './GitHubStats.css';
import { FiGithub, FiStar, FiGitCommit, FiCode } from 'react-icons/fi';

const USERNAME = 'adhy2312';

const GitHubStats = () => {
  const [stats, setStats] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [userRes, reposRes] = await Promise.all([
          fetch(`https://api.github.com/users/${USERNAME}`),
          fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=6&sort=updated`)
        ]);
        if (!userRes.ok) throw new Error('GitHub API limit');
        const userData = await userRes.json();
        const reposData = await reposRes.json();
        setStats(userData);
        setRepos(reposData.slice(0, 3));
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Draw mini contribution-style heatmap canvas (random for now, can wire to API)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cols = 26, rows = 7;
    const cell = 12, gap = 3;
    canvas.width = cols * (cell + gap);
    canvas.height = rows * (cell + gap);
    const colors = ['#161b22', '#0d4429', '#006d32', '#26a641', '#39d353'];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const v = Math.random();
        const ci = v < 0.6 ? 0 : v < 0.75 ? 1 : v < 0.85 ? 2 : v < 0.95 ? 3 : 4;
        ctx.fillStyle = colors[ci];
        ctx.beginPath();
        const x = c * (cell + gap), y = r * (cell + gap);
        ctx.roundRect(x, y, cell, cell, 3);
        ctx.fill();
      }
    }
  }, [loading]);

  return (
    <section className="github-stats-section" id="github">
      <div className="container">
        <div className="github-header">
          <FiGithub size={22} />
          <span className="section-label">// open source</span>
          <a href={`https://github.com/${USERNAME}`} target="_blank" rel="noopener noreferrer" className="gh-profile-link">
            @{USERNAME} ↗
          </a>
        </div>

        {loading && (
          <div className="gh-loading">
            {[1,2,3].map(i => <div key={i} className="gh-skeleton" style={{animationDelay: `${i*0.15}s`}} />)}
          </div>
        )}

        {!loading && !error && stats && (
          <div className="gh-content">
            {/* Stats row */}
            <div className="gh-stats-row">
              {[
                { icon: <FiCode />, value: stats.public_repos, label: 'Repositories' },
                { icon: <FiGitCommit />, value: stats.followers, label: 'Followers' },
                { icon: <FiStar />, value: repos.reduce((a, r) => a + (r.stargazers_count || 0), 0) + '+', label: 'Stars Earned' },
              ].map((s, i) => (
                <div key={i} className="gh-stat-card glass-card">
                  <span className="gh-stat-icon">{s.icon}</span>
                  <span className="gh-stat-val">{s.value}</span>
                  <span className="gh-stat-label">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Heatmap */}
            <div className="gh-heatmap-wrapper">
              <div className="gh-heatmap-label">Activity (last 6 months)</div>
              <canvas ref={canvasRef} className="gh-heatmap-canvas" />
            </div>

            {/* Top repos */}
            {repos.length > 0 && (
              <div className="gh-repos">
                {repos.map((repo, i) => (
                  <a
                    key={i}
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gh-repo-card glass-card"
                  >
                    <div className="gh-repo-top">
                      <span className="gh-repo-name">{repo.name}</span>
                      <span className="gh-repo-stars"><FiStar size={12} /> {repo.stargazers_count}</span>
                    </div>
                    <p className="gh-repo-desc">{repo.description || 'No description'}</p>
                    {repo.language && (
                      <span className="gh-repo-lang">{repo.language}</span>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="gh-error">
            <FiGithub size={32} />
            <p>GitHub stats unavailable (API rate limit). <a href={`https://github.com/${USERNAME}`} target="_blank" rel="noopener noreferrer">View profile directly ↗</a></p>
          </div>
        )}
      </div>
    </section>
  );
};

export default GitHubStats;
