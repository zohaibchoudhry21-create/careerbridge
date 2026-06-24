export default function TemplatePageNumberFooter({ theme }) {
  if (!theme.showPageNumbers) return null;

  return (
    <footer
      style={{
        textAlign: 'center',
        fontSize: theme.smallFontSize,
        color: theme.accentColor,
        paddingTop: 16,
        paddingBottom: 24,
        opacity: 0.75,
      }}
    >
      1
    </footer>
  );
}
