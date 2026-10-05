import React, { useState, useEffect } from 'react';
import './projects.css';
import { PixelCorner } from '../PixelDecoration/PixelDecoration';
import { Decode } from '../TextFX/TextFX';
import { Tilt } from '../Interactive/Interactive';
import { calculateCoverflow } from './coverflow';
import { portfolio } from '../../data/portfolio';

const PROJECT_SCENES = [
  {
    id: 'mission-1',
    missionNumber: '01',
    center: 0.17,
    positionClass: 'mission-panel--right-a',
  },
  {
    id: 'mission-2',
    missionNumber: '02',
    center: 0.5,
    positionClass: 'mission-panel--right-b',
  },
  {
    id: 'mission-3',
    missionNumber: '03',
    center: 0.83,
    positionClass: 'mission-panel--right-c',
  },
];

 // calculateCoverflow lives in ./coverflow.js (unit-tested)

// Skeleton placeholder for a single project card
const ProjectSkeleton = ({ scene }) => (
  <div className={`comic-mission-panel ${scene.positionClass} project-skeleton`}>
    <div className="skeleton-badge" />
    <div className="skeleton-title" />
    <div className="skeleton-desc" />
    <div className="skeleton-desc skeleton-desc--short" />
    <div className="skeleton-footer" />
  </div>
);

const Projects = ({ progress, sectionProgress, isActive }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const sp = sectionProgress || 0;

  useEffect(() => {
    // GitHub repo source for the mission panels
    fetch('https://api.github.com/users/Dhurgesh-mj/repos?per_page=10&sort=updated')
      .then(res => {
        if (!res.ok) throw new Error('GitHub API error');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const sorted = data
            .filter(r => !r.fork)
            .sort((a, b) => b.stargazers_count - a.stargazers_count);
          setProjects(sorted.slice(0, 3));
        } else {
          setProjects(portfolio.projects || []);
        }
      })
      .catch(() => {
        setProjects(portfolio.projects || []);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <section
      className={`projects-section ${isActive ? 'is-active' : ''}`}
      aria-label="Projects"
      style={{ pointerEvents: isActive ? 'auto' : 'none' }}
    >
      {/* Chapter title lives in nav — mission panels only here */}

      {/* Loading skeleton — show placeholders while GitHub API fetches */}
      {loading && isActive && PROJECT_SCENES.map(scene => (
        <ProjectSkeleton key={scene.id} scene={scene} />
      ))}

      {!loading && PROJECT_SCENES.map((scene, index) => {
        const project = projects[index];
        if (!project) return null;

        const state = isActive
          ? calculateCoverflow(scene.center, sp)
          : { isVisible: false };

        if (!state.isVisible) return null;

        // Support both GitHub API shape and portfolio.js shape
        const title = project.name || project.title || 'Untitled';
        const description = project.description || 'No description provided.';
        const language = project.language || (project.tech ? project.tech.join(' · ') : null);
        const stars = project.stargazers_count;
        const html_url = project.html_url || project.github;

        return (
          <div
            key={scene.id}
            className={`comic-mission-panel ${scene.positionClass}`}
            style={{
              // Inner staggered reveals key off focus (1 = fully centered).
              // clipPath forced open: the old wipe system is retired for coverflow.
              '--p': state.focus,
              clipPath: 'none',
              opacity: state.opacity,
              transform: state.transform,
              filter: state.filter,
              zIndex: state.zIndex,
              pointerEvents: state.focus > 0.45 ? 'auto' : 'none',
            }}
          >
            <Tilt max={5} className="mission-tilt">
              <div className="mission-corners">
                <PixelCorner position="top-left" color="var(--ink)" size={5} />
                <PixelCorner position="top-right" color="var(--ink)" size={5} />
                <PixelCorner position="bottom-left" color="var(--ink)" size={5} />
                <PixelCorner position="bottom-right" color="var(--ink)" size={5} />
              </div>

              <div className="mission-badge">PROJECT {scene.missionNumber}</div>

              <h3 className="mission-title"><Decode text={title} p={state.focus} /></h3>

              {language && (
                <div className="mission-tech">
                  {language}{typeof stars === 'number' ? ` · ★ ${stars}` : ''}
                </div>
              )}

              <p className="mission-desc">{description}</p>

              <div className="mission-footer">
                {html_url && (
                  <a
                    href={html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mission-link"
                  >
                    <span className="mission-link__text">GITHUB REPOSITORY</span>
                    <span className="mission-link__arrow">&rarr;</span>
                  </a>
                )}
              </div>
            </Tilt>
          </div>
        );
      })}
    </section>
  );
};

export default React.memo(Projects);
