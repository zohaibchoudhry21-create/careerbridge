import AtlanticBlue, {
  A4_HEIGHT,
  A4_WIDTH,
  ATLANTIC_BLUE_SAMPLE_DATA,
} from '../../features/resumeBuilder/templates/AtlanticBlue';
import ClassicClear, {
  CLASSIC_CLEAR_SAMPLE_DATA,
} from '../../features/resumeBuilder/templates/ClassicClear';

const frameStyle = {
  width: A4_WIDTH,
  height: A4_HEIGHT,
  overflow: 'hidden',
  background: '#fff',
};

export default function HeroResumeCapture() {
  return (
    <div className="bg-white p-8">
      <div id="atlantic-blue-capture" data-capture-ready="true" style={frameStyle}>
        <AtlanticBlue resumeData={ATLANTIC_BLUE_SAMPLE_DATA} />
      </div>
      <div id="classic-clear-capture" data-capture-ready="true" style={{ ...frameStyle, marginTop: 32 }}>
        <ClassicClear resumeData={CLASSIC_CLEAR_SAMPLE_DATA} />
      </div>
    </div>
  );
}
