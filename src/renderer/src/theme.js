import { createContext, useState, useMemo } from 'react'
import { createTheme } from '@mui/material/styles'

// =================================================================================
//  COLOR TOKEN DEFINITIONS
// =================================================================================

// Theme 1: Original Default Theme
export const defaultTokens = (mode) => ({
  ...(mode === 'dark'
    ? {
        grey: {
          100: '#e0e0e0',
          200: '#c2c2c2',
          300: '#a3a3a3',
          400: '#858585',
          500: '#666666',
          600: '#525252',
          700: '#3d3d3d',
          800: '#292929',
          900: '#141414'
        },
        primary: {
          100: '#d0d1d5',
          200: '#a1a4ab',
          300: '#727681',
          400: '#1f2a40',
          500: '#141b2d',
          600: '#101624',
          700: '#0c101b',
          800: '#080b12',
          900: '#040509'
        },
        greenAccent: {
          100: '#dbf5ee',
          200: '#b7ebde',
          300: '#94e2cd',
          400: '#70d8bd',
          500: '#4cceac',
          600: '#3da58a',
          700: '#2e7c67',
          800: '#1e5245',
          900: '#0f2922'
        },
        redAccent: {
          100: '#f8dcdb',
          200: '#f1b9b7',
          300: '#e99592',
          400: '#e2726e',
          500: '#db4f4a',
          600: '#af3f3b',
          700: '#832f2c',
          800: '#58201e',
          900: '#2c100f'
        },
        blueAccent: {
          100: '#e1e2fe',
          200: '#c3c6fd',
          300: '#a4a9fc',
          400: '#868dfb',
          500: '#6870fa',
          600: '#535ac8',
          700: '#3e4396',
          800: '#2a2d64',
          900: '#151632'
        }
      }
    : {
        grey: {
          100: '#141414',
          200: '#292929',
          300: '#3d3d3d',
          400: '#525252',
          500: '#666666',
          600: '#858585',
          700: '#a3a3a3',
          800: '#c2c2c2',
          900: '#e0e0e0'
        },
        primary: {
          100: '#040509',
          200: '#080b12',
          300: '#0c101b',
          400: '#f2f0f0',
          500: '#141b2d',
          600: '#434957',
          700: '#727681',
          800: '#a1a4ab',
          900: '#d0d1d5'
        },
        greenAccent: {
          100: '#0f2922',
          200: '#1e5245',
          300: '#2e7c67',
          400: '#3da58a',
          500: '#4cceac',
          600: '#70d8bd',
          700: '#94e2cd',
          800: '#b7ebde',
          900: '#dbf5ee'
        },
        redAccent: {
          100: '#2c100f',
          200: '#58201e',
          300: '#832f2c',
          400: '#af3f3b',
          500: '#db4f4a',
          600: '#e2726e',
          700: '#e99592',
          800: '#f1b9b7',
          900: '#f8dcdb'
        },
        blueAccent: {
          100: '#151632',
          200: '#2a2d64',
          300: '#3e4396',
          400: '#535ac8',
          500: '#6870fa',
          600: '#868dfb',
          700: '#a4a9fc',
          800: '#c3c6fd',
          900: '#e1e2fe'
        }
      })
})

