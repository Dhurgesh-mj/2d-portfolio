import React from 'react';
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

//  calculateCoverflow lives in ./coverflow.js (unit-tested)

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
  const sp = sectionProgress || 0;

  // Curated list from portfolio.js. This used to fetch the GitHub API and
  // sort by stargazers, which meant the page showed whatever was most popular
  // rather than the work that fits — and rendered different content per visit.
  const projects = portfolio.projects || [];
  const loading = false;

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

        const title = project.title || project.name || 'Untitled';
        const description = project.description || 'No description provided.';
        const language = (project.tech && project.tech.join(' · ')) || project.language || null;
        const role = project.role;
        const html_url = project.github || project.html_url;

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

              {role && (
                <div className="mission-role">{role}</div>
              )}

              {language && (
                <div className="mission-tech">{language}</div>
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
