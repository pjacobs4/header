import { getLovelace } from 'custom-card-helpers';

const getThemeVar = themeVar => {
  return getComputedStyle(document.body).getPropertyValue(themeVar);
};

export const defaultConfig = () => {
  if (!getLovelace()) return;
  return {
    // Main config
    locale: [],
    header_text: getLovelace().config.title || 'Home Assistant',
    disabled_mode: false,
    kiosk_mode: false,
    compact_mode: false,
    footer_mode: false,
    split_mode: false,
    disable_sidebar: false,
    hide_header: false,
    chevrons: true,
    indicator_top: false,
    hidden_tab_redirect: true,
    shadow: true,
    default_tab_on_refresh: true,

    // Colors
    background: getThemeVar('--ch-background') || 'var(--app-header-background-color)' || 'var(--primary-color)',
    elements_color: getThemeVar('--ch-elements-color') || 'var(--app-header-text-color)' || 'var(--text-primary-color)',
    menu_color: getThemeVar('--ch-menu-color') || '',
    voice_color: getThemeVar('--ch-voice-color') || '',
    options_color: getThemeVar('--ch-options-color') || '',
    all_tabs_color: getThemeVar('--ch-all-tabs-color') || '',
    notification_dot_color:
      getThemeVar('--ch-notification-dot-color') || getThemeVar('var(--accent-color)') || '#ff9800',
    tab_indicator_color: getThemeVar('--ch-tab-indicator-color') || '',
    active_tab_color: getThemeVar('--ch-active-tab-color') || '',
    tabs_color: [],

    // Tabs
    hide_tabs: [],
    show_tabs: [],
    default_tab: '',
    tab_icons: [],
    tab_text: [],
    tab_icons_and_text: false,
    tab_text_only: false,
    reverse_tab_direction: false,
    fit_tabs: false,

    // Buttons
    button_icons: [],
    button_text: [],
    reverse_button_direction: false,
    menu_dropdown: false,
    menu_hide: false,
    voice_dropdown: false,
    voice_hide: false,
    options_hide: false,
    button_scroll: false,

    // Overflow menu items
    hide_help: false,
    hide_unused: false,
    hide_refresh: false,
    hide_config: false,
    hide_edit_dash: false,
    hide_raw: false,
    hide_ch_settings: false,
    hide_reload_resources: false,

    // Custom CSS
    tabs_css: [],
    header_css: '',
    stack_css: '',
    header_text_css: '',
    active_tab_css: '',
    options_list_css: '',
    menu_css: '',
    options_css: '',
    voice_css: '',
    all_tabs_css: '',
    tab_container_css: '',
    view_css: '',
    panel_view_css: '',

    // Misc
    template_variables: '',
    exceptions: [],
    editor_warnings: true,
    restrict_users: false,
  };
};