// Theme 2: Simple Black & White Theme
export const simpleTokens = (mode) => ({
  ...(mode === 'dark'
    ? {
        grey: {
          100: '#e0e0e0',
          200: '#c2c2c2',
          300: '#a3a3a3',
          400: '#858585',
          500: '#505051',
          600: '#525252',
          700: '#3d3d3d',
          800: '#292929',
          900: '#141414'
        },
        primary: {
          100: '#F5F5F6',
          200: '#ECECED',
          300: '#C9C9CA',
          400: '#959596',
          500: '#505051',
          600: '#3A3A45',
          700: '#28283A',
          800: '#19192E',
          900: '#0F0F26'
        },
        greenAccent: {
          100: '#CEFCD1',
          200: '#9FF9AC',
          300: '#6DEE8D',
          400: '#48DE7C',
          500: '#14C965',
          600: '#0EAC65',
          700: '#0A9061',
          800: '#067458',
          900: '#036052'
        },
        redAccent: {
          100: '#FFE4D8',
          200: '#FFC2B2',
          300: '#FF9A8B',
          400: '#FF746F',
          500: '#FF3F49',
          600: '#DB2E46',
          700: '#B71F42',
          800: '#93143C',
          900: '#7A0C39'
        },
        blueAccent: {
          100: '#CBFCEE',
          200: '#98FAE7',
          300: '#63F1E1',
          400: '#3CE3DE',
          500: '#04C6D1',
          600: '#029BB3',
          700: '#027596',
          800: '#015479',
          900: '#003D64'
        }
      }
    : {
        grey: {
          100: '#141414',
          200: '#292929',
          300: '#3d3d3d',
          400: '#525252',
          500: '#666666',
          600: '#858585',
          700: '#a3a3a3',
          800: '#c2c2c2',
          900: '#e0e0e0'
        },
        primary: {
          100: '#212121',
          200: '#bababa',
          300: '#989898',
          400: '#767676',
          500: '#f5f5f5',
          600: '#dcdcdc',
          700: '#c2c2c2',
          800: '#a3a3a3',
          900: '#858585'
        },
        greenAccent: {
          100: '#dbf5ee',
          200: '#b7ebde',
          300: '#94e2cd',
          400: '#70d8bd',
          500: '#4cceac',
          600: '#3da58a',
          700: '#2e7c67',
          800: '#1e5245',
          900: '#0f2922'
        },
        redAccent: {
          100: '#f8dcdb',
          200: '#f1b9b7',
          300: '#e99592',
          400: '#e2726e',
          500: '#db4f4a',
          600: '#af3f3b',
          700: '#832f2c',
          800: '#58201e',
          900: '#2c100f'
        },
        blueAccent: {
          100: '#e1e2fe',
          200: '#c3c6fd',
          300: '#a4a9fc',
          400: '#868dfb',
          500: '#6870fa',
          600: '#535ac8',
          700: '#3e4396',
          800: '#2a2d64',
          900: '#151632'
        }
      })
})

// Theme 3: Twitch Purple Theme
export const twitchTokens = (mode) => ({
  ...(mode === 'dark'
    ? {
        grey: {
          100: '#f0f0f0',
          200: '#e0e0e0',
          300: '#d1d1d1',
          400: '#c2c2c2',
          500: '#b3b3b3',
          600: '#8f8f8f',
          700: '#6b6b6b',
          800: '#484848',
          900: '#242424'
        },
        primary: {
          100: '#dcdce3',
          200: '#b9b9c7',
          300: '#9696ab',
          400: '#73738f',
          500: '#18181B',
          600: '#131316',
          700: '#0e0e10',
          800: '#0a0a0b',
          900: '#050505'
        },
        purpleAccent: {
          100: '#e9dffe',
          200: '#d3befe',
          300: '#bd9efe',
          400: '#a77dfd',
          500: '#9146FF',
          600: '#7438cc',
          700: '#572a99',
          800: '#3a1c66',
          900: '#1d0e33'
        },
        greenAccent: {
          100: '#e3fcec',
          200: '#c8f9d9',
          300: '#adf6c6',
          400: '#92f3b3',
          500: '#77F0A0',
          600: '#5fc080',
          700: '#479060',
          800: '#306040',
          900: '#183020'
        },
        redAccent: {
          100: '#fde9e9',
          200: '#fbd3d2',
          300: '#f9bdbc',
          400: '#f7a7a5',
          500: '#F59190',
          600: '#c47473',
          700: '#935756',
          800: '#623a3a',
          900: '#311d1d'
        },
        blueAccent: {
          100: '#e6e0ff',
          200: '#ccc2ff',
          300: '#b3a3ff',
          400: '#9985ff',
          500: '#8066FF',
          600: '#6652cc',
          700: '#4d3d99',
          800: '#332966',
          900: '#191433'
        }
      }
    : {
        grey: {
          100: '#141414',
          200: '#292929',
          300: '#3d3d3d',
          400: '#525252',
          500: '#666666',
          600: '#858585',
          700: '#a3a3a3',
          800: '#c2c2c2',
          900: '#e0e0e0'
        },
        primary: {
          100: '#242424',
          200: '#e0e0e0',
          300: '#d1d1d1',
          400: '#c2c2c2',
          500: '#F7F7F8',
          600: '#c6c6c6',
          700: '#949494',
          800: '#636363',
          900: '#313131'
        },
        purpleAccent: {
          100: '#1d0e33',
          200: '#3a1c66',
          300: '#572a99',
          400: '#7438cc',
          500: '#9146FF',
          600: '#a77dfd',
          700: '#bd9efe',
          800: '#d3befe',
          900: '#e9dffe'
        },
        greenAccent: {
          100: '#183020',
          200: '#306040',
          300: '#479060',
          400: '#5fc080',
          500: '#77F0A0',
          600: '#92f3b3',
          700: '#adf6c6',
          800: '#c8f9d9',
          900: '#e3fcec'
        },
        redAccent: {
          100: '#311d1d',
          200: '#623a3a',
          300: '#935756',
          400: '#c47473',
          500: '#F59190',
          600: '#f7a7a5',
          700: '#f9bdbc',
          800: '#fbd3d2',
          900: '#fde9e9'
        },
        blueAccent: {
          100: '#191433',
          200: '#332966',
          300: '#4d3d99',
          400: '#6652cc',
          500: '#8066FF',
          600: '#9985ff',
          700: '#b3a3ff',
          800: '#ccc2ff',
          900: '#e6e0ff'
        }
      })
})

