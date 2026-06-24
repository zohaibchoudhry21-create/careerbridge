import ColorsSection from './ColorsSection';
import DocumentSection from './DocumentSection';
import EntriesSection from './EntriesSection';
import FontSection from './FontSection';
import FontSizeSection from './FontSizeSection';
import FooterSection from './FooterSection';
import HeaderSection from './HeaderSection';
import HeadingsSection from './HeadingsSection';
import LayoutSection from './LayoutSection';
import LinksSection from './LinksSection';
import PhotoSection from './PhotoSection';
import SectionsSection from './SectionsSection';
import SpacingSection from './SpacingSection';
import TemplatesSection from './TemplatesSection';

export const CUSTOMIZE_SECTIONS = {
  document: DocumentSection,
  templates: TemplatesSection,
  layout: LayoutSection,
  fontSize: FontSizeSection,
  spacing: SpacingSection,
  entries: EntriesSection,
  headings: HeadingsSection,
  font: FontSection,
  colors: ColorsSection,
  header: HeaderSection,
  photo: PhotoSection,
  links: LinksSection,
  footer: FooterSection,
  sections: SectionsSection,
};
