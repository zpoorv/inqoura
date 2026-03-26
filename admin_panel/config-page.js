import { requireAdminPage } from './auth-guard.js';
import { setupAdminLayout } from './layout.js';
import { byId, inputValue, setStatus } from './shared.js';
import { loadAdminAppConfig, saveAdminAppConfig } from './firebase-client.js';

const { profile, user } = await requireAdminPage();
setupAdminLayout({ activeNav: 'config', profile, user });

function fillConfigForm(config) {
  byId('configEnableRuleBasedSuggestions').checked = Boolean(config.enableRuleBasedSuggestions);
  byId('configShowSourceAttribution').checked = Boolean(config.showSourceAttribution);
  byId('configEnableHistory').checked = Boolean(config.enableHistory);
  byId('configEnableIngredientOcr').checked = Boolean(config.enableIngredientOcr);
  byId('configEnableManualBarcodeEntry').checked = Boolean(config.enableManualBarcodeEntry);
  byId('configHomeAnnouncementTitle').value = inputValue(config.homeAnnouncementTitle);
  byId('configHomeAnnouncementBody').value = inputValue(config.homeAnnouncementBody);
  byId('configResultDisclaimer').value = inputValue(config.resultDisclaimer);
  byId('configShareFooterText').value = inputValue(config.shareFooterText);
  byId('configSupportEmail').value = inputValue(config.supportEmail);
  byId('configResultSupportMessage').value = inputValue(config.resultSupportMessage);
}

const config = await loadAdminAppConfig();
fillConfigForm(config);

byId('configForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    enableHistory: byId('configEnableHistory').checked,
    enableIngredientOcr: byId('configEnableIngredientOcr').checked,
    enableManualBarcodeEntry: byId('configEnableManualBarcodeEntry').checked,
    enableRuleBasedSuggestions: byId('configEnableRuleBasedSuggestions').checked,
    homeAnnouncementBody: byId('configHomeAnnouncementBody').value.trim() || null,
    homeAnnouncementTitle: byId('configHomeAnnouncementTitle').value.trim() || null,
    resultDisclaimer: byId('configResultDisclaimer').value.trim() || null,
    resultSupportMessage: byId('configResultSupportMessage').value.trim() || null,
    shareFooterText: byId('configShareFooterText').value.trim() || null,
    showSourceAttribution: byId('configShowSourceAttribution').checked,
    supportEmail: byId('configSupportEmail').value.trim() || null,
    updatedAt: new Date().toISOString(),
  };

  try {
    await saveAdminAppConfig(payload);
    setStatus('configStatus', 'App config saved.', 'success');
  } catch (error) {
    setStatus(
      'configStatus',
      error instanceof Error ? error.message : 'Saving app config failed.',
      'danger'
    );
  }
});