// Theme 4: Discord-Style Theme
export const discordTokens = (mode) => ({
  ...(mode === 'dark'
    ? {
        grey: {
          100: '#e3e5e8',
          200: '#c7c9cc',
          300: '#abacb1',
          400: '#8f9095',
          500: '#72737a',
          600: '#5c5c62',
          700: '#454549',
          800: '#2e2e31',
          900: '#171718'
        },
        primary: {
          100: '#c5c7d0',
          200: '#9a9eb2',
          300: '#707493',
          400: '#454a75',
          500: '#2f3136',
          600: '#25272b',
          700: '#1c1d20',
          800: '#121316',
          900: '#09090b'
        },
        blurpleAccent: {
          100: '#d2d4fe',
          200: '#a5a9fe',
          300: '#787efd',
          400: '#4b52fc',
          500: '#5865F2',
          600: '#4651c2',
          700: '#353d91',
          800: '#232861',
          900: '#121430'
        },
        greenAccent: {
          100: '#c7f0d4',
          200: '#9ee1b0',
          300: '#76d18b',
          400: '#4ec267',
          500: '#24B44B',
          600: '#1d8f3c',
          700: '#166b2d',
          800: '#10481e',
          900: '#08240f'
        },
        redAccent: {
          100: '#fad5d6',
          200: '#f6abae',
          300: '#f18185',
          400: '#ed575c',
          500: '#ED4245',
          600: '#be3537',
          700: '#8e282a',
          800: '#5f1a1c',
          900: '#2f0d0e'
        },
        blueAccent: {
          100: '#e1e2fe',
          200: '#c3c6fd',
          300: '#a4a9fc',
          400: '#868dfb',
          500: '#6870fa',
          600: '#535ac8',
          700: '#3e4396',
          800: '#2a2d64',
          900: '#151632'
        }
      }
    : {
        grey: {
          100: '#171718',
          200: '#2e2e31',
          300: '#454549',
          400: '#5c5c62',
          500: '#72737a',
          600: '#8f9095',
          700: '#abacb1',
          800: '#c7c9cc',
          900: '#e3e5e8'
        },
        primary: {
          100: '#09090b',
          200: '#121316',
          300: '#1c1d20',
          400: '#25272b',
          500: '#f2f3f5',
          600: '#c2c2c2',
          700: '#919191',
          800: '#616161',
          900: '#303030'
        },
        blurpleAccent: {
          100: '#121430',
          200: '#232861',
          300: '#353d91',
          400: '#4651c2',
          500: '#5865F2',
          600: '#7984f5',
          700: '#9ba2f7',
          800: '#bdc1fa',
          900: '#dedffc'
        },
        greenAccent: {
          100: '#08240f',
          200: '#10481e',
          300: '#166b2d',
          400: '#1d8f3c',
          500: '#24B44B',
          600: '#4ec267',
          700: '#76d18b',
          800: '#9ee1b0',
          900: '#c7f0d4'
        },
        redAccent: {
          100: '#2f0d0e',
          200: '#5f1a1c',
          300: '#8e282a',
          400: '#be3537',
          500: '#ED4245',
          600: '#ed575c',
          700: '#f18185',
          800: '#f6abae',
          900: '#fad5d6'
        },
        blueAccent: {
          100: '#e1e2fe',
          200: '#c3c6fd',
          300: '#a4a9fc',
          400: '#868dfb',
          500: '#6870fa',
          600: '#535ac8',
          700: '#3e4396',
          800: '#2a2d64',
          900: '#151632'
        }
      })
})

