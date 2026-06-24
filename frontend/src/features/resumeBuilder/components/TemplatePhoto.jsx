import { TEMPLATE_PROFILE_PHOTO_SIZE } from '../utils/personalDetailsPhoto';

export default function TemplatePhoto({
  photoSrc,
  theme,
  className = 'mx-auto',
  placeholderIconSize = 40,
}) {
  if (!theme.showPhoto) return null;

  const size = TEMPLATE_PROFILE_PHOTO_SIZE;

  if (photoSrc) {
    return (
      <img
        src={photoSrc}
        alt="Profile"
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: theme.photoBorderRadius,
          objectFit: 'cover',
          border: `3px solid ${theme.accentRule}`,
          display: 'block',
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: theme.photoBorderRadius,
        backgroundColor: theme.accentSurface,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ color: theme.accentColor, fontSize: placeholderIconSize }}
        aria-hidden
      >
        person
      </span>
    </div>
  );
}
