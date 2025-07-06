import { createTheme } from '@mui/material/styles';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';

// הגדרת ערכת נושא מותאמת לעברית (RTL)
const theme = createTheme({
  direction: 'rtl', // כיוון טקסט מימין לשמאל
  typography: {
    fontFamily: "'Open Sans Hebrew', 'Open Sans', 'Roboto', 'Arial', sans-serif",
    htmlFontSize: 16,
    h1: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.1rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    subtitle1: {
      fontSize: '0.875rem',
    },
    subtitle2: {
      fontSize: '0.8rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '0.875rem',
    },
    body2: {
      fontSize: '0.8rem',
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  palette: {
    primary: {
      main: '#1E2875',
      light: '#373B5C',
      dark: '#131a53',
      contrastText: '#fff',
    },
    secondary: {
      main: '#4A7DFF',
      light: '#6a93ff',
      dark: '#3357b2',
      contrastText: '#fff',
    },
    error: {
      main: '#D32F2F',
    },
    warning: {
      main: '#FFA726',
    },
    info: {
      main: '#29B6F6',
    },
    success: {
      main: '#66BB6A',
    },
    background: {
      default: '#FAFBFF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2D2D2D',
      secondary: '#555555',
      disabled: '#888888',
    },
    divider: '#CECECE',
  },
  components: {
    MuiInputBase: {
      styleOverrides: {
        input: {
          textAlign: 'right',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          textAlign: 'right',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          textAlign: 'right',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: '8px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#fff',
          borderLeft: '1px solid #CECECE',
          borderRight: 'none',
        },
      },
    },
  },
});

// פלאגינים עבור תמיכה בכיוון עברית (RTL)
const rtlPlugins = [prefixer, rtlPlugin];

export { theme, rtlPlugins };