// =================================================================================
//  MUI THEME SETTINGS
// =================================================================================
export const themeSettings = (themeName, mode) => {
  let colors
  let secondaryColor
  let focusColor

  switch (themeName) {
    case 'simple':
      colors = simpleTokens(mode)
      secondaryColor = colors.grey[500]
      focusColor = colors.grey[mode === 'dark' ? 100 : 700]
      break
    case 'twitch':
      colors = twitchTokens(mode)
      secondaryColor = colors.purpleAccent[500]
      focusColor = colors.purpleAccent[500]
      break
    case 'discord':
      colors = discordTokens(mode)
      secondaryColor = colors.blurpleAccent[500]
      focusColor = colors.blurpleAccent[500]
      break
    case 'default':
    default:
      colors = defaultTokens(mode)
      secondaryColor = colors.blueAccent[500]
      focusColor = colors.greenAccent[400]
      break
  }

  const customSemantics = (mode) => {
    const isDark = mode === 'dark'
    return {
      background: isDark ? colors.primary[700] : colors.primary[400],
      headline: isDark ? colors.grey[100] : colors.grey[900],
      subHeadline: isDark ? colors.grey[300] : colors.grey[700],
      paragraph: isDark ? colors.grey[400] : colors.grey[600],
      tertiary: isDark ? colors.grey[500] : colors.grey[500],
      link: isDark ? colors.blueAccent[400] : colors.blueAccent[600],
      highlight: isDark ? colors.greenAccent[500] : colors.greenAccent[600],
      stroke: isDark ? colors.grey[800] : colors.grey[200],
      card: {
        background: isDark ? colors.primary[500] : '#ffffff',
        headline: isDark ? colors.grey[100] : colors.grey[900],
        paragraph: isDark ? colors.grey[300] : colors.grey[700]
      },
      button: {
        background: colors.blueAccent[500],
        text: '#ffffff'
      },
      form: {
        inputBackground: isDark ? colors.primary[600] : colors.grey[100],
        label: isDark ? colors.grey[100] : colors.grey[700],
        placeholder: isDark ? colors.grey[500] : colors.grey[500],
        buttonBackground: colors.greenAccent[500],
        buttonText: '#ffffff'
      },
      tag: {
        background: colors.blueAccent[900],
        text: colors.blueAccent[200]
      }
    }
  }

  const semantics = customSemantics(mode)

  const themeObj = {
    palette: {
      mode: mode,
      ...(mode === 'dark'
        ? {
            primary: { main: colors.primary[500] },
            secondary: { main: secondaryColor },
            neutral: { dark: colors.grey[700], main: colors.grey[500], light: colors.grey[100] },
            background: {
              default: colors.primary[700] || colors.primary[500],
              paper: colors.primary[900]
            }
          }
        : {
            primary: { main: colors.primary[100] },
            secondary: { main: secondaryColor },
            neutral: { dark: colors.grey[700], main: colors.grey[500], light: colors.grey[100] },
            background: { default: '#fcfcfc' }
          })
    },
    custom: semantics,
    colors: colors,
    typography: {
      fontFamily: ['Space Grotesk', 'sans-serif'].join(','),
      fontSize: 12,
      h1: { fontFamily: ['Space Grotesk', 'sans-serif'].join(','), fontSize: 40 },
      h2: { fontFamily: ['Space Grotesk', 'sans-serif'].join(','), fontSize: 32 },
      h3: { fontFamily: ['Space Grotesk', 'sans-serif'].join(','), fontSize: 24 },
      h4: { fontFamily: ['Space Grotesk', 'sans-serif'].join(','), fontSize: 20 },
      h5: { fontFamily: ['Space Grotesk', 'sans-serif'].join(','), fontSize: 16 },
      h6: { fontFamily: ['Space Grotesk', 'sans-serif'].join(','), fontSize: 14 }
    },
    components: {
      MuiTextField: {
        styleOverrides: {
          root: {
            '& label.Mui-focused': { color: focusColor },
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': { borderColor: focusColor }
            }
          }
        }
      },
      MuiDataGrid: {
        styleOverrides: {
          root: { '--DataGrid-containerBackground': { color: focusColor } }
        }
      }
    }
  }

  // --- KEY CHANGE: ATTACH THE COLORS OBJECT TO THE THEME ---

  return themeObj
}

// =================================================================================
//  CONTEXT AND HOOK
//  The useMode hook now also returns the current theme's name.
// =================================================================================
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  setTheme: () => {},
  themeName: 'default' // Provide a default value for the theme name
})

export const useMode = () => {
  const [themeState, setThemeState] = useState({ name: 'default', mode: 'dark' })

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setThemeState((prev) => ({ ...prev, mode: prev.mode === 'light' ? 'dark' : 'light' })),
      setTheme: (name) => setThemeState((prev) => ({ ...prev, name: name })),
      // Expose the current theme name so components can know which one is active
      themeName: themeState.name
    }),
    [themeState.name]
  )

  const theme = useMemo(
    () => createTheme(themeSettings(themeState.name, themeState.mode)),
    [themeState]
  )

  return [theme, colorMode]
}
