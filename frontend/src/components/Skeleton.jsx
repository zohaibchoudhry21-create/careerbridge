import './Skeleton.css';

const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
};

function Bone({ className = '', style, ...rest }) {
  return <span className={`sk-bone ${className}`.trim()} style={style} {...rest} />;
}

function TextSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`sk-text ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Bone
          key={index}
          className="sk-text__line"
          style={{
            width: index === lines - 1 ? '65%' : index % 2 === 0 ? '100%' : '88%',
          }}
        />
      ))}
    </div>
  );
}

function AvatarSkeleton({ size = 'md', withMeta = true, className = '' }) {
  const px = SIZE_MAP[size] || SIZE_MAP.md;
  return (
    <div className={`sk-avatar ${className}`.trim()} aria-hidden="true">
      <Bone className="sk-avatar__circle" style={{ width: px, height: px }} />
      {withMeta ? (
        <div className="sk-avatar__meta">
          <Bone style={{ width: 120, height: 12 }} />
          <Bone style={{ width: 80, height: 10 }} />
        </div>
      ) : null}
    </div>
  );
}

function CardSkeleton({ withMedia = true, lines = 2, className = '' }) {
  return (
    <div className={`sk-card ${className}`.trim()} aria-hidden="true">
      {withMedia ? <Bone className="sk-card__media" /> : null}
      <div className="sk-card__row">
        <Bone className="sk-avatar__circle" style={{ width: 40, height: 40 }} />
        <div style={{ flex: 1 }}>
          <TextSkeleton lines={lines} />
        </div>
      </div>
    </div>
  );
}

function ListSkeleton({ count = 3, className = '' }) {
  return (
    <div className={`sk-list ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="sk-list__item">
          <Bone className="sk-avatar__circle" style={{ width: 40, height: 40 }} />
          <div className="sk-list__body">
            <Bone style={{ width: '55%', height: 12 }} />
            <Bone style={{ width: '80%', height: 10 }} />
          </div>
          <Bone style={{ width: 64, height: 28, borderRadius: 999 }} />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5, columns = 4, className = '' }) {
  const template = `repeat(${columns}, minmax(0, 1fr))`;
  return (
    <div className={`sk-table ${className}`.trim()} aria-hidden="true">
      <div className="sk-table__header" style={{ gridTemplateColumns: template }}>
        {Array.from({ length: columns }, (_, index) => (
          <Bone key={`h-${index}`} style={{ width: '70%', height: 10 }} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="sk-table__row" style={{ gridTemplateColumns: template }}>
          {Array.from({ length: columns }, (_, colIndex) => (
            <Bone
              key={`${rowIndex}-${colIndex}`}
              style={{
                width: colIndex === 0 ? '85%' : '60%',
                height: 12,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Reusable shimmer skeleton for API loading states.
 *
 * @param {'card'|'list'|'table'|'avatar'|'text'} type
 * @param {number} [count] — card/list/avatar repeats
 * @param {number} [rows] — table rows
 * @param {number} [columns] — table columns
 * @param {number} [lines] — text lines (also card body lines)
 * @param {boolean} [withMedia] — card image block
 * @param {boolean} [withMeta] — avatar label lines
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} [size] — avatar size
 * @param {2|3|4} [columnsGrid] — wrap cards in a responsive grid
 */
export default function Skeleton({
  type = 'text',
  count = 1,
  rows = 5,
  columns = 4,
  lines = 3,
  withMedia = true,
  withMeta = true,
  size = 'md',
  columnsGrid,
  className = '',
  label = 'Loading content',
}) {
  let content;

  switch (type) {
    case 'card':
      content =
        count > 1 || columnsGrid ? (
          <div
            className={[
              'sk-grid',
              columnsGrid === 1 ? '' : columnsGrid ? `sk-grid--${columnsGrid}` : 'sk-grid--2',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {Array.from({ length: count }, (_, index) => (
              <CardSkeleton key={index} withMedia={withMedia} lines={lines} />
            ))}
          </div>
        ) : (
          <CardSkeleton withMedia={withMedia} lines={lines} className={className} />
        );
      break;
    case 'list':
      content = <ListSkeleton count={count} className={className} />;
      break;
    case 'table':
      content = <TableSkeleton rows={rows} columns={columns} className={className} />;
      break;
    case 'avatar':
      content =
        count > 1 ? (
          <div className={`sk-list ${className}`.trim()}>
            {Array.from({ length: count }, (_, index) => (
              <AvatarSkeleton key={index} size={size} withMeta={withMeta} />
            ))}
          </div>
        ) : (
          <AvatarSkeleton size={size} withMeta={withMeta} className={className} />
        );
      break;
    case 'text':
    default:
      content =
        count > 1 ? (
          <div className={`sk-list ${className}`.trim()}>
            {Array.from({ length: count }, (_, index) => (
              <TextSkeleton key={index} lines={lines} />
            ))}
          </div>
        ) : (
          <TextSkeleton lines={lines} className={className} />
        );
      break;
  }

  return (
    <div className="sk-root" role="status" aria-busy="true" aria-label={label}>
      {content}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export { Bone, TextSkeleton, AvatarSkeleton, CardSkeleton, ListSkeleton, TableSkeleton };
