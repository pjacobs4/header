import { invertNumArray, subscribeRenderTemplate, processTabArray } from './helpers';
import { insertSettings } from './overflow-menu';
import { conditionalConfig } from './conditional-config';
import { styleHeader } from './style-header';
import { defaultConfig } from './default-config';
import { observers } from './observers';
import { ha_elements } from './ha-elements';
import { getLovelace } from 'custom-card-helpers';
import { redirects } from './redirects';

export class CustomHeaderConfig {
  static buildConfig(ch, lovelace = getLovelace()) {
    window.chHeader = ch;
    if (!window.customHeaderUnsub) window.customHeaderUnsub = [];
    const haElem = ha_elements();
    if (!lovelace || !haElem) return;
    this.default_config = defaultConfig();
    this.config = {
      ...this.default_config,
      ...lovelace.config.custom_header,
    };
    this.template_vars = this.config.template_variables;
    this.test_config = { ...this.config, ...conditionalConfig(this.config, ha_elements()) };
    this.template_failed = false;
    this.disabled =
      (typeof this.test_config.disabled_mode == 'boolean' && this.test_config.disabled_mode) ||
      (typeof this.test_config.disabled_mode == 'string' &&
        !this.test_config.disabled_mode.includes('{{') &&
        !this.test_config.disabled_mode.includes('{%')) ||
      window.location.href.includes('disable_ch');

    const user = haElem.hass.user;
    if (!user.is_admin && !user.is_owner && this.test_config.restrict_users) {
      this.disabled = false;
    }

    this.renderTemplate(ch, ha_elements(), lovelace);
    this.catchTemplate(lovelace, haElem, ch);
  }

  static renderTemplate(ch, haElem, lovelace) {
    if (!this.disabled && lovelace.config.custom_header) {
      const template_vars = JSON.stringify(this.template_vars).replace(/\\/g, '');
      const config = JSON.stringify(this.config).replace(/\\/g, '');
      this.unsub = subscribeRenderTemplate(
        result => {
          try {
            result = result.replace(/"true"/gi, 'true');
            result = result.replace(/"false"/gi, 'false');
            result = result.replace(/""/, '');
            this.config = JSON.parse(result);
            this.config = conditionalConfig(this.config, haElem);
          } catch (e) {
            this.template_failed = true;
            this.helpfulTempError(result, e);
            this.config = { disabled_mode: true };
            this.processAndContinue(ch, haElem);
          }
          if (JSON.stringify(window.last_template_result) == JSON.stringify(this.config)) {
            this.changed = false;
            insertSettings(ch.header, this.config, haElem);
            redirects(this.config, ch);
            return;
          } else {
            clearTimeout(window.customHeaderTempTimeout);
            this.changed = true;
            window.last_template_result = this.config;
          }
          this.processAndContinue(ch, haElem);
        },
        { template: template_vars + config },
        this.config.locale,
      );
    } else {
      this.config = conditionalConfig(this.config, ha_elements());
      this.processAndContinue(ch, ha_elements());
    }
  }

  static helpfulTempError(result, error) {
    let err;
    let position = error.toString().match(/\d+/g);
    if (position) {
      position = error.toString().match(/\d+/g)[0];
      const left = result.substr(0, position).match(/[^,]*$/);
      const right = result.substr(position).match(/^[^,]*/);
      err = `${left ? left[0] : ''}${right ? right[0] : ''}`.replace('":"', ': "');
      err = `[CUSTOM-HEADER] There was an issue with the template: ${err}`;
    }
    if (err && err.includes('locale')) {
      err = '[CUSTOM-HEADER] There was an issue one of your "template_variables".';
    }
    if (err) console.log(err);
    else return;
  }

  static async catchTemplate(lovelace, haElem, ch) {
    try {
      const unsub = await this.unsub;
      if (this.changed) {
        for (const prev of window.customHeaderUnsub) prev();
        window.customHeaderUnsub = [];
        window.customHeaderUnsub.push(unsub);
      } else {
        unsub();
      }
    } catch (e) {
      this.template_failed = true;
      if (this.disabled || !lovelace.config.custom_header) return;
      console.log('[CUSTOM-HEADER] There was an error with one or more of your templates:');
      console.log(`${e.message.substring(0, e.message.indexOf(')'))})`);
      haElem.appHeader.style.display = '';
      insertSettings(ch.header, {}, haElem, haElem.hass.user);
    }
  }

