import { useState } from 'react';
import AppIcon from '../../../components/icons/AppIcon';
import { downloadResumePdf } from '../utils/pdfDownload';

const TABS = ['Content', 'Customize', 'AI Tools'];

export default function EditorTopNav({
  resumeName,
  resumes = [],
  onRename,
  activeTab = 'Content',
  onTabChange,
  saveStatus = 'idle',
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-outline-variant/40 bg-white/95 backdrop-blur px-sm py-xs">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange?.(tab)}
              className={`px-md py-sm rounded-lg font-label-md whitespace-nowrap transition-colors ${
                tab === activeTab
                  ? 'bg-secondary/10 text-secondary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="font-label-sm text-on-surface-variant">Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="font-label-sm text-secondary">Saved ✓</span>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setNameOpen((value) => !value)}
              className="flex items-center gap-1 rounded-lg border border-outline-variant px-sm py-1.5 font-label-md text-on-surface"
            >
              {resumeName}
              <AppIcon name="expand_more" size="button" />
            </button>
            {nameOpen && (
              <div className="absolute right-0 mt-1 w-48 rounded-xl border border-outline-variant bg-white shadow-level-2 p-2 z-30">
                {resumes.map((resume) => (
                  <button
                    key={resume.id}
                    type="button"
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface-container font-body-sm"
                    onClick={() => {
                      onRename?.(resume.name);
                      setNameOpen(false);
                    }}
                  >
                    {resume.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => downloadResumePdf()}
            className="rounded-lg bg-secondary px-md py-1.5 font-label-md text-white hover:bg-secondary-container transition-colors"
          >
            Download
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-secondary"
              aria-label="More options"
            >
              <AppIcon name="more_vert" size="button" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-40 rounded-xl border border-outline-variant bg-white shadow-level-2 p-2 z-30">
                <button type="button" className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface-container font-body-sm">
                  Duplicate
                </button>
                <button type="button" className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface-container font-body-sm">
                  Share link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