  static processAndContinue(ch, haElem) {
    let config = this.config;
    if (config.disabled_mode) {
      config = { disabled_mode: true };
    } else {
      if (config.hide_tabs) config.hide_tabs = processTabArray(config.hide_tabs);
      if (config.show_tabs) config.show_tabs = processTabArray(config.show_tabs);
      if (config.show_tabs && config.show_tabs.length) config.hide_tabs = invertNumArray(config.show_tabs);
      if (config.disable_sidebar || config.menu_dropdown) config.menu_hide = true;
      if (config.voice_dropdown || !haElem.hass.config.components.includes('conversation')) config.voice_hide = true;
      if (config.header_text != undefined && config.header_text == '') {
        config.header_text = this.default_config.header_text;
      }
      if (config.header_text && config.header_text == ' ') config.header_text = '&nbsp;';
      if (config.split_mode) config.compact_mode = false;
      if (config.hide_config) config.hide_edit_dash = true;
      if (config.hide_edit_dash) config.hide_config = true;
      if (config.hide_header && config.disable_sidebar) {
        config.kiosk_mode = true;
        config.hide_header = false;
        config.disable_sidebar = false;
      }
      if (config.test_template != undefined) {
        if (this.disabled) {
          console.log(`Custom Header cannot render templates while disabled.`);
        } else if (
          typeof config.test_template == 'string' &&
          (config.test_template.toLowerCase().includes('true') || config.test_template.toLowerCase().includes('false'))
        ) {
          console.log(`Custom Header test returned: "${config.test_template}"`);
          console.log(`Warning: Boolean is returned as string instead of Boolean.`);
        } else if (typeof config.test_template == 'string') {
          console.log(`Custom Header test returned: "${config.test_template}"`);
        } else {
          console.log(`Custom Header test returned: ${config.test_template}`);
        }
      }
    }

    if (window.customHeaderTempTimeout) {
      for (const timeout of window.customHeaderTempTimeout) clearTimeout(timeout);
    }
    window.customHeaderTempTimeout = [];

    // Render config every minute.
    const template_timeout = window.setTimeout(() => {
      haElem = ha_elements();
      if (!haElem) return;
      const editor = haElem.panel ? haElem.panel.shadowRoot.querySelector('hui-editor') : null;
      if (!haElem.panel || editor || this.template_failed) return;
      if (haElem.root && haElem.root.querySelector('custom-header-editor')) return;
      this.buildConfig(ch);
    }, (60 - new Date().getSeconds()) * 1000);

    template_timeout;
    window.customHeaderTempTimeout.push(template_timeout);

    let visibilityChange = 'visibilitychange';
    if (typeof document.msHidden !== 'undefined') {
      visibilityChange = 'msvisibilitychange';
    } else if (typeof document.webkitHidden !== 'undefined') {
      visibilityChange = 'webkitvisibilitychange';
    }

    const simple_update = timeout => {
      window.setTimeout(() => {
        haElem = ha_elements();
        if (!haElem) return;
        const editor = haElem.panel ? haElem.panel.shadowRoot.querySelector('hui-editor') : null;
        if (!haElem.panel || editor || this.template_failed) return;
        if (haElem.root && haElem.root.querySelector('custom-header-editor')) return;
        CustomHeaderConfig.buildConfig(window.chHeader);
      }, timeout);
    };

    if (!window.chVisibilityAndOrientation) {
      window.addEventListener(
        'orientationchange',
        function() {
          simple_update(500);
        },
        false,
      );
      document.addEventListener(
        visibilityChange,
        function() {
          simple_update(0);
        },
        false,
      );
      window.chVisibilityAndOrientation = true;
    }

    if (haElem.root.querySelector('app-toolbar').className == 'edit-mode') return;

    if (window.customHeaderObservers) {
      for (const observer of window.customHeaderObservers) {
        observer.disconnect();
      }
      window.customHeaderObservers = [];
    }

    styleHeader(config, ch, haElem);
    observers(config, ch, haElem);
  }
}